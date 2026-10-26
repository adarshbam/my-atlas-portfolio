import { run } from "./day07-common.mjs";
import { pages } from "../src/data/portfolio.ts";
const referenceIndex = pages.findIndex((p) => p.id === "references");
const closingIndex = pages.findIndex((p) => p.id === "security-lab");
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const output = `docs/review/day07/${run}`;
await mkdir(output, { recursive: true });
await mkdir(`tmp/day07/${run}/video`, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: `tmp/day07/${run}/video`, size: { width: 1280, height: 900 } },
});
const page = await context.newPage();
const video = page.video();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const book = page.locator("#book");
async function settled(index) {
  await expect(book).toHaveAttribute("data-current-page", String(index));
  await expect(book).toHaveAttribute("data-turning", "false");
}
async function drag(forward, cancel, top) {
  const b = await book.boundingBox();
  const x = forward ? b.x + b.width - 6 : b.x + 6;
  const y = top ? b.y + 10 : b.y + b.height - 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(
    b.x + b.width / 2 + (forward ? -60 : 60),
    y + (top ? 90 : -90),
    { steps: 18 },
  );
  await expect(book).toHaveAttribute("data-turning", "true");
  if (cancel) await page.mouse.move(x, y, { steps: 18 });
  else
    await page.mouse.move(
      forward ? b.x + 20 : b.x + b.width - 20,
      y + (top ? 20 : -20),
      { steps: 18 },
    );
  await page.mouse.up();
  await page.mouse.move(b.x + b.width / 2, b.y - 20);
  await expect(book).toHaveAttribute("data-turning", "false");
}
const cdp = await context.newCDPSession(page);
let traceStarted = false;
let summary;
try {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Contact", exact: true })
    .click();
  await settled(closingIndex);
  for (const image of await page
    .locator(".library-slot .reference img")
    .all()) {
    await image.evaluate(async (el) => {
      el.loading = "eager";
      await el.decode();
    });
  }
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,blink.user_timing",
    transferMode: "ReturnAsStream",
  });
  traceStarted = true;
  await page.evaluate(() => {
    const book = document.querySelector("#book");
    const engine = book.querySelector(".flip-engine");
    window.__vaultMotion = {
      intervals: [],
      frames: 0,
      imagesAttached: true,
      sameEngine: true,
      running: true,
    };
    let previous;
    function tick(time) {
      const data = window.__vaultMotion;
      if (!data.running) return;
      if (book.dataset.turning === "true") {
        if (previous !== undefined) data.intervals.push(time - previous);
        previous = time;
        data.frames++;
        data.sameEngine &&= book.querySelector(".flip-engine") === engine;
        data.imagesAttached &&= [
          ...book.querySelectorAll(".reference img"),
        ].every(
          (img) =>
            img.closest(".book-page")?.contains(img) &&
            img.complete &&
            img.naturalWidth > 0,
        );
      } else previous = undefined;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  for (let iteration = 0; iteration < 10; iteration++) {
    await page
      .getByRole("button", { name: "Previous page", exact: true })
      .click();
    await settled(referenceIndex);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await settled(closingIndex);
  }
  for (let iteration = 0; iteration < 5; iteration++) {
    await drag(false, true, iteration % 2 === 0);
    await settled(closingIndex);
  }
  await drag(false, false, true);
  await settled(referenceIndex);
  await drag(true, true, false);
  await settled(referenceIndex);
  await drag(true, false, true);
  await settled(closingIndex);
  summary = await page.evaluate(() => {
    const data = window.__vaultMotion;
    data.running = false;
    const sorted = [...data.intervals].sort((a, b) => a - b);
    return {
      alternatingTurns: 20,
      forwardCancellations: 1,
      backwardCancellations: 5,
      committedDrags: 2,
      frames: data.frames,
      sameEngine: data.sameEngine,
      imagesAttached: data.imagesAttached,
      frameMedianMs: sorted[Math.floor(sorted.length * 0.5)] ?? null,
      frame95thMs: sorted[Math.floor(sorted.length * 0.95)] ?? null,
      maximumIntervalMs: sorted.at(-1) ?? null,
      intervalsOver33ms: sorted.filter((value) => value > 33.4).length,
    };
  });
  const traceComplete = new Promise((resolve) =>
    cdp.once("Tracing.tracingComplete", resolve),
  );
  await cdp.send("Tracing.end");
  const { stream } = await traceComplete;
  const chunks = [];
  while (true) {
    const chunk = await cdp.send("IO.read", { handle: stream });
    chunks.push(
      chunk.base64Encoded
        ? Buffer.from(chunk.data, "base64")
        : Buffer.from(chunk.data),
    );
    if (chunk.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  await writeFile(
    `docs/review/day07/${run}/motion-trace.json.gz`,
    gzipSync(Buffer.concat(chunks)),
  );
  summary = {
    ...summary,
    errors,
    conditions:
      "Headless Edge, 1280×900, localhost, video/DevTools tracing enabled. RAF intervals are diagnostic; not physical-device 60fps acceptance.",
    trace: `docs/review/day07/${run}/motion-trace.json.gz`,
    video: `${output}/supporting-turns-reversal.webm`,
  };
} finally {
  if (traceStarted && !summary) await cdp.send("Tracing.end").catch(() => {});
  await context.close();
  if (video) await video.saveAs(`${output}/supporting-turns-reversal.webm`);
  await browser.close();
}
await writeFile(
  `${output}/motion-summary.json`,
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
if (errors.length || !summary.sameEngine || !summary.imagesAttached)
  process.exitCode = 1;
