import {test,expect} from '@playwright/test';
for(const width of [375,1280])for(const reduced of [false,true]){
 test(`${width} ${reduced}: browsing a gallery does not open inspection, selected photo does`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.goto('/story#experiments');
  const moment=page.locator('#experiments .obs-moment').filter({has:page.getByRole('heading',{name:'The moving car',exact:true})});
  await moment.getByRole('button',{name:'Next',exact:true}).click();await page.waitForTimeout(1200);
  const active=moment.locator('[data-active=true] button[data-inspect-image]');await active.focus();
  const box=(await moment.locator('.obs-hanging-window').boundingBox())!;
  const x=box.x+box.width*.65,y=box.y+box.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-box.width*.7,y,{steps:12});await page.mouse.up();await page.waitForTimeout(1400);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(()=>!!document.activeElement?.closest('[aria-hidden=true]'))).toBe(false);
  const selected=moment.locator('[data-active=true] button[data-inspect-image]');await selected.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Photograph viewer'})).toBeVisible();await page.keyboard.press('Escape');await expect(selected).toBeFocused();
 });
}
