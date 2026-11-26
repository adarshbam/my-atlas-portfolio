import { test, expect } from "@playwright/test";
import { goToChapter } from "./helpers/book";

// Images in the atlas open in the framed viewer on the same page, not in a new browser tab.
for (const width of [375, 1280])
  test(`${width}: Harigurus page image opens in the viewer and closes`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    const popups: string[] = [];
    context.on("page", (opened) => popups.push(opened.url()));
    await page.goto("/#book");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await goToChapter(page, "Harigurus");
    await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
    const link = page.locator('#book a[href="/images/harigurus/services-1920.webp"]:visible').first();
    await expect(link).toBeVisible();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const dialog = page.locator("dialog.media-inspector[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("h2")).toHaveText("Full image");
    await expect
      .poll(() =>
        dialog.locator(".media-inspector-frame img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && new URL(image.src).pathname),
      )
      .toBe("/images/harigurus/services-1920.webp");
    expect(popups).toEqual([]);
    expect(new URL(page.url()).pathname).toBe("/");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

test("book page image opens in the viewer", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const popups: string[] = [];
  context.on("page", (opened) => popups.push(opened.url()));
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator(".chapter-nav button").filter({ hasText: /^Harigurus$/ }).click();
  const link = page.locator('#book a[href="/images/harigurus/services-1920.webp"]:visible').first();
  await expect(link).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await link.click();
  await expect(page.locator("dialog.media-inspector[open]")).toBeVisible();
  expect(popups).toEqual([]);
});
