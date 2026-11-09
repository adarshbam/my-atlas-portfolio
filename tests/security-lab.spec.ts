import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openContents, chapterButton } from './helpers/book';

for (const width of [375, 768, 1280, 1920]) {
  for (const mode of ['native', 'reduced', 'reading'] as const) {
    test(`${width} ${mode}: security curriculum and evidence remain reachable`, async ({page}) => {
      await page.setViewportSize({width, height:900});
      await page.emulateMedia({reducedMotion:mode === 'reduced' ? 'reduce':'no-preference'});
      const errors:string[]=[];
      page.on('pageerror', e=>errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto('/');
      await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
      if(mode==='reading')await page.getByRole('button',{name:'Reading view',exact:true}).click();
      await openContents(page);
      await chapterButton(page,'Security Lab').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#book')).toHaveAttribute('data-current-page','11');
      await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
      const scope=mode==='reading'?'.reading-document':mode==='reduced'?'.plain-face[aria-hidden=false]':'.library-slot';
      const face=page.locator(`${scope} [data-page-id="security-lab"]`);
      await face.locator('h2').focus();
      await expect(face.locator('h2')).toBeFocused();
      await expect(face).toContainText('Twenty-eight experiments');
      await expect(face).not.toContainText('has not been published');
      const path=face.getByRole('region',{name:'Seven-lab learning path'});
      await expect(path.getByRole('listitem')).toHaveCount(7);
      const topics=await path.locator('em').allTextContents();
      expect(topics).toEqual(['Broken access control','Privilege escalation','HttpOnly cookies vs localStorage','SameSite & CSRF','Injection attacks','XSS attacks & CSP','JWT: decode, verify & exploit']);
      await expect(face).toContainText('loopback only');
      const img=face.locator('.security-figure img');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
      await expect(img).toBeVisible();
      const imageLink=face.locator('.security-figure a');
      await imageLink.focus();await expect(imageLink).toBeFocused();
      await expect(imageLink).toHaveCSS('outline-style','solid');
      await page.screenshot({path:`docs/review/security-lab/${width}-${mode}-evidence.png`});
      const source=face.getByRole('link',{name:'Lab source',exact:true});
      await source.focus();await expect(source).toBeFocused();await expect(source).toBeInViewport();
      await page.keyboard.press('Tab');
      const record=face.getByRole('link',{name:'Verification record',exact:true});
      await expect(record).toBeFocused();await expect(record).toHaveAttribute('href',/docs\/verification.md$/);
      for(const link of [imageLink,source,record]){
        const box=(await link.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const axe=await new AxeBuilder({page}).analyze();
      expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
      await face.locator('h2').focus();
      await page.screenshot({path:`docs/review/security-lab/${width}-${mode}-opening.png`});
      expect(errors).toEqual([]);
    });
  }
}
