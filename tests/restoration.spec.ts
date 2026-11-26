import {test,expect} from '@playwright/test';
import {goToChapter} from './helpers/book';
test('rapid quote selection, mode restoration and live reduced motion',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/#book');const book=page.locator('#book');await expect(book).toHaveAttribute('data-ready','true');
 await goToChapter(page,'References');await expect(book).toHaveAttribute('data-current-page','9');await expect(book).toHaveAttribute('data-turning','false');
 const first=page.getByRole('tab',{name:'Anurag Singh',exact:true}),second=page.getByRole('tab',{name:'Srihari Kestur',exact:true});
 const height=await second.locator('xpath=ancestor::article').evaluate(e=>e.getBoundingClientRect().height);
 await second.click();await first.click();await second.click();await expect(second).toHaveAttribute('aria-selected','true');
 await page.waitForTimeout(500);expect(await second.locator('xpath=ancestor::article').evaluate(e=>e.getBoundingClientRect().height)).toBe(height);
 // One quotation shows on each of the two reference pages, whichever author is chosen.
 await expect(page.locator('.library-slot .book-page[aria-hidden="false"] .reference[aria-hidden="false"]')).toHaveCount(2);
 // The chosen author survives the change to still pages and back.
 await page.emulateMedia({reducedMotion:'reduce'});await expect(book).toHaveAttribute('data-mode','reduced');
 await expect(second).toHaveAttribute('aria-selected','true');
 await first.click();await expect(first).toHaveAttribute('aria-selected','true');
 await expect(page.locator('.plain-face[aria-hidden="false"] .reference[aria-hidden="false"]')).toHaveCount(2);
 for(const figure of await page.locator('.plain-face[aria-hidden="false"] .reference[aria-hidden="false"]').all())await expect(figure).toHaveCSS('opacity','1');
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(book).toHaveAttribute('data-mode','native');await expect(book).toHaveAttribute('data-ready','true');
 await expect(first).toHaveAttribute('aria-selected','true');
 await second.focus();await page.keyboard.press('ArrowLeft');await expect(first).toBeFocused();await expect(book).toHaveAttribute('data-current-page','9');
});
