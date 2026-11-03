import { test, expect } from '@playwright/test';
for (const width of [768, 900, 1023]) for (const reduced of [false, true]) {
  test(`${width}px ${reduced ? 'reduced' : 'native'}: narrow spreads retain phone minimum proportions`, async ({page}) => {
    await page.setViewportSize({width, height:1200});
    await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
    await page.goto('/');
    await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
    await page.evaluate(()=>document.fonts.ready);
    const geometry=await page.locator('#book').evaluate(book=>{
      const style=getComputedStyle(book);
      return {width:parseFloat(style.getPropertyValue('--page-width')),height:parseFloat(style.getPropertyValue('--page-height')),minimum:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--premium-min-page-ratio'))};
    });
    expect(geometry.width/geometry.height).toBeGreaterThanOrEqual(geometry.minimum-0.001);
    await page.getByRole('button',{name:'Open book',exact:true}).click();
    await expect(page.locator('#book')).toHaveAttribute('data-current-page','1');
    await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  });
}
