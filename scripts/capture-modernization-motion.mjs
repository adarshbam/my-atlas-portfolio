import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const out='docs/review/modernization';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:`${out}/motion`,size:{width:1440,height:900}}});
const page=await context.newPage();
await page.goto('http://127.0.0.1:4180');
const book=page.locator('#book');
await expect(book).toHaveAttribute('data-ready','true');
await page.evaluate(()=>document.fonts.ready);
await page.clock.install();
await page.clock.pauseAt(new Date(Date.now()+1000));
const measurements=[];
async function capture(name,action,duration,target){
 const frames=[await page.screenshot()];
 await action();
 for(const fraction of [.25,.5,.75]){
  await page.clock.runFor(duration/4);
  measurements.push({name,fraction,virtualElapsed:duration*fraction,turning:await book.getAttribute('data-turning')});
  frames.push(await page.screenshot());
 }
 await page.clock.runFor(duration/4+100);
 await expect(book).toHaveAttribute('data-current-page',String(target));
 await expect(book).toHaveAttribute('data-turning','false');
 frames.push(await page.screenshot());
 const tiles=await Promise.all(frames.map(b=>sharp(b).resize(576,360).png().toBuffer()));
 await sharp({create:{width:2880,height:360,channels:3,background:'#d8d6d0'}}).composite(tiles.map((input,i)=>({input,left:i*576,top:0}))).png().toFile(`${out}/motion-${name}.png`);
}
await capture('opening',()=>page.getByRole('button',{name:'Open book',exact:true}).click(),1200,1);
await capture('forward',()=>page.getByRole('button',{name:'Next page',exact:true}).click(),800,3);
await capture('backward',()=>page.getByRole('button',{name:'Previous page',exact:true}).click(),800,1);
await capture('closing',()=>page.getByRole('button',{name:'Previous page',exact:true}).click(),1200,0);
let b=await page.locator('.library-slot [data-page-id="cover"]').boundingBox();
await page.mouse.move(b.x+b.width-6,b.y+b.height-12);await page.mouse.down();
await page.mouse.move(b.x+b.width*.5,b.y+b.height-70,{steps:12});
await page.screenshot({path:`${out}/motion-drag-reversal.png`});
b=await page.locator('.flip-engine').boundingBox();
await page.mouse.move(b.x+b.width-3,b.y+b.height-3,{steps:16});await page.mouse.up();await page.mouse.move(0,0);
await page.clock.runFor(1300);
await expect(book).toHaveAttribute('data-current-page','0');await expect(book).toHaveAttribute('data-turning','false');
await fs.writeFile(`${out}/motion-sampling.json`,JSON.stringify({note:'Frames use a controlled native browser animation clock at 0/25/50/75/100% nominal duration. They demonstrate geometry, not physical-device performance.',measurements},null,2));
await context.close();await browser.close();

