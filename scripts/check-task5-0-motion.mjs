import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const records = [];
try {
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173");
    const book = page.locator("#book");
    await expect(book).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => {
      const engine = document.querySelector(".flip-engine");
      const data = (window.__referenceMotion = {
        frames: 0,
        maximumScale: 1,
        unreadableQuotes: 0,
        competingFrames: 0,
        sameEngine: true,
        animations: {},
        done: false,
      });
      let started;
      function sample(now) {
        const book = document.querySelector("#book");
        const faces = [
          ...document.querySelectorAll(
            ".library-slot .page--references[aria-hidden=false]",
          ),
        ];
        const images = [
          ...document.querySelectorAll(".library-slot .reference img"),
        ];
        if (
          book.dataset.turning === "true" &&
          images.some((image) => image.getAnimations().length)
        )
          data.competingFrames++;
        if (faces.length && book.dataset.turning === "false") {
          started ??= now;
          data.frames++;
          data.sameEngine &&= document.querySelector(".flip-engine") === engine;
          for (const face of faces) {
            for (const quote of face.querySelectorAll("blockquote p")) {
              const style = getComputedStyle(quote);
              if (style.opacity !== "1" || style.visibility !== "visible")
                data.unreadableQuotes++;
            }
            for (const image of face.querySelectorAll("img")) {
              const transform = getComputedStyle(image).transform;
              const scale =
                transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
              data.maximumScale = Math.max(scale, data.maximumScale);
            }
            for (const animation of face.getAnimations({ subtree: true })) {
              const timing = animation.effect.getTiming();
              data.animations[animation.animationName] = {
                duration: timing.duration,
                delay: timing.delay,
                iterations: timing.iterations,
              };
            }
          }
          if (now - started >= 1600) {
            data.done = true;
            return;
          }
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "References", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => window.__referenceMotion.done))
      .toBe(true);
    const record = await page.evaluate(() => window.__referenceMotion);
    expect(record.frames).toBeGreaterThan(0);
    expect(record.unreadableQuotes).toBe(0);
    expect(record.competingFrames).toBe(0);
    expect(record.maximumScale).toBeLessThanOrEqual(1.041);
    expect(record.sameEngine).toBe(true);
    expect(record.animations["reference-mask"]).toBeTruthy();
    for (const timing of Object.values(record.animations)) {
      expect(timing.duration + timing.delay).toBeLessThanOrEqual(1600);
      expect(timing.iterations).toBe(1);
    }
    // A live preference change removes supporting transforms and masking.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".plain-spread")).toBeVisible();
    const reducedImages = page.locator(
      ".plain-face[aria-hidden=false] .reference img",
    );
    for (const image of await reducedImages.all()) {
      await expect(image).toHaveCSS("animation-name", "none");
      await expect(image).toHaveCSS("transform", "none");
      await expect(image).toHaveCSS("clip-path", "none");
    }
    records.push({
      width,
      ...record,
      reducedImagesChecked: await reducedImages.count(),
    });
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  "docs/review/task5-0/final/supporting-motion.json",
  JSON.stringify(records, null, 2),
);
console.log(JSON.stringify(records, null, 2));
