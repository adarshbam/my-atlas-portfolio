// Captures the story trailer at fixed points of each scene for visual review.
// Usage: node scripts/capture-story-trailer.mjs [baseURL]
// Output: docs/review/story-trailer/*.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const out = "docs/review/story-trailer";
mkdirSync(out, { recursive: true });

// [scene, fraction of the scene as measured by its segment table]
const shots = [
  ["look", 0], ["look", 0.2], ["look", 0.45], ["look", 0.95],
  ["ask", 0.08], ["ask", 0.55],
  ["code", 0.08], ["code", 0.8],
  ["make", 0.4], ["make", 0.9],
  ["deliver", 0.3], ["deliver", 0.55], ["deliver", 0.8],
  ["close", 1],
];

const browser = await chromium.launch({ channel: "msedge" });
for (const [width, height] of [[1280, 800], [375, 812]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${base}/story`);
  await page.locator(".obs-hero h1").waitFor();
  await page.waitForTimeout(600);
  for (const [index, [id, fraction]] of shots.entries()) {
    await page.evaluate(([sceneId, f]) => {
      const track = document.querySelector(".obs-trailer");
      const scene = document.querySelector(`[data-scene="${sceneId}"]`);
      const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
      const position = Number(scene.dataset.start) + Number(scene.dataset.span) * f;
      const top = track.getBoundingClientRect().top + scrollY;
      scrollTo(0, sceneId === "look" && f === 0 ? 0 : top + ((track.offsetHeight - innerHeight) * position) / total);
    }, [id, fraction]);
    await page.waitForTimeout(700);
    const name = `${String(index + 1).padStart(2, "0")}-${id}-${String(Math.round(fraction * 100)).padStart(3, "0")}`;
    await page.screenshot({ path: `${out}/motion-${width}-${name}.png` });
  }
  await page.close();

  const still = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
  await still.goto(`${base}/story`);
  await still.locator(".obs-hero h1").waitFor();
  await still.waitForTimeout(600);
  // Scroll through once so lazy images are loaded before the long capture.
  for (const image of await still.locator(".obs-trailer img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((node) => node.complete || new Promise((done) => node.addEventListener("load", done, { once: true })));
  }
  await still.locator(".obs-trailer").screenshot({ path: `${out}/still-${width}.png` });
  await still.close();
}
await browser.close();
console.log("captured to", out);
