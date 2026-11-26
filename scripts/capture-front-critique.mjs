// Captures for a design critique of the front page (plan Task 14): every scene of the run at
// three scroll points, the arrival at the book at five, the opened book, and the still blocks
// shown under reduced motion, at four window sizes.
// Usage: node scripts/capture-front-critique.mjs [outDir] [baseURL] [sizes]
//   outDir   default docs/review/front-run/critique
//   sizes    default 1280x800,1920x1080,768x1024,375x812
// Output:
//   <W>x<H>-<n>-<scene>-<percent>.png     n = the scene's place in the run
//   <W>x<H>-7-arrival-<percent>.png
//   <W>x<H>-8-book-open.png               the book after "Open book"
//   still-<W>x<H>-<n>-<scene>.png         1280x800 and 375x812 only, reduced motion
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "docs/review/front-run/critique";
const base = process.argv[3] ?? "http://127.0.0.1:4305";
const sizes = (process.argv[4] ?? "1280x800,1920x1080,768x1024,375x812").split(",").map((size) => size.split("x").map(Number));
const POINTS = [0.3, 0.55, 0.8];
const ARRIVAL = [0.2, 0.45, 0.7, 0.9, 1];
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const open = async (width, height, reducedMotion = "no-preference") => {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${base}/`);
  await page.locator(".atlas-run h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const scenes = await page.$$eval(".atlas-run [data-scene]", (nodes) => nodes.map((node) => node.dataset.scene));
  return { context, page, scenes };
};

for (const [width, height] of sizes) {
  const { context, page, scenes } = await open(width, height);
  const tag = `${width}x${height}`;
  await page.screenshot({ path: `${out}/${tag}-1-hello-0.png` });
  for (const [index, id] of scenes.entries()) {
    for (const fraction of id === "hello" ? [0.35, 0.7] : POINTS) {
      await page.evaluate(([sceneId, at]) => {
        const track = document.querySelector(".atlas-run .obs-trailer");
        const scene = track.querySelector(`[data-scene="${sceneId}"]`);
        const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
        const position = Number(scene.dataset.start) + Number(scene.dataset.span) * at;
        scrollTo(0, track.getBoundingClientRect().top + scrollY + ((track.offsetHeight - innerHeight) * position) / total);
      }, [id, fraction]);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `${out}/${tag}-${index + 1}-${id}-${Math.round(fraction * 100)}.png` });
    }
  }
  for (const fraction of ARRIVAL) {
    await page.evaluate((at) => {
      const arrival = document.querySelector("#book-arrival");
      const pin = arrival.firstElementChild;
      const top = arrival.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + (arrival.offsetHeight - Math.max(pin.offsetHeight, innerHeight)) * at);
    }, fraction);
    await page.waitForTimeout(fraction === 1 ? 2500 : 1500);
    await page.screenshot({ path: `${out}/${tag}-7-arrival-${Math.round(fraction * 100)}.png` });
  }
  await page.locator('#book[data-ready="true"]').waitFor();
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/${tag}-8-book-open.png` });
  await context.close();
}

for (const [width, height] of [[1280, 800], [375, 812]]) {
  const { context, page, scenes } = await open(width, height, "reduce");
  for (const [index, id] of scenes.entries()) {
    const node = page.locator(`.atlas-run [data-scene="${id}"]`);
    await node.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await node.screenshot({ path: `${out}/still-${width}x${height}-${index + 1}-${id}.png` });
  }
  await context.close();
}
await browser.close();
console.log(`captures in ${out}`);
