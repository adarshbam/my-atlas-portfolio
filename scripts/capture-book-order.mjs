// Captures the book pages whose place changed when the book took the run's project order
// (plan Task 9): the contents page, and the Harigurus / pipeline spread, which swapped sides.
// Usage: node scripts/capture-book-order.mjs [baseURL]
// Output: docs/review/front-run/order-*.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const out = "docs/review/front-run";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const report = [];
for (const [width, height] of [[1280, 800], [768, 1024], [375, 812]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${base}/#book`);
  const book = page.locator("#book");
  await page.locator('#book[data-ready="true"]').waitFor();
  await page.locator('#book-arrival[data-arrived="true"]').waitFor();
  const settle = async () => {
    await page.locator('#book[data-turning="false"]').waitFor();
    await page.waitForTimeout(900);
  };
  const chapter = async (name) => {
    const trigger = page.getByRole("button", { name: "Contents", exact: true });
    if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
    await page.locator(".chapter-nav button").filter({ hasText: new RegExp(`^${name}$`) }).click();
    await settle();
  };
  const face = (id) => page.locator(`.library-slot .book-page[aria-hidden="false"][data-page-id="${id}"]`);
  const record = async (name, ids) => {
    await page.screenshot({ path: `${out}/order-${width}-${name}.png` });
    for (const id of ids) {
      const node = face(id);
      report.push({
        width,
        shot: name,
        id,
        current: await book.getAttribute("data-current-page"),
        logical: await book.getAttribute("data-logical-page"),
        head: await node.locator(".running-head span").evaluateAll((spans) => spans.slice(0, 2).map((span) => span.textContent)),
        folio: await node.locator(".folio span").evaluateAll((spans) => spans.map((span) => span.textContent)),
        left: Math.round((await node.boundingBox()).x),
        overflow: await node.locator(".sheet-surface").evaluate((surface) => surface.hasAttribute("data-page-overflow")),
      });
    }
  };
  /** Scrolls a page's own scroll area to its end, so the lower half can be looked at too. */
  const toEnd = (id) => face(id).locator(".page-inner").evaluate((port) => { port.scrollTop = port.scrollHeight; });

  if (width < 768) {
    // One page at a time.
    await chapter("Introduction");
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await settle();
    await record("contents", ["contents"]);
    for (const [name, id] of [["Harigurus", "harigurus"], ["Pipeline", "pipeline"]]) {
      await chapter(name);
      await record(id, [id]);
      await toEnd(id);
      await page.waitForTimeout(400);
      await record(`${id}-end`, [id]);
    }
  } else {
    await chapter("Introduction");
    await record("contents", ["contents"]);
    await chapter("Harigurus");
    await record("spread", ["harigurus", "pipeline"]);
    await toEnd("harigurus");
    await toEnd("pipeline");
    await page.waitForTimeout(400);
    await record("spread-end", ["harigurus", "pipeline"]);
    // The spread before and the spread after, to see the neighbours still face each other.
    await chapter("References");
    await record("references", ["references", "references-continued"]);
  }
  // The contents panel, with the chapter that is open marked.
  await chapter("Pipeline");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator("#atlas-contents").waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/order-${width}-panel.png` });
  report.push({
    width,
    shot: "panel",
    chapters: await page.locator(".chapter-nav button").evaluateAll((buttons) => buttons.map((button) => `${button.textContent}${button.getAttribute("aria-current") ? " *" : ""}`)),
  });
  await page.close();
}
await browser.close();
for (const line of report) console.log(JSON.stringify(line));
console.log(`captures in ${out}`);
