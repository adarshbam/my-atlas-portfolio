import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const revision = process.env.ATLAS_REVIEW_NAME ?? "cover-refinement";
await mkdir(`tmp/${revision}`, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const luminance = (rgb) => {
  const c = rgb.map((x) => {
    x /= 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
for (const [width, height] of [
  [375, 844],
  [768, 1024],
  [1280, 900],
  [1920, 1080],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:4173");
  await page.locator("#book[data-ready=true]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page
    .locator(".library-slot .cover-art")
    .evaluate((img) => img.decode());
  const text = await page
    .locator(".library-slot .cover-inner")
    .evaluate((inner) =>
      [...inner.querySelectorAll(".cover-kicker, .cover-copy > *")].map(
        (el) => {
          const style = getComputedStyle(el),
            rect = el.getBoundingClientRect();
          const scale = Number(
            document.querySelector("#book").dataset.presentationScale,
          );
          return {
            name: el.className,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            color: style.color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((value) =>
                style.color.startsWith("color(") ? value * 255 : value,
              ),
            size: parseFloat(style.fontSize) * scale,
          };
        },
      ),
    );
  await page
    .locator(".library-slot .cover-inner")
    .evaluate((el) => (el.style.visibility = "hidden"));
  const screenshot = await page.screenshot();
  await page
    .locator(".library-slot .cover-inner")
    .evaluate((el) => (el.style.visibility = ""));
  const { data, info } = await sharp(screenshot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const box of text) {
    let worst = Infinity;
    for (
      let y = Math.max(0, Math.ceil(box.y));
      y < Math.min(info.height, Math.floor(box.y + box.height));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(box.x));
        x < Math.min(info.width, Math.floor(box.x + box.width));
        x++
      ) {
        const i = (y * info.width + x) * 3,
          bg = luminance([data[i], data[i + 1], data[i + 2]]),
          fg = luminance(box.color);
        worst = Math.min(
          worst,
          (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
        );
      }
    results.push({
      width,
      text: box.name,
      size: box.size,
      worstRatio: Number(worst.toFixed(2)),
      required: box.size >= 24 ? 3 : 4.5,
    });
  }
  await page.close();
}
await writeFile(
  `tmp/${revision}/cover-contrast.json`,
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((item) => item.worstRatio < item.required))
  throw Error("Cover text contrast below AA");
