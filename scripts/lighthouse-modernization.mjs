import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import fs from 'node:fs/promises';
const chrome=await launch({chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--no-sandbox','--disable-gpu']});
const results=[];
try{for(const device of ['mobile','desktop']){
 const result=await lighthouse('http://127.0.0.1:4180',{port:chrome.port,output:'json',onlyCategories:['performance','accessibility'],logLevel:'error'}, {extends:'lighthouse:default',settings:device==='desktop'?{formFactor:'desktop',screenEmulation:{mobile:false,width:1280,height:900,deviceScaleFactor:1,disabled:false},throttling:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1,requestLatencyMs:0,downloadThroughputKbps:0,uploadThroughputKbps:0}}:{}});
 await fs.writeFile(`docs/review/modernization/lighthouse-${device}.json`,result.report);
 const a=result.lhr.audits;results.push({device,performance:result.lhr.categories.performance.score,accessibility:result.lhr.categories.accessibility.score,LCP:a['largest-contentful-paint'].numericValue,CLS:a['cumulative-layout-shift'].numericValue,failures:Object.values(a).filter(x=>x.score===0).map(x=>({id:x.id,title:x.title}))});
}}finally{await chrome.kill();}
await fs.writeFile('docs/review/modernization/lighthouse-summary.json',JSON.stringify(results,null,2));console.log(results);
