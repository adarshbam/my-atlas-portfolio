import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { goToChapter } from "./helpers/book";

for (const width of [375, 768, 1280, 1920]) {
  for (const reduced of [false, true]) {
    test(`${width}px ${reduced ? "reduced" : "native"}: hidden chrome keeps page scrolling discoverable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/");
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await goToChapter(page, "Harigurus");
      await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
      const scope = reduced ? '.plain-face[aria-hidden="false"]' : '.library-slot';
      const face = page.locator(`${scope} .book-page[data-page-id="harigurus"]`);
      const port = face.locator(".page-inner");
      const surface = face.locator(".sheet-surface");
      const hint = face.locator(".page-scroll-hint");
      await expect(port).toHaveCSS("scrollbar-width", "none");
      await expect.poll(() => port.evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(true);
      await expect(hint).toBeVisible();
      await expect(hint).toHaveAccessibleName("Scroll down this page");
      await expect(hint).toHaveText("");
      const location = await page.locator('#book').getAttribute('data-current-page');
      const before = (await hint.boundingBox())!;
      const expectedStep = await port.evaluate(el => Math.min(128, el.scrollHeight - el.clientHeight));
      await hint.click();
      await expect.poll(() => port.evaluate(el => el.scrollTop)).toBe(expectedStep);
      await port.evaluate(el => { el.scrollTop = 0; });
      await expect(hint).toBeVisible();
      const after = (await hint.boundingBox())!;
      expect(Math.abs(before.y - after.y)).toBeLessThan(1);
      expect(after.width).toBeGreaterThanOrEqual(44);
      expect(after.height).toBeGreaterThanOrEqual(44);
      await expect(page.locator('#book')).toHaveAttribute('data-current-page', location!);
      await page.keyboard.press('Tab');
      await hint.focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => port.evaluate(el => el.scrollTop)).toBe(expectedStep);
      await port.evaluate(el => { el.scrollTop = 0; });
      await expect(port).toHaveAttribute("tabindex", "0");
      await page.keyboard.press("Tab");
      await port.focus();
      await expect(port).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("PageDown");
      await expect.poll(() => port.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await port.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await expect(hint).toBeHidden();
      await port.evaluate(el => { el.scrollTop = 0; });
      await expect(hint).toBeVisible();
      await port.evaluate(el => { el.scrollTop = el.scrollHeight - el.clientHeight - 20; });
      await hint.focus();
      await page.keyboard.press('Enter');
      await expect(hint).toBeHidden();
      await expect(port).toBeFocused();
      await port.evaluate(el => { el.scrollTop = 0; });
      const b = (await port.boundingBox())!;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.wheel(0, 180);
      await expect.poll(() => port.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await port.evaluate(el => { el.scrollTop = 0; });

      // Late content/layout changes must update the affordance without polling.
      await hint.focus();
      await face.locator(".page-content").evaluate(el => { (el as HTMLElement).style.display = "none"; });
      await expect(surface).not.toHaveAttribute("data-page-overflow");
      await expect(hint).toBeHidden();
      await expect(port).toHaveAttribute("tabindex", "-1");
      await expect(port).toBeFocused();
      await face.locator(".page-content").evaluate(el => { (el as HTMLElement).style.removeProperty("display"); });
      await expect(hint).toBeVisible();
      await page.screenshot({ path: `docs/review/book-scrolling/circle-${width}-${reduced ? "reduced" : "native"}.png` });
      if (width === 1280 && !reduced) {
        const book = (await page.locator('#book').boundingBox())!;
        await page.mouse.move(book.x + book.width - 2, book.y + book.height - 2);
        await page.waitForTimeout(400);
        await page.screenshot({ path: 'docs/review/book-scrolling/circle-hover-curl.png' });
        await expect(hint).toBeHidden();
        await page.mouse.move(0, 0);
        await expect(hint).toBeVisible();
      }
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

      await page.getByRole("button", { name: "Reading view", exact: true }).click();
      await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
      await expect(page.locator('.reading-document .page-scroll-hint:visible')).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveCSS("scrollbar-width", "none");
      await expect(page.locator('.reading-document [data-page-id="harigurus"] .page-inner')).toHaveCSS("overflow-y", "visible");
      expect(errors).toEqual([]);
    });
  }
}
