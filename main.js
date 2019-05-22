const fs = require('fs');
 
// 网络请求，文档可参考：https://www.jianshu.com/p/1432e0f29abd
const superagent = require('superagent');
 
// 设置编码格式，文档：https://www.npmjs.com/package/superagent-charset
require('superagent-charset')(superagent);
 
// DOM操作，语法类似jquery，文档可参考：https://www.jianshu.com/p/629a81b4e013
const cheerio = require('cheerio');
 
const main = () => {
    getSheng();
}
 
// 获取页面
const getPage = async (url2) => {
    
    // 阻塞停顿，防止请求过快，被防火墙拦截
    sleep(1000);
 
    const url1 = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/'
    let response = '';
    try{
        response = (await superagent
            .get(url1 + url2)
            .set({ 
                // 模拟浏览器请求
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate',
                'content-type': 'text/html',
                'Content-Length': Buffer.byteLength(""),
                'Connection': 'keep-alive'
            })
            .buffer(true)
            // 设置编码格式
            .charset('gb2312')).text;
    } catch(err){
        console.log(err)
    }
    
    return response;
}
 
// 获取省
const getSheng = async () => {
    let time = new Date().getTime();
    let timer = setInterval(() => {
        console.log('抓取中 '+ Math.floor((new Date().getTime() - time) / 1000));
    },1000)
 
 
    let list = [];
    let page = await getPage('index.html');
    let $ = cheerio.load(page);
    let htmlList = $('.provincetr td a');
    
    for(let i = 0; i < htmlList.length; i++){
        let url = $(htmlList[i]).attr('href');
        let item = {
            name: $(htmlList[i]).text(),
            code: url.slice(0, 2) + '0000',
            children: []
        };
 
        list.push(await getShi(url, item));
    }
 
    output(list);
    clearInterval(timer);
}
 
// 获取市
const getShi = async (url, shengItem) => {
    let page = await getPage(url);
    let $ = cheerio.load(page);
    let htmlList = $('.citytr');
 
    for(let i = 0; i < htmlList.length; i++){
        let first = $(htmlList[i]).find('td').first().find('a');
        let last = $(htmlList[i]).find('td').last().find('a');
        let itemUrl = $(first).attr('href');
 
        let item = {
            name: $(last).text(),
            code: $(first).text().slice(0, 6),
            children: []
        }
 
        shengItem.children.push(await getQu(itemUrl, item));
    }
 
    return shengItem;
}
 
// 获取区
const getQu = async (itemUrl, shiItem) => {
    let page = await getPage(itemUrl);
    let $ = cheerio.load(page);
    let htmlList = $('.countytr');
 
    for(let i = 0; i < htmlList.length; i++){
        let first = $(htmlList[i]).find('td').first().find('a');
        let last = $(htmlList[i]).find('td').last().find('a');
 
        if($(last).text() && $(first).text()){
            let item = {
                name: $(last).text(),
                code: $(first).text().slice(0, 6)
            }
 
            shiItem.children.push(item);
        }
        
    }
 
    return shiItem;
}
 
const sleep = d => {
    let t = new Date().getTime();
    while(new Date().getTime() - t <= d){}
}
 
// 输出
const output = data => {
    let dataStr = JSON.stringify(data);
 
    fs.writeFileSync(
        'data.json',
        dataStr,
        function(err){
            if(err){
                console.log(err);
            }
        }
    )
}
 
main();