import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("docs/review", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const [name, width, height] of [
  ["phone", 375, 844],
  ["tablet", 768, 1024],
  ["desktop", 1280, 1000],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width < 1280,
    isMobile: width < 768,
    reducedMotion: "no-preference",
    recordVideo: { dir: "tmp/recordings", size: { width, height } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const step = width < 768 ? 1 : 2;
  const press = async (x, y) =>
    width < 1280 ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
  const settle = async (index) => {
    await page
      .locator(`#book[data-current-page="${index}"][data-turning="false"]`)
      .waitFor();
    await page.waitForTimeout(900);
  };
  const b = await page.locator("#book").boundingBox();
  const middle = async (forward) =>
    page.locator("#book").evaluate((book, forward) => {
      const b = book.getBoundingClientRect();
      const x = forward ? b.right - 80 : b.left + 80;
      for (let offset = 0; offset < b.height / 2 - 128; offset += 16) {
        for (const direction of [1, -1]) {
          const y = b.top + b.height / 2 + offset * direction;
          if (y < 24 || y > innerHeight - 24) continue;
          if (
            [0, -24, 24].every(
              (dy) =>
                !document
                  .elementFromPoint(x, y + dy)
                  ?.closest('a,button,[role="region"]'),
            )
          )
            return { x, y };
        }
      }
      throw new Error("No visible middle-edge padding for recording");
    }, forward);
  let point = await middle(true);
  await press(point.x, point.y);
  await page.waitForTimeout(width < 1280 ? 80 : 180);
  await page.screenshot({ path: `docs/review/${name}-middle-edge-turn.png` });
  await settle(step);
  point = await middle(false);
  await press(point.x, point.y);
  await settle(0);
  // This start is 80px inward and 100px down: outside the former 48px square.
  await press(b.x + b.width - 80, b.y + 100);
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `docs/review/${name}-expanded-corner-turn.png`,
  });
  await settle(step);
  await press(b.x + 80, b.y + 100);
  await settle(0);
  await page.screenshot({
    path: `docs/review/${name}-expanded-edge-settled.png`,
    fullPage: true,
  });
  await context.close();
  await page.video().saveAs(`docs/review/${name}-expanded-edges.webm`);
}
console.log("Recorded straight middle-edge and expanded corner turns.");
await browser.close();
