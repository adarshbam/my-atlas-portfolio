// Captures the opening of the book (plan Task 10): the desk going dark around it and the band
// of lamp light crossing the cover. For each book theme and width it opens /#book, presses
// "Open book", and takes a picture mid-turn (about 400ms) and settled (2s); then it returns
// to the cover and takes one more, to show the desk lit again.
// Usage: node scripts/capture-book-opening.mjs [baseURL] [--reduced] [--strip]
// Output: docs/review/front-run/opening-<width>-<theme>-<moment>.png
// --strip: instead, one fresh page per moment of the opening turn and of the closing turn (a
//   screenshot takes longer than the gap between two moments), joined into one sheet per width
//   and theme: docs/review/front-run/opening-strip-<width>-<theme>-<open|close>.png
// Each line printed also gives the measured contrast of the words that stand on the desk
// (toolbar, page count) against the desk as it is painted beside them at that moment.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const base = process.argv.find((value) => value.startsWith("http")) ?? "http://127.0.0.1:4305";
const reduced = process.argv.includes("--reduced");
const strip = process.argv.includes("--strip");
const out = "docs/review/front-run";
mkdirSync(out, { recursive: true });

const sizes = [[1280, 800], [375, 812]];
const themes = ["light", "dark"];
const browser = await chromium.launch({ channel: "msedge" });

const open = async (width, height, theme) => {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await context.addInitScript((value) => {
    try {
      localStorage.setItem("atlas-theme-v1", value);
    } catch {
      /* Storage may be unavailable. */
    }
  }, theme);
  const page = await context.newPage();
  await page.goto(`${base}/#book`);
  await page.locator('#book[data-ready="true"]').waitFor();
  await page.locator('#book-arrival[data-arrived="true"]').waitFor();
  await page.waitForTimeout(800);
  return { context, page };
};

const state = (page, moment) =>
  page.evaluate((label) => {
    const book = document.getElementById("book");
    const dim = document.querySelector(".atlas-arrival-dim");
    const band = document.querySelector(".atlas-arrival-band");
    const light = band ? getComputedStyle(band, "::before") : null;
    return {
      moment: label,
      theme: document.documentElement.dataset.theme,
      turning: book?.dataset.turning,
      kind: book?.dataset.turnKind ?? null,
      cover: book?.dataset.cover,
      dim: dim ? Number(Number(getComputedStyle(dim).opacity).toFixed(3)) : null,
      band: band
        ? {
            shown: getComputedStyle(band).display !== "none",
            x: light ? Math.round(new DOMMatrix(light.transform).e) : null,
            running: band.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
          }
        : null,
    };
  }, moment);

// Contrast of each piece of desk text against the desk as painted: the text's own colour
// against the lightest and the darkest pixel in a strip just above the text's box.
const luminance = ([r, g, b]) => {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const contrast = async (page, shot) => {
  const targets = await page.evaluate(() =>
    [
      [".contents-trigger", "Contents"],
      ['.theme-switch button[aria-pressed="false"]', "theme"],
      [".page-counter", "count"],
      [".counter-divider", "slash"],
    ].flatMap(([selector, name]) => {
      const node = document.querySelector(selector);
      if (!node) return [];
      const box = node.getBoundingClientRect();
      const colour = getComputedStyle(node).color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return [{ name, colour, x: Math.round(box.left), y: Math.round(box.top) - 6, width: Math.max(4, Math.round(box.width)) }];
    }),
  );
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const result = {};
  for (const target of targets) {
    if (target.y < 0 || target.y + 3 > info.height) continue;
    let low = Infinity;
    let high = -Infinity;
    for (let y = target.y; y < target.y + 3; y++)
      for (let x = Math.max(0, target.x); x < Math.min(info.width, target.x + target.width); x++) {
        const index = (y * info.width + x) * info.channels;
        const value = luminance([data[index], data[index + 1], data[index + 2]]);
        low = Math.min(low, value);
        high = Math.max(high, value);
      }
    // For normal colour values CSS colours are 0..255 already; srgb() values would be 0..1.
    const text = luminance(target.colour.every((value) => value <= 1) ? target.colour.map((value) => value * 255) : target.colour);
    result[target.name] = Number(Math.min(ratio(text, low), ratio(text, high)).toFixed(2));
  }
  return result;
};

const report = [];
if (!strip)
  for (const [width, height] of sizes)
    for (const theme of themes) {
      const { context, page } = await open(width, height, theme);
      const name = (moment) => `${out}/opening-${width}-${theme}${reduced ? "-reduced" : ""}-${moment}.png`;
      const shot = async (moment) => {
        const buffer = await page.screenshot({ path: name(moment) });
        report.push({ width, ...(await state(page, moment)), contrast: await contrast(page, buffer) });
      };
      await shot("closed");
      const started = Date.now();
      await page.getByRole("button", { name: "Open book" }).first().click();
      await page.waitForTimeout(Math.max(0, 400 - (Date.now() - started)));
      await shot("turn-400");
      await page.waitForTimeout(Math.max(0, 800 - (Date.now() - started)));
      await shot("turn-800");
      await page.waitForTimeout(Math.max(0, 2000 - (Date.now() - started)));
      await shot("open-2000");
      // Back to the cover: the desk is lit again.
      const back = Date.now();
      await page.getByRole("button", { name: "Previous page", exact: true }).click();
      await page.waitForTimeout(400);
      await shot("closing-400");
      await page.waitForTimeout(Math.max(0, 2200 - (Date.now() - back)));
      await shot("closed-again");
      await context.close();
    }
else {
  const moments = [80, 200, 320, 440, 560, 700, 900, 1150, 1400];
  for (const [width, height] of sizes)
    for (const theme of themes)
      for (const turn of ["open", "close"]) {
        const frames = [];
        for (const moment of moments) {
          const { context, page } = await open(width, height, theme);
          if (turn === "close") {
            await page.getByRole("button", { name: "Open book" }).first().click();
            await page.waitForTimeout(2200);
          }
          const button = turn === "open" ? page.getByRole("button", { name: "Open book" }).first() : page.getByRole("button", { name: "Previous page", exact: true });
          const started = Date.now();
          await button.click();
          await page.waitForTimeout(Math.max(0, moment - (Date.now() - started)));
          frames.push(await page.screenshot());
          report.push({ width, turn, at: Date.now() - started, ...(await state(page, `${turn}-${moment}`)) });
          await context.close();
        }
        // One sheet, three across, each frame at a size that can still be read.
        const columns = 3;
        const scale = width > 800 ? 0.5 : 1;
        const cell = { width: Math.round(width * scale), height: Math.round(height * scale) };
        const rows = Math.ceil(frames.length / columns);
        const tiles = await Promise.all(frames.map((frame) => sharp(frame).resize(cell.width, cell.height).png().toBuffer()));
        await sharp({ create: { width: cell.width * columns, height: cell.height * rows, channels: 3, background: "#000000" } })
          .composite(tiles.map((input, index) => ({ input, left: (index % columns) * cell.width, top: Math.floor(index / columns) * cell.height })))
          .png()
          .toFile(`${out}/opening-strip-${width}-${theme}-${turn}.png`);
      }
}
await browser.close();
for (const line of report) console.log(JSON.stringify(line));
console.log(`captures in ${out}`);
