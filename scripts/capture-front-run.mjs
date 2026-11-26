// Captures the atlas run and the arrival at fixed points for visual review.
// Usage: node scripts/capture-front-run.mjs [baseURL]
// Output: docs/review/front-run/*.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const out = "docs/review/front-run";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
for (const [width, height] of [[1280, 800], [375, 812]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${base}/`);
  await page.locator(".atlas-run h1").waitFor();
  await page.waitForTimeout(900);
  const scenes = await page.$$eval(".atlas-run [data-scene]", (nodes) => nodes.map((node) => node.dataset.scene));
  const shot = async (name) => {
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${width}-${name}.png` });
  };
  const toScene = (id, f) =>
    page.evaluate(([sceneId, fraction]) => {
      const track = document.querySelector(".atlas-run .obs-trailer");
      const scene = track.querySelector(`[data-scene="${sceneId}"]`);
      const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
      const position = Number(scene.dataset.start) + Number(scene.dataset.span) * fraction;
      scrollTo(0, track.getBoundingClientRect().top + scrollY + ((track.offsetHeight - innerHeight) * position) / total);
    }, [id, f]);
  await shot("hello-0");
  await toScene("hello", 0.6);
  await shot("hello-60");
  for (const id of scenes.slice(1)) {
    await toScene(id, 0.3);
    await shot(`${id}-30`);
    await toScene(id, 0.8);
    await shot(`${id}-80`);
  }
  const toArrival = (f) =>
    page.evaluate((fraction) => {
      const node = document.getElementById("book-arrival");
      const top = node.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + (node.offsetHeight - innerHeight) * fraction);
    }, f);
  for (const f of [0.2, 0.45, 0.7, 0.9, 1]) {
    await toArrival(f);
    await page.waitForTimeout(600);
    await shot(`arrival-${Math.round(f * 100)}`);
  }
  await page.close();
}
await browser.close();
console.log(`captures in ${out}`);
