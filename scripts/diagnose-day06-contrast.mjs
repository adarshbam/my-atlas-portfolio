import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const output="docs/review/day06/contrast-diagnostic";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
  const page=await browser.newPage({viewport:{width:375,height:1200},reducedMotion:"reduce"});
  await page.goto("http://127.0.0.1:4173");
  await expect(page.locator("#book")).toHaveAttribute("data-ready","true");
  await expect(page.locator('.plain-face[aria-hidden=false]')).toHaveCSS("opacity","1");
  await page.evaluate(()=>document.fonts.ready);
  const index=Number(process.argv[2]??0);
  for(let i=0;i<index;i++){
    await page.getByRole("button",{name:"Next page",exact:true}).click();
    await expect(page.locator("#book")).toHaveAttribute("data-current-page",String(i+1));
    await expect(page.locator('.plain-face[aria-hidden=false]')).toHaveCSS("opacity","1");
  }
  const boxes=await page.locator('.plain-face[aria-hidden=false] .book-page').evaluate((face)=>{
    const targets=[...face.querySelectorAll("h2,h3,p,dt,dd,figcaption,a,button,.running-head span,.folio span,.diagram-node > span,.diagram-node small,.diagram-route-label,blockquote")];
    window.__day06Debug=targets.map(element=>({element,visibility:element.style.visibility}));
    const out=[];
    for (const element of targets) {
      const r=element.getBoundingClientRect(), s=getComputedStyle(element);
      const canvas=document.createElement("canvas");canvas.width=canvas.height=1;
      const c=canvas.getContext("2d");c.fillStyle=s.color;c.fillRect(0,0,1,1);
      out.push({text:element.textContent.trim(),color:s.color,canvas:[...c.getImageData(0,0,1,1).data],rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
      element.style.visibility="hidden";
    }
    return out;
  });
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${output}/hidden.png`});
  console.log(JSON.stringify(await page.locator('.plain-face[aria-hidden=false] .cover-title, .plain-face[aria-hidden=false] .cover-title *, .plain-face[aria-hidden=false] .cover-stack').evaluateAll(els=>els.map(el=>({tag:el.tagName,cls:el.className,style:el.getAttribute("style"),visibility:getComputedStyle(el).visibility,text:el.textContent}))),null,2));
  await page.evaluate(()=>{for(const r of window.__day06Debug)r.element.style.visibility=r.visibility;});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${output}/visible.png`});
  await writeFile(`${output}/boxes.json`,JSON.stringify(boxes,null,2));
  console.log(JSON.stringify(boxes.slice(0,3),null,2));
} finally { await browser.close(); }
