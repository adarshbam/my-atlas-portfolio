// Records a short clip of a scroll-driven page for outreach posts (not shipped with the site).
// Usage: node scripts/record-story-trailer.mjs [baseURL] [path] [name] [seconds]
//   defaults: http://127.0.0.1:4305  /story  story-trailer  14
//   the front page: node scripts/record-story-trailer.mjs http://127.0.0.1:4305 / front-run 26
// Output: output/video/<name>.mp4
// /story is scrolled through its trailer only; any other path from its top to its end
// (on the front page: the run, then the arrival at the book).
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:4305";
const dir = "output/video";
const raw = join(dir, "raw");
const path = process.argv[3] ?? "/story";
const name = process.argv[4] ?? "story-trailer";
const seconds = Number(process.argv[5] ?? 14);
const story = path === "/story" || path === "/story/";
mkdirSync(raw, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: raw, size: { width: 1280, height: 720 } } });
const page = await context.newPage();
await page.goto(`${base}${path}`);
await page.locator(story ? ".obs-hero h1" : "h1").first().waitFor();
await page.waitForTimeout(800);
await page.evaluate(
  ([duration, trailerOnly]) =>
    new Promise((done) => {
      const track = trailerOnly ? document.querySelector(".obs-trailer") : document.documentElement;
      const from = trailerOnly ? track.getBoundingClientRect().top + scrollY : 0;
      // Measured each frame: the front page grows when the book mounts near the end.
      const length = () => (trailerOnly ? track.offsetHeight : track.scrollHeight) - innerHeight;
      const began = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - began) / duration);
        scrollTo(0, from + length() * progress);
        if (progress < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    }),
  [seconds * 1000, story],
);
await page.waitForTimeout(1500);
await context.close();
await browser.close();

const webm = join(raw, readdirSync(raw).find((file) => file.endsWith(".webm")));
const out = join(dir, `${name}.mp4`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", webm, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { windowsHide: true });
rmSync(raw, { recursive: true, force: true });
console.log("wrote", out);
