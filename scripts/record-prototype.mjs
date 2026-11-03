import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("docs/review", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 1200 },
  reducedMotion: "no-preference",
  recordVideo: { dir: "tmp/recordings", size: { width: 1280, height: 1200 } },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4173/");
await page.locator('[data-ready="true"]').waitFor();
await page.evaluate(() => document.fonts.ready);
const session = await context.newCDPSession(page);
await session.send("Tracing.start", {
  categories:
    "devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.frame",
  transferMode: "ReturnAsStream",
});
await page.screenshot({
  path: "docs/review/opaque-paper-introduction.png",
  fullPage: true,
});
const b = await page.locator("#book").boundingBox();
await page.waitForTimeout(500);
await page.mouse.move(b.x + b.width - 6, b.y + b.height - 10);
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/review/opaque-paper-right.png" });
await page.screenshot({
  path: "docs/review/opaque-paper-right-detail.png",
  clip: { x: b.x + b.width * 0.75, y: b.y + b.height * 0.75, width: b.width / 4, height: b.height / 4 },
});
await page.mouse.move(b.x + b.width / 2, b.y - 20);
await page.waitForTimeout(300);
await page.mouse.move(b.x + b.width - 6, b.y + b.height - 10);
await page.mouse.down();
await page.mouse.move(b.x + b.width * 0.65, b.y + b.height - 90, { steps: 24 });
await page.screenshot({ path: "docs/review/opaque-paper-drag.png" });
await page.mouse.move(b.x + b.width - 6, b.y + b.height - 10, { steps: 24 });
await page.mouse.up();
await page.mouse.move(b.x + b.width / 2, b.y - 20);
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Next page", exact: true }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "docs/review/opaque-paper-arrow-turn.png" });
await page.waitForTimeout(800);
await page.screenshot({
  path: "docs/review/opaque-paper-vault.png",
  fullPage: true,
});
await page.mouse.move(b.x + 6, b.y + b.height - 10);
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/review/opaque-paper-left.png" });
await page.screenshot({
  path: "docs/review/opaque-paper-left-detail.png",
  clip: { x: b.x, y: b.y + b.height * 0.75, width: b.width / 4, height: b.height / 4 },
});
await page.mouse.move(b.x + b.width / 2, b.y - 20);
await page.waitForTimeout(300);
await page.getByRole("button", { name: "Previous page", exact: true }).click();
await page.waitForTimeout(1100);
const trace = new Promise((resolve) =>
  session.once("Tracing.tracingComplete", resolve),
);
await session.send("Tracing.end");
const { stream } = await trace;
let data = "";
for (;;) {
  const chunk = await session.send("IO.read", { handle: stream });
  data += chunk.data;
  if (chunk.eof) break;
}
await session.send("IO.close", { handle: stream });
await writeFile("tmp/audits/opaque-paper-trace.json", data);
console.log(
  "Browser",
  await browser.version(),
  "Logical processors",
  await page.evaluate(() => navigator.hardwareConcurrency),
);
await context.close();
await page.video().saveAs("docs/review/opaque-paper.webm");
await browser.close();
