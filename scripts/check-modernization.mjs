import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const out = 'docs/review/modernization';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const results = [];
const cases = [[375,812],[768,1024],[1280,900],[1440,900],[1920,1080]];
for (const [width,height] of cases.filter(([w])=>!process.env.WIDTHS||process.env.WIDTHS.split(',').map(Number).includes(w))) for (const motion of ['no-preference','reduce']) for (const theme of ['light','dark']) {
  const context = await browser.newContext({viewport:{width,height},reducedMotion:motion});
  await context.addInitScript(theme => localStorage.setItem('atlas-theme-v1',theme), theme);
  const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const result={width,height,motion,theme,errors};
  try {
    await page.goto('http://127.0.0.1:4180/');
    await page.locator('#book[data-ready="true"]').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    const prefix=`${width}-${motion}-${theme}`;
    await page.screenshot({path:`${out}/${prefix}-cover.png`});
    const engine=await page.locator('.flip-engine').count();
    await page.evaluate(()=>window.__modernEngine=document.querySelector('.flip-engine'));
    await page.getByRole('button',{name:'Open book',exact:true}).click();
    await page.locator('#book[data-current-page="1"][data-turning="false"]').waitFor();
    if(width<768){await page.getByRole('button',{name:'Next page',exact:true}).click();await page.locator('#book[data-current-page="2"][data-turning="false"]').waitFor();}
    await page.screenshot({path:`${out}/${prefix}-spread.png`});
    result.geometry=await page.evaluate(()=>{
      const root=document.querySelector('#book'), visible=[...root.querySelectorAll('.book-page')].filter(p=>!p.closest('[aria-hidden="true"]'));
      const content=visible.find(p=>p.dataset.pageId==='contents');
      const inner=content?.querySelector('.page-inner');
      const board=root.querySelector('.binding')?.getBoundingClientRect();
      return {theme:document.documentElement.dataset.theme,overflow:document.documentElement.scrollWidth>innerWidth,board:board?.toJSON(),openingScroll:inner?inner.scrollHeight-inner.clientHeight:null,bodySize:content?getComputedStyle(content).fontSize:null};
    });
    await page.getByRole('button',{name:theme==='light'?'Dark':'Light',exact:true}).click();
    result.themeSwitchStable=await page.evaluate(()=>window.__modernEngine===document.querySelector('.flip-engine')) && (await page.locator('.flip-engine').count())===engine && await page.locator('#book').getAttribute('data-current-page')===(width<768?'2':'1');
    if(width===375||width===1440) result.axe=(await new AxeBuilder({page}).analyze()).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
    await page.getByRole('button',{name:'Contents',exact:true}).click();
    result.contentsOpen=await page.getByRole('navigation',{name:'Portfolio chapters'}).isVisible();
    await page.keyboard.press('Escape');
    result.focusReturn=await page.getByRole('button',{name:'Contents',exact:true}).evaluate(x=>x===document.activeElement);
    await page.getByRole('button',{name:'Reading view',exact:true}).click();
    await page.locator('#book[data-mode="reading"]').waitFor();
    result.readerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    result.pass=!result.geometry.overflow&&!result.readerOverflow&&result.themeSwitchStable&&result.contentsOpen&&result.focusReturn&&!errors.length&&!(result.axe?.length)&&(!(width>=1440)||result.geometry.openingScroll<=2);
  } catch(e) { result.error=e.message;result.pass=false; }
  results.push(result);console.log(`${result.pass?'PASS':'FAIL'} ${width} ${motion} ${theme}${result.error?' '+result.error:''}`);
  await fs.writeFile(`${out}/responsive.json`,JSON.stringify(results,null,2));
  await context.close();
}
await browser.close();
console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,failed:results.filter(x=>!x.pass).map(x=>({width:x.width,motion:x.motion,theme:x.theme,geometry:x.geometry,axe:x.axe,error:x.error}))},null,2));
process.exitCode=results.every(x=>x.pass)?0:1;
