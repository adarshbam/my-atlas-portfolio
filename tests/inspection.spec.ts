import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {openContents} from './helpers/book';
for(const width of [375,768,1280,1920])for(const reduced of [false,true]){
 test(`${width} ${reduced}: framed images, zoom, static archive and inline resume`,async({page,request})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const fullRequests:string[]=[];page.on('request',r=>{if(r.url().includes('/assets/full/'))fullRequests.push(r.url());});
  await page.goto('/story#brother');await expect(page.locator('#brother .obs-memory-detail')).toContainText('last carriage');
  await expect(page.locator('#brother .obs-outcome')).toContainText('heavier brick');await expect(page.locator('#english')).toContainText('2G');await expect(page.locator('#english')).toContainText('Jio keypad phone');
  expect(await page.locator('main').innerText()).not.toMatch(/\bFaz\b/);
  expect(fullRequests).toEqual([]);
  const trigger=page.locator('#school button[data-inspect-image]').first();await trigger.scrollIntoViewIfNeeded();await trigger.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Photograph viewer'});await expect(dialog).toBeVisible();
  const img=dialog.locator('img');await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>1200)).toBe(true);
  await expect(img).toHaveAttribute('src',/\/full\//);expect(fullRequests.length).toBeGreaterThan(0);
  await expect(dialog.getByRole('button',{name:'Zoom in',exact:true})).toBeEnabled();
  const fitWidth=await img.evaluate(i=>i.getBoundingClientRect().width);
  await dialog.getByRole('button',{name:'Zoom in',exact:true}).click();await expect.poll(()=>img.evaluate(i=>i.getBoundingClientRect().width)).toBeGreaterThan(fitWidth);
  await dialog.getByRole('button',{name:'Actual size',exact:true}).click();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>Math.abs(i.getBoundingClientRect().width-i.naturalWidth))).toBeLessThan(2);
  const panArea=dialog.getByRole('region',{name:'Image pan area'});await panArea.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>panArea.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await dialog.getByRole('button',{name:'Fit',exact:true}).click();await expect.poll(()=>img.evaluate(i=>i.getBoundingClientRect().width)).toBeCloseTo(fitWidth,0);
  await page.screenshot({path:`docs/review/inspection/${width}-${reduced}-photo.png`});
  const axe=await new AxeBuilder({page}).include('.media-inspector').analyze();expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
  await page.goto('/story/reading.html#school');const staticTrigger=page.locator('#school a.image-link').first();await staticTrigger.click();await expect(page.getByRole('dialog',{name:'Photograph viewer'})).toBeVisible();await page.keyboard.press('Escape');await expect(staticTrigger).toBeFocused();
  await page.goto('/');await expect(page.locator('#book')).toHaveAttribute('data-ready','true');await openContents(page);
  const resume=page.locator('.contents-links a[href="/adarsh-singh-resume.pdf"]');await resume.focus();await page.keyboard.press('Enter');
  const pdf=page.getByRole('dialog',{name:'Résumé preview'});await expect(pdf).toBeVisible();await expect(pdf.locator('iframe')).toHaveAttribute('src','/adarsh-singh-resume.pdf#view=FitH');
  await expect(pdf.getByRole('link',{name:'Open PDF in new tab'})).toHaveAttribute('target','_blank');
  const response=await request.get('/adarsh-singh-resume.pdf');expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('application/pdf');
  await page.waitForTimeout(2500);
  await page.screenshot({path:`docs/review/inspection/${width}-${reduced}-resume.png`});
  const download=page.waitForEvent('download');await pdf.getByRole('link',{name:'Download PDF',exact:true}).click();expect((await download).suggestedFilename()).toBe('Adarsh-Singh-Resume.pdf');
  await pdf.getByRole('button',{name:'Close',exact:true}).click();await expect(pdf).toHaveCount(0);await expect(resume).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).not.toBe('hidden');expect(errors).toEqual([]);
 });
}
