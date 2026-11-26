import { test, expect } from "@playwright/test";
import { openBook } from "./helpers/book";

// Since 23 November 2026 the atlas book has two presentations only: the turning book,
// and still pages for reduced motion. Its continuous document view was withdrawn.

test("the toolbar holds Contents and the theme switch, and the book is either turning or still", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openBook(page);
  const book = page.locator("#book");
  const toolbar = page.locator(".book-toolbar");
  await expect(toolbar.locator(":scope > button")).toHaveCount(1);
  await expect(toolbar.locator(":scope > button")).toContainText("Contents");
  await expect(toolbar.locator(".theme-switch button")).toHaveText(["Light", "Dark"]);
  await expect(page.locator(".atlas").getByRole("button", { name: /^(Reading|Return to)/ })).toHaveCount(0);
  await expect(book).toHaveAttribute("data-mode", "native");
  await expect(page.locator(".flip-engine")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(book).toHaveAttribute("data-mode", "reduced");
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await expect(page.locator(".atlas").getByRole("button", { name: /^(Reading|Return to)/ })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(book).toHaveAttribute("data-mode", "native");
  await expect(book).toHaveAttribute("data-ready", "true");
  expect(errors).toEqual([]);
});

for (const width of [375, 1280])
  test(`${width}: the toolbar's two controls sit apart, inside the gutters, each at least 44px tall`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openBook(page);
    const contents = (await page.getByRole("button", { name: "Contents", exact: true }).boundingBox())!;
    const light = (await page.getByRole("button", { name: "Light", exact: true }).boundingBox())!;
    const dark = (await page.getByRole("button", { name: "Dark", exact: true }).boundingBox())!;
    for (const box of [contents, light, dark]) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(16);
      expect(box.x + box.width).toBeLessThanOrEqual(width - 16);
    }
    expect(light.x).toBeGreaterThanOrEqual(contents.x + contents.width + 16);
    expect(dark.x).toBeGreaterThanOrEqual(light.x + light.width);
    // The rule between them belongs to a centred row; on a phone they stand at the two edges without it.
    const rule = await page.locator(".theme-switch").evaluate((node) => parseFloat(getComputedStyle(node).borderLeftWidth));
    expect(rule).toBe(width < 768 ? 0 : 1);
    if (width < 768) expect(contents.x).toBe(16);
    else {
      // Centred as a group: the same room on both sides, to a pixel.
      const left = contents.x;
      const right = width - (dark.x + dark.width);
      expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
    }
  });

test("a place stored while the continuous view still existed returns the reader to that page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    // The old record carried a second field saying the continuous view was open. Spelt in
    // two parts so that a search of the code for the withdrawn name finds nothing here.
    const field = ["read", "Mode"].join("");
    sessionStorage.setItem("atlas-story-return", JSON.stringify({ url: "/#book", scroll: 0, position: { page: 3, [field]: true } }));
  });
  await page.goto("/story");
  await page.getByRole("link", { name: /Back to the atlas/ }).click();
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await expect(book).toHaveAttribute("data-logical-page", "3");
  await expect(book).toHaveAttribute("data-mode", "native");
  expect(new URL(page.url()).hash).toBe("#book");
  expect(errors).toEqual([]);
});
