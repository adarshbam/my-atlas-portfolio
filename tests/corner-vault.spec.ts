import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { goToChapter } from './helpers/book';

for (const width of [375,768,1280,1920]) for(const reduced of [false,true]) {
  test(`${width} ${reduced}: corner control and aggregate Vault evidence`, async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
    await goToChapter(page,'Harigurus');await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
    const scope=reduced?'.plain-face[aria-hidden=false]':'.library-slot';
    const face=page.locator(`${scope} [data-page-id="harigurus"]`);
    const button=face.getByRole('button',{name:'Scroll down this page'});
    await expect(button).toBeVisible();
    const bounds=(await face.locator('.sheet-surface').boundingBox())!,b=(await button.boundingBox())!;
    expect(bounds.x+bounds.width-b.x-b.width).toBeLessThanOrEqual(10);
    expect(bounds.y+bounds.height-b.y-b.height).toBeLessThanOrEqual(10);
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(el=>getComputedStyle(el,'::before').width)).toBe('32px');
    const expectedStep=await face.locator('.page-inner').evaluate(el=>Math.min(128,el.scrollHeight-el.clientHeight));
    const positions=await button.evaluate(async el=>{
      const port=el.parentElement!.querySelector<HTMLElement>('.page-inner')!;
      port.scrollTop=0;(el as HTMLButtonElement).click();const samples:number[]=[];
      for(let i=0;i<30;i++) {await new Promise(requestAnimationFrame);samples.push(port.scrollTop);}
      return samples;
    });
    if(reduced)expect(positions[0]).toBe(expectedStep);
    else expect(positions.some(y=>y>0&&y<expectedStep)).toBe(true);
    expect(positions.at(-1)).toBe(expectedStep);
    await page.screenshot({path:`docs/review/corner-vault/control-${width}-${reduced}.png`});
    await goToChapter(page,'Vault Storage');await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
    const vault=page.locator(`${scope} [data-page-id="vault"]`),image=vault.locator('.vault-figure--accounts img');
    await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
    await expect(vault).toContainText('10 registered accounts');await expect(vault).toContainText('45.01 TB of provisioned quota');
    await page.screenshot({path:`docs/review/corner-vault/vault-${width}-${reduced}.png`});
    await page.getByRole('button',{name:'Reading view',exact:true}).click();await goToChapter(page,'Vault Storage');
    const readingImage=page.locator(width>=1280&&!reduced?'.reading-evidence [data-evidence="workspace"] .vault-figure--accounts img':'.reading-document [data-page-id="vault"] .vault-figure--accounts img');
    await expect(readingImage).toBeVisible();
    await readingImage.scrollIntoViewIfNeeded();
    await expect.poll(()=>readingImage.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
    const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);expect(errors).toEqual([]);
    await page.screenshot({path:`docs/review/corner-vault/reading-${width}-${reduced}.png`});
  });
}
