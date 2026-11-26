// Measures every piece of text in the atlas run against the brightest thing painted behind it.
// Usage: node scripts/check-front-run-contrast.mjs [baseURL]
// For each scene after the opening, at three scroll points and nine window sizes: the page is
// captured with all run text made transparent; for each line box of each showing text node the
// brightest pixel behind it gives the WCAG contrast of that text's colour. Text on a paper print
// is skipped (ink on paper). Prints the count below the threshold (4.5:1, or 3:1 for large text)
// and the weakest lines. Exit code 0 always: read the output.
// Known: at 320x568 the painting's "Illustration" caption can lie behind a print; it is reported
// as a failure because paper is behind it, though the reader does not see the caption there at all.
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const sizes = [[375, 548], [375, 667], [375, 812], [320, 568], [768, 1024], [900, 700], [1024, 768], [1280, 800], [1920, 1080]];
const points = [0.3, 0.55, 0.85];

const linear = (channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const luminance = (r, g, b) => 0.2126 * linear(r / 255) + 0.7152 * linear(g / 255) + 0.0722 * linear(b / 255);
const hide =
  ".atlas-run * { color: transparent !important; } .atlas-run .obs-trailer-links *::before, .atlas-run .obs-trailer-links *::after, .atlas-run .obs-trailer-progress, .atlas-run .obs-trailer-rail, .atlas-run .atlas-quote-photo { visibility: hidden !important; }";

const browser = await chromium.launch({ channel: "msedge" });
const measured = [];
for (const [width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${base}/`);
  await page.locator(".atlas-run h1").waitFor();
  await page.waitForTimeout(800);
  const scenes = await page.$$eval(".atlas-run [data-scene]", (nodes) => nodes.map((node) => node.dataset.scene));
  for (const id of scenes.slice(1)) {
    for (const fraction of points) {
      await page.evaluate(([sceneId, f]) => {
        const track = document.querySelector(".atlas-run .obs-trailer");
        const scene = track.querySelector(`[data-scene="${sceneId}"]`);
        const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
        const position = Number(scene.dataset.start) + Number(scene.dataset.span) * f;
        scrollTo(0, track.getBoundingClientRect().top + scrollY + ((track.offsetHeight - innerHeight) * position) / total);
      }, [id, fraction]);
      await page.waitForTimeout(1200);
      const boxes = await page.evaluate((sceneId) => {
        const scene = document.querySelector(`.atlas-run [data-scene="${sceneId}"]`);
        const found = [];
        const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent.trim()) continue;
          const parent = node.parentElement;
          if (parent.closest(".atlas-print")) continue;
          let opacity = 1;
          for (let item = parent; item && item !== scene.parentElement; item = item.parentElement) opacity *= Number(getComputedStyle(item).opacity);
          if (opacity < 0.99) continue; // not showing at this point of the scene
          const style = getComputedStyle(parent);
          const range = document.createRange();
          range.selectNodeContents(node);
          const rgb = style.color.match(/[\d.]+/g).map(Number);
          for (const rect of range.getClientRects()) {
            if (rect.width < 2 || rect.bottom < 0 || rect.top > innerHeight) continue;
            found.push({ text: node.textContent.trim().slice(0, 28), size: parseFloat(style.fontSize), weight: Number(style.fontWeight), rgb, x: rect.left, y: rect.top, w: rect.width, h: rect.height });
          }
        }
        return found;
      }, id);
      const style = await page.addStyleTag({ content: hide });
      await page.waitForTimeout(250);
      const shot = await sharp(await page.screenshot()).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      await style.evaluate((node) => node.remove());
      const scale = shot.info.width / width;
      for (const box of boxes) {
        let brightest = 0;
        const x0 = Math.max(0, Math.floor(box.x * scale));
        const x1 = Math.min(shot.info.width - 1, Math.ceil((box.x + box.w) * scale));
        const y0 = Math.max(0, Math.floor(box.y * scale));
        const y1 = Math.min(shot.info.height - 1, Math.ceil((box.y + box.h) * scale));
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x++) {
            const i = (y * shot.info.width + x) * 4;
            brightest = Math.max(brightest, luminance(shot.data[i], shot.data[i + 1], shot.data[i + 2]));
          }
        const ratio = (luminance(...box.rgb) + 0.05) / (brightest + 0.05);
        const large = box.size >= 24 || (box.size >= 18.66 && box.weight >= 700);
        measured.push({ width, height, scene: id, at: fraction, text: box.text, size: box.size, ratio, need: large ? 3 : 4.5 });
      }
    }
  }
  await page.close();
}
await browser.close();
measured.sort((a, b) => a.ratio / a.need - b.ratio / b.need);
console.log(`${measured.length} line boxes measured; below the threshold: ${measured.filter((item) => item.ratio < item.need).length}`);
for (const item of measured.slice(0, 12)) console.log(`${item.ratio.toFixed(2)} (needs ${item.need}) ${item.width}x${item.height} ${item.scene}@${item.at} ${item.size}px "${item.text}"`);
