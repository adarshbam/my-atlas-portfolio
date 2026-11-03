import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const revision = "monograph-final";
await mkdir(`tmp/${revision}`, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const [width, height] of [
  [375, 600],
  [1280, 720],
  [375, 844],
  [768, 1024],
  [1280, 900],
  [1920, 1080],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  for (const state of ["native", "reading"]) {
    if (state === "reading") {
      await page
        .getByRole("button", { name: "Reading mode", exact: true })
        .click();
      await expect(page.locator(".flip-engine")).toHaveCount(0);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => scrollTo(0, 0));
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      faces: [
        ...document.querySelectorAll(
          '.library-slot .book-page[aria-hidden="false"],.plain-face[aria-hidden="false"] .book-page',
        ),
      ].map((face) => ({
        id: face.dataset.pageId,
        background: getComputedStyle(face).backgroundColor,
        relief: getComputedStyle(face, "::before").backgroundImage,
        pointerEvents: getComputedStyle(face, "::before").pointerEvents,
        textureOpacity: getComputedStyle(face, "::after").opacity,
        imageLoaded: [...face.querySelectorAll("img")].every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      })),
    }));
    expect(metrics.overflow).toBe(false);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `docs/review/${revision}-${width}x${height}-${state}.png`,
      fullPage: true,
    });
    results.push({ width, height, state, metrics, errors });
  }
  await page.close();
}
await writeFile(
  `tmp/${revision}/short-reading.json`,
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify({
    states: results.length,
    errors: results.flatMap((r) => r.errors),
    overflow: results.some((r) => r.metrics.overflow),
  }),
);
await browser.close();
