import { chromium } from '@playwright/test';
import sharp from 'sharp';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:5173/');
await page.waitForTimeout(1000);

// Capture cover only
const coverEl = await page.$('.page--cover');
if (coverEl) {
  await coverEl.screenshot({ path: 'tmp/current_cover_v2.png' });
}

// Capture whole book shell
const bookEl = await page.$('.book-shell');
if (bookEl) {
  await bookEl.screenshot({ path: 'tmp/current_shell_v2.png' });
}

await browser.close();

// Now create side-by-side comparison with media_1793108048884_f84646a6.png
const ref = sharp('C:/Users/Dell/.gemini/antigravity/brain/92a8db43-9726-4d34-9840-74e35fc3a2f6/.user_uploaded/media_1793108048884_f84646a6.png');
const refMeta = await ref.metadata();

// Resize current cover to same height as ref (1024)
const cur = sharp('tmp/current_cover_v2.png');
const curResized = await cur.resize({ height: 1024 }).toBuffer();
const curMeta = await sharp(curResized).metadata();

// Combine side by side: [Reference (933x1024)] | [Our Hardcover (curMeta.width x 1024)]
const totalW = refMeta.width + curMeta.width + 20;
const comparison = await sharp({
  create: {
    width: totalW,
    height: 1024,
    channels: 4,
    background: { r: 30, g: 30, b: 30, alpha: 1 }
  }
})
.composite([
  { input: await ref.toBuffer(), left: 0, top: 0 },
  { input: curResized, left: refMeta.width + 20, top: 0 }
])
.png()
.toFile('tmp/side_by_side_comparison.png');

console.log('Comparison saved to tmp/side_by_side_comparison.png');
