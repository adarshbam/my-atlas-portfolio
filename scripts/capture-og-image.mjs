// Link-preview image: the first screen of the front page (the name, the role and the portrait),
// captured from the built site.
// Usage: node scripts/capture-og-image.mjs [baseURL]   (default http://127.0.0.1:4305)
// Writes public/og-atlas.jpg at 1200×630, JPEG quality 82, and fails above 250 KB.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { statSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const out = "public/og-atlas.jpg";
const limit = 250 * 1024;

const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "light" });
  // With motion allowed the opening scene fills the window; standing still, the next block would show under it.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${base}/`);
  await page.waitForSelector(".atlas-run h1");
  await page.evaluate(() => document.fonts.ready);
  // Let the portrait settle.
  await page.waitForFunction(() => [...document.images].filter((i) => i.getBoundingClientRect().width > 0 && i.loading !== "lazy").every((i) => i.complete));
  // A link preview is a picture of the person and the claim, not of the controls around them.
  await page.addStyleTag({ content: ".atlas-run :is(.obs-trailer-rail, .obs-trailer-links, .atlas-hint) { visibility: hidden !important; }" });
  await page.waitForTimeout(600);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
} finally {
  await browser.close();
}

const { width, height } = await sharp(out).metadata();
const bytes = statSync(out).size;
if (width !== 1200 || height !== 630) throw new Error(`${out} is ${width}×${height}, expected 1200×630`);
if (bytes > limit) throw new Error(`${out} is ${bytes} bytes, above ${limit}`);
console.log(`${out}: ${width}×${height}, ${(bytes / 1024).toFixed(1)} KB`);
