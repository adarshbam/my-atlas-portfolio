// Extra review captures of the atlas run, beyond scripts/capture-front-run.mjs (1280 and 375).
// Usage: node scripts/capture-front-run-sizes.mjs [outDir] [baseURL]
// Output (default docs/review/front-run/sizes):
//   <W>x<H>-<scene>-80.png        each scene after the opening at 0.8, at more window sizes
//   still-<W>x<H>-<scene>.png     each scene block whole, with reduced motion
//   short-<W>x<H>-<scene>.png     each scene block whole, in a window too short for the pinned
//                                  stage (a phone on its side), where the run stands still
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "docs/review/front-run/sizes";
const base = process.argv[3] ?? "http://127.0.0.1:4305";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const open = async (width, height, reducedMotion = "no-preference") => {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await page.locator(".atlas-run h1").waitFor();
  await page.waitForTimeout(900);
  const scenes = await page.$$eval(".atlas-run [data-scene]", (nodes) => nodes.map((node) => node.dataset.scene));
  return { context, page, scenes };
};
const blocks = async (prefix, width, height, reducedMotion) => {
  const { context, page, scenes } = await open(width, height, reducedMotion);
  for (const id of scenes) {
    const node = page.locator(`.atlas-run [data-scene="${id}"]`);
    await node.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await node.screenshot({ path: `${out}/${prefix}-${width}x${height}-${id}.png` });
  }
  await context.close();
};

for (const [width, height] of [[375, 548], [375, 667], [768, 1024], [900, 700], [1024, 768], [1180, 800], [1280, 600], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]]) {
  const { context, page, scenes } = await open(width, height);
  for (const id of scenes.slice(1)) {
    await page.evaluate(([sceneId, fraction]) => {
      const track = document.querySelector(".atlas-run .obs-trailer");
      const scene = track.querySelector(`[data-scene="${sceneId}"]`);
      const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
      const position = Number(scene.dataset.start) + Number(scene.dataset.span) * fraction;
      scrollTo(0, track.getBoundingClientRect().top + scrollY + ((track.offsetHeight - innerHeight) * position) / total);
    }, [id, 0.8]);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/${width}x${height}-${id}-80.png` });
  }
  await context.close();
}
for (const [width, height] of [[1280, 800], [375, 812]]) await blocks("still", width, height, "reduce");
for (const [width, height] of [[812, 375], [667, 375]]) await blocks("short", width, height, "no-preference");
await browser.close();
console.log(`captures in ${out}`);
