import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const out=process.env.REVIEW_OUTPUT ?? 'docs/review/restoration';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
for(const [width,height] of process.argv.includes('--record-only')?[]:[[375,1000],[768,1000],[1280,1000],[1920,1080],[1280,600],[640,450]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4177');await expect(page.locator('#book')).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/${width}x${height}-cover.png`,fullPage:true});
 await page.getByRole('button',{name:'Open book',exact:true}).click();await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
 await page.screenshot({path:`${out}/${width}x${height}-map.png`,fullPage:true});
 await page.getByRole('button',{name:'References',exact:true}).click();await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
 const tab=page.getByRole('tab',{name:'Srihari Kestur',exact:true});await tab.click();await page.waitForTimeout(450);
 await page.getByRole('button',{name:'Read all references',exact:true}).first().click();await expect(page.locator('.reading-document')).toHaveAttribute('data-references-all','true');
 await page.getByRole('button',{name:'Show featured quotes',exact:true}).first().click();
 await expect(page.getByRole('tab',{name:'Srihari Kestur',exact:true})).toHaveAttribute('aria-selected','true');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 results.push({width,height,overflow,errors});await page.close();
}
if(results.length)await fs.writeFile(`${out}/responsive.json`,JSON.stringify(results,null,2));
if(process.argv.includes('--matrix-only')){await browser.close();process.exit(0);}
const context=await browser.newContext({viewport:{width:1280,height:1400},recordVideo:{dir:'tmp/restoration/video',size:{width:1280,height:1400}}});
const videoStart=Date.now();const page=await context.newPage();const video=page.video();
await page.addInitScript(()=>{
 const connect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(destination,...args){
  if(destination===this.context.destination&&!window.reviewRecorder){
   const stream=this.context.createMediaStreamDestination();connect.call(this,stream);
   window.reviewChunks=[];window.reviewRecorder=new MediaRecorder(stream.stream);
   window.reviewRecorder.ondataavailable=event=>window.reviewChunks.push(event.data);
   window.reviewRecorder.start();window.reviewAudioStart=Date.now();
  }
  return connect.call(this,destination,...args);
 };
});
await page.goto('http://127.0.0.1:4177');await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
await page.locator('.audio-toggle').click();
await page.waitForFunction(()=>window.reviewRecorder);await page.waitForTimeout(800);
const audioStart=await page.evaluate(()=>window.reviewAudioStart);
const settle=()=>expect(page.locator('#book')).toHaveAttribute('data-turning','false');
await page.getByRole('button',{name:'Open book',exact:true}).click();await settle();await page.waitForTimeout(600);
await page.getByRole('button',{name:'Next page',exact:true}).click();await settle();
await page.getByRole('button',{name:'Previous page',exact:true}).click();await settle();
const rect=await page.locator('.flip-engine').boundingBox();
await page.mouse.move(rect.x+rect.width-8,rect.y+12);await page.mouse.down();
await page.mouse.move(rect.x+rect.width*.6,rect.y+90,{steps:18});
await page.mouse.move(rect.x+rect.width-8,rect.y+12,{steps:18});await page.mouse.up();
await page.mouse.move(rect.x+rect.width/2,rect.y-16);await settle();
await page.getByRole('button',{name:'File flow',exact:true}).click();await settle();await page.getByRole('button',{name:'Trace file flow',exact:true}).click();await page.waitForTimeout(1100);
await page.getByRole('button',{name:'References',exact:true}).click();await settle();
await page.getByRole('tab',{name:'Srihari Kestur',exact:true}).click();await page.waitForTimeout(700);
await page.getByRole('tab',{name:'Gautham Chengappa',exact:true}).click();await page.waitForTimeout(700);
await page.getByRole('button',{name:'Reading mode',exact:true}).click();
await page.getByRole('button',{name:'Vault Storage',exact:true}).click();await page.mouse.wheel(0,600);await page.waitForTimeout(900);
await page.getByRole('button',{name:'References',exact:true}).click();await page.waitForTimeout(500);
await page.waitForTimeout(900);
const bytes=await page.evaluate(async()=>{await new Promise(resolve=>{window.reviewRecorder.onstop=resolve;window.reviewRecorder.stop();});return [...new Uint8Array(await new Blob(window.reviewChunks).arrayBuffer())];});
await fs.writeFile(`${out}/review-audio.webm`,Buffer.from(bytes));await context.close();await video.saveAs(`${out}/review-silent.webm`);
await fs.writeFile(`${out}/recording.json`,JSON.stringify({audioOffsetMs:audioStart-videoStart,viewport:[1280,1400],note:'Actual browser graph capture; alignment uses recording-start wall clock, not sample-accurate hardware loopback.'},null,2));
await browser.close();console.log(JSON.stringify(results));
