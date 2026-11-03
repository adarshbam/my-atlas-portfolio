import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try { for(const width of [375,768,1280,1440,1920]) for(const route of ['/story','/story/reading.html']) {
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:4180${route}`);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
 const overflow=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left< -1)}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className}))}));
 results.push({width,route,overflow,errors});await page.screenshot({path:`docs/review/modernization/story-${width}-${route.endsWith('html')?'reader':'night'}.png`});await page.close();
 } } finally {await browser.close();await fs.writeFile('docs/review/modernization/story.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results.filter(r=>r.overflow.scrollWidth>r.width||r.errors.length),null,2));
expect(results.every(r=>r.overflow.scrollWidth<=r.width&&!r.errors.length)).toBe(true);
