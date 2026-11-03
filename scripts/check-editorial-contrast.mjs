import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const revision = process.env.ATLAS_REVIEW_NAME ?? "editorial-opening";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const luminance = (rgb) =>
  rgb
    .map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
for (const [width, height] of [
  [375, 844],
  [768, 1200],
  [1280, 1200],
  [1920, 1200],
  [375, 600],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:4173");
  await page.locator("#book[data-ready=true]").waitFor();
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await page
    .locator('#book[data-current-page="1"][data-turning="false"]')
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".library-slot .portrait").evaluate((img) => img.decode());
  const face = page.locator(".library-slot .page--portrait");
  const boxes = await face.evaluate((face) => {
    const targets = [
      ...face.querySelectorAll(
        ".portrait-copy h2,.portrait-copy p,.portrait-note,.running-head span,.folio span",
      ),
    ];
    const boxes = [];
    for (const el of targets) {
      const style = getComputedStyle(el);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const r of range.getClientRects())
          boxes.push({
            text: walker.currentNode.textContent,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            size: parseFloat(style.fontSize),
            color: style.color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number),
          });
      }
      el.style.visibility = "hidden";
    }
    return boxes;
  });
  const { data, info } = await sharp(await page.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const b of boxes) {
    let worst = Infinity;
    const fg = luminance(b.color);
    for (
      let y = Math.max(0, Math.ceil(b.y));
      y < Math.min(info.height, Math.floor(b.y + b.height));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(b.x));
        x < Math.min(info.width, Math.floor(b.x + b.width));
        x++
      ) {
        const i = (y * info.width + x) * info.channels;
        const bg = luminance([...data.subarray(i, i + 3)]);
        worst = Math.min(
          worst,
          (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
        );
      }
    results.push({
      width,
      height,
      text: b.text,
      ratio: Number(worst.toFixed(2)),
      required: b.size >= 24 ? 3 : 4.5,
    });
  }
  await page.close();
}
await browser.close();
await mkdir(`tmp/${revision}`, { recursive: true });
await writeFile(
  `tmp/${revision}/portrait-contrast.json`,
  JSON.stringify(results, null, 2),
);
const failures = results.filter((r) => r.ratio < r.required);
console.log(
  JSON.stringify(
    {
      samples: results.length,
      minimum: Math.min(...results.map((r) => r.ratio)),
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) throw Error("Portrait text contrast below AA");
