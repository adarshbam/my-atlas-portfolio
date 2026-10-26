import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
const output='docs/review/contact-update';
await mkdir(output,{recursive:true});
const baseURL=process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const records=[];
try {
  for(const [width,height] of [[375,844],[768,1024],[1280,900],[1920,1080],[360,800],[390,844],[1280,720]]) {
    for(const mode of ['native','reduced','reading']) {
      const context=await browser.newContext({viewport:{width,height},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(baseURL);
      await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
      await page.evaluate(()=>document.fonts.ready);
      if(mode==='reading')await page.getByRole('button',{name:'Reading mode',exact:true}).click();
      await page.getByRole('navigation',{name:'Portfolio chapters'}).getByRole('button',{name:'Contact',exact:true}).click();
      await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
      const scope=mode==='native'?'.library-slot':mode==='reading'?'.reading-document':'.plain-face[aria-hidden=false]';
      const face=page.locator(`${scope} [data-page-id="colophon"]`);
      if(mode==='reduced')await expect(face.locator('..')).toHaveCSS('opacity','1');
      const contacts=face.getByRole('navigation',{name:'Contact and résumé'});
      const phoneRecords=[];
      for(const [label,href] of [['+91 8005156732','tel:+918005156732'],['+91 6386036252','tel:+916386036252']]) {
        const link=contacts.getByRole('link',{name:label,exact:true});
        await link.focus();
        await link.scrollIntoViewIfNeeded();
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href',href);
        await expect(link).toBeFocused();
        const box=await link.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        phoneRecords.push({label,href,...box});
      }
      const fit=await face.evaluate(face=>{
        const inner=face.querySelector('.page-inner'),folio=face.querySelector('.folio');
        const last=face.querySelector('.page-content').lastElementChild;
        return {contained:inner.scrollHeight<=inner.clientHeight+1,
          contentBeforeFolio:last.getBoundingClientRect().bottom<=folio.getBoundingClientRect().top+1,
          overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(fit.overflow).toBe(false);
      if(width>=768&&mode!=='reading') {expect(fit.contained).toBe(true);expect(fit.contentBeforeFolio).toBe(true);}
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      expect(axe.violations).toEqual([]);
      expect(errors).toEqual([]);
      await contacts.scrollIntoViewIfNeeded();
      await page.screenshot({path:`${output}/${width}x${height}-${mode}.jpg`,fullPage:true});
      records.push({width,height,mode,fit,phones:phoneRecords,violations:axe.violations,incomplete:axe.incomplete.map(item=>item.id),errors});
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/contacts.json`,JSON.stringify({browser:browser.version(),baseURL,records},null,2)+'\n');
}
console.log(JSON.stringify({states:records.length,phoneLinks:records.length*2,errors:0}));
