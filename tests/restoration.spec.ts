import {test,expect} from '@playwright/test';
test('rapid quote selection, mode restoration, expansion and live reduced motion',async({page})=>{
 await page.goto('/');const book=page.locator('#book');await expect(book).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'References',exact:true}).click();await expect(book).toHaveAttribute('data-turning','false');
 const tabs=page.getByRole('tab');
 const first=page.getByRole('tab',{name:'Anurag Singh',exact:true}),second=page.getByRole('tab',{name:'Srihari Kestur',exact:true});
 const height=await second.locator('xpath=ancestor::article').evaluate(e=>e.getBoundingClientRect().height);
 await second.click();await first.click();await second.click();await expect(second).toHaveAttribute('aria-selected','true');
 await page.waitForTimeout(500);expect(await second.locator('xpath=ancestor::article').evaluate(e=>e.getBoundingClientRect().height)).toBe(height);
 await page.getByRole('button',{name:'Reading mode',exact:true}).click();await expect(second).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'Read all references',exact:true}).first().click();await expect(page.locator('.reading-document')).toHaveAttribute('data-references-all','true');
 await expect(page.locator('.reading-document .reference[aria-hidden="false"]')).toHaveCount(4);
 await page.getByRole('button',{name:'Show featured quotes',exact:true}).first().click();await expect(second).toHaveAttribute('aria-selected','true');
 await page.emulateMedia({reducedMotion:'reduce'});await first.click();await expect(first).toHaveAttribute('aria-selected','true');
 expect(await page.locator('.reading-document .reference[aria-hidden="false"]').count()).toBe(2);
 await page.getByRole('button',{name:'Return to pages',exact:true}).click();await expect(first).toHaveAttribute('aria-selected','true');
 await second.focus();await page.keyboard.press('ArrowLeft');await expect(first).toBeFocused();await expect(book).toHaveAttribute('data-current-page','9');
});
