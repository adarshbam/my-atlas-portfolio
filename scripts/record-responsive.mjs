import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("docs/review", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const [name, width, height] of [["phone", 375, 844], ["tablet", 768, 1024]]) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: true,
    isMobile: width < 768,
    reducedMotion: "no-preference",
    recordVideo: { dir: "tmp/recordings", size: { width, height } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const b = await page.locator("#book").boundingBox();
  await page.touchscreen.tap(b.x + b.width - 8, b.y + 8);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `docs/review/${name}-corner-turn.png` });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `docs/review/${name}-corner-settled.png`, fullPage: true });
  await page.touchscreen.tap(b.x + 8, b.y + 8);
  await page.waitForTimeout(1100);
  await context.close();
  await page.video().saveAs(`docs/review/${name}-corner-taps.webm`);
}
console.log("Recorded phone/tablet forward and backward corner taps.");
await browser.close();
