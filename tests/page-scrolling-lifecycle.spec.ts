import { test, expect } from "@playwright/test";
import { goToChapter } from "./helpers/book";

for (const reduced of [false, true]) test(`phone touch arrow scrolls its own page ${reduced}`, async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL as string, viewport: { width: 375, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  await page.goto('/#book');
  await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
  await goToChapter(page, 'Harigurus');
  await expect(page.locator('#book')).toHaveAttribute('data-turning', 'false');
  const scope = reduced ? '.plain-face[aria-hidden="false"]' : '.library-slot';
  const face = page.locator(`${scope} .book-page[data-page-id="harigurus"]`);
  await face.getByRole('button', { name: 'Scroll down this page' }).tap();
  await expect.poll(() => face.locator('.page-inner').evaluate(el => el.scrollTop)).toBe(128);
  await expect(page.locator('#book')).toHaveAttribute('data-current-page', '7');
  await context.close();
});

test("scroll affordance follows theme, a motion-mode return and viewport changes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await goToChapter(page, "Harigurus");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  const face = page.locator('.library-slot .book-page[data-page-id="harigurus"]');
  await expect(face.locator('.page-scroll-hint')).toBeVisible();
  await face.locator('.page-inner').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(face.locator('.page-scroll-hint')).toBeHidden();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(face.locator('.page-scroll-hint')).toBeHidden();
  await face.locator('.page-inner').evaluate(el => { el.scrollTop = 0; });
  await expect(face.locator('.page-scroll-hint')).toBeVisible();
  await page.screenshot({ path: 'docs/review/book-scrolling/dark-1280.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#book')).toHaveAttribute('data-mode', 'reduced');
  await expect(page.locator('.plain-face[aria-hidden="false"] .book-page[data-page-id="harigurus"] .page-scroll-hint')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#book')).toHaveAttribute('data-mode', 'native');
  await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
  await goToChapter(page, 'Harigurus');
  await expect(face.locator('.page-scroll-hint')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 844 });
  await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
  await goToChapter(page, 'Harigurus');
  await expect(face.locator('.page-scroll-hint')).toBeVisible();
  await expect(face.locator('.page-inner')).toHaveCSS('scrollbar-width', 'none');
  await face.locator('.page-inner').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(face.locator('.page-scroll-hint')).toBeHidden();
});
