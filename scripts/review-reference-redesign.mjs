import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Run against the production preview. Browser/video capture is lab evidence,
// not acceptance of the book's appearance or continuous motion.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const revision = process.env.ATLAS_REVIEW_NAME ?? "reference-redesign";
const output = `docs/review/${revision}`;
const dataOutput = `tmp/${revision}`;
await mkdir(output, { recursive: true });
await mkdir(dataOutput, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const failures = [];
const onlyDrag = process.env.ATLAS_REVIEW_ONLY_DRAG === "1";
const dragErrors = [];
const dragStates = [];

async function settled(page, index) {
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-current-page", String(index));
  await expect(book).toHaveAttribute("data-turning", "false");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(220); // Finish the approved plain-mode crossfade.
}

async function capture(page, viewport, mode, state, errors) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(async () => {
    const visibleImages = [
      ...document.querySelectorAll(".book-page img"),
    ].filter((image) => image.closest('[aria-hidden="false"]'));
    await Promise.all(
      visibleImages.map((image) => image.decode().catch(() => {})),
    );
  });
  const metrics = await page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return {
        x: r.x + scrollX,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      };
    };
    const book = document.querySelector("#book");
    const faces = [
      ...document.querySelectorAll(
        '.library-slot .book-page[aria-hidden="false"],.plain-face[aria-hidden="false"] .book-page',
      ),
    ];
    const token = (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return {
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      scrollY,
      book: rect(book),
      binding: rect(book.querySelector(".binding")),
      stage: rect(document.querySelector(".book-stage")),
      scale: Number(book.dataset.presentationScale),
      page: book.dataset.currentPage,
      materialTokens: Object.fromEntries(
        [
          "--page-ratio",
          "--book-width",
          "--material-charcoal-opacity",
          "--material-paper-opacity",
          "--material-fore-edge-depth",
          "--material-bottom-depth",
          "--material-board-overhang",
        ].map((name) => [name, token(name)]),
      ),
      faces: faces.map((face) => {
        const surface = face.querySelector(".sheet-surface") ?? face;
        const inner = face.querySelector(".page-inner");
        const folio = face.querySelector(".folio");
        const box = rect(face);
        const folioBox = rect(folio);
        const style = getComputedStyle(surface);
        return {
          id: face.dataset.pageId,
          box,
          pageRatio: box.width / box.height,
          background: style.backgroundColor,
          surfaceClip: style.clipPath,
          grainOpacity: getComputedStyle(surface, "::after").opacity,
          inner: inner && {
            clientWidth: inner.clientWidth,
            scrollWidth: inner.scrollWidth,
            clientHeight: inner.clientHeight,
            scrollHeight: inner.scrollHeight,
            overflowY: getComputedStyle(inner).overflowY,
          },
          folio: folioBox,
          folioInsidePage:
            !folioBox ||
            (folioBox.x >= box.x - 1 &&
              folioBox.x + folioBox.width <= box.x + box.width + 1 &&
              folioBox.y >= box.y - 1 &&
              folioBox.y + folioBox.height <= box.y + box.height + 1),
          images: [...face.querySelectorAll("img")].map((image) => ({
            source: image.currentSrc,
            loaded: image.complete && image.naturalWidth > 0,
            naturalWidth: image.naturalWidth,
          })),
          diagramLabels: [...face.querySelectorAll(".diagram-node > span")].map(
            (label) => label.textContent.trim(),
          ),
        };
      }),
    };
  });
  const filename = `${viewport.width}x${viewport.height}-${mode}-${state}.png`;
  await page.screenshot({ path: `${output}/${filename}`, fullPage: true });
  const record = {
    ...viewport,
    mode,
    state,
    filename,
    metrics,
    errors: [...errors],
  };
  results.push(record);
  if (metrics.horizontalOverflow)
    failures.push(`${filename}: document overflow`);
  if (errors.length) failures.push(`${filename}: ${errors.join("; ")}`);
  for (const face of metrics.faces) {
    if (face.images.some((image) => !image.loaded))
      failures.push(`${filename}: unloaded image on ${face.id}`);
    if (
      viewport.width >= 768 &&
      face.inner &&
      face.inner.scrollHeight > face.inner.clientHeight + 1
    )
      failures.push(
        `${filename}: hidden vertical inner overflow on ${face.id}`,
      );
    if (viewport.width >= 768 && !face.folioInsidePage)
      failures.push(`${filename}: folio outside ${face.id}`);
  }
}

try {
  for (const [width, height] of [
    [375, 844],
    [768, 1024],
    [1280, 900],
    [1920, 1080],
    [375, 600],
    [1280, 720],
  ]) {
    if (onlyDrag) break;
    const viewport = { width, height };
    for (const mode of ["native", "reduced", "reading"]) {
      const context = await browser.newContext({
        viewport,
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      try {
        await page.goto(baseURL);
        await expect(page.locator("#book")).toHaveAttribute(
          "data-ready",
          "true",
        );
        if (mode === "reading") {
          await page
            .getByRole("button", { name: "Reading mode", exact: true })
            .click();
          await expect(page.locator(".flip-engine")).toHaveCount(0);
        }
        await settled(page, 0);
        await capture(page, viewport, mode, "cover", errors);
        await page
          .getByRole("button", { name: "Open book", exact: true })
          .click();
        await settled(page, 1);
        await capture(page, viewport, mode, "opening", errors);
        if (width < 768) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await settled(page, 2);
          await capture(page, viewport, mode, "contents", errors);
        }
        await page
          .getByRole("navigation", { name: "Portfolio chapters" })
          .getByRole("button", { name: "Vault Storage", exact: true })
          .click();
        await settled(page, 3);
        await capture(page, viewport, mode, "vault", errors);
        if (width < 768) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await settled(page, 4);
          await capture(page, viewport, mode, "architecture", errors);
        }
      } catch (error) {
        failures.push(`${width}x${height} ${mode}: ${error.message}`);
      } finally {
        await context.close();
      }
    }
  }

  // Record the native cover mid-drag, its reversed path and complete open/close.
  // Keep this continuous: separate stills cannot establish motion quality.
  const viewport = { width: 1280, height: 900 };
  const context = await browser.newContext({
    viewport,
    reducedMotion: "no-preference",
    recordVideo: { dir: `${dataOutput}/recordings`, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  page.on("pageerror", (error) => {
    dragErrors.push(error.stack ?? error.message);
    console.log(`Native drag page error: ${error.stack ?? error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") dragErrors.push(message.text());
  });
  const recordDragState = async (state) => {
    dragStates.push(
      await page.evaluate(
        (state) => ({
          state,
          book:
            document.querySelector("#book")?.outerHTML.slice(0, 1000) ?? null,
          engineCount: document.querySelectorAll(".flip-engine").length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        }),
        state,
      ),
    );
  };
  try {
    await page.goto(baseURL);
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await settled(page, 0);
    await recordDragState("initial");
    const cover = await page
      .locator(".library-slot .page--cover")
      .boundingBox();
    await page.mouse.move(cover.x + cover.width - 6, cover.y + 10);
    await page.mouse.down();
    await page.mouse.move(cover.x + cover.width * 0.5, cover.y + 70, {
      steps: 24,
    });
    await expect(page.locator("#book")).toHaveAttribute("data-turning", "true");
    await recordDragState("partial");
    await page.screenshot({
      path: `${output}/cover-partial-drag.png`,
      fullPage: true,
    });
    const engine = await page.locator(".flip-engine").boundingBox();
    await page.mouse.move(engine.x + engine.width - 3, engine.y + 3, {
      steps: 24,
    });
    await recordDragState("reversed");
    await page.screenshot({
      path: `${output}/cover-reversing.png`,
      fullPage: true,
    });
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await settled(page, 0);
    await recordDragState("cancelled");
    await page.screenshot({
      path: `${output}/cover-cancelled.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Open book", exact: true }).click();
    await settled(page, 1);
    await page.waitForTimeout(250);
    await page
      .getByRole("button", { name: "Previous page", exact: true })
      .click();
    await settled(page, 0);
    await page.waitForTimeout(250);
  } catch (error) {
    failures.push(`native cover reversal recording: ${error.message}`);
  } finally {
    if (dragErrors.length)
      failures.push(
        ...dragErrors.map((error) => `native cover drag: ${error}`),
      );
    await context.close();
    await video.saveAs(`${output}/cover-drag-reverse-open-close.webm`);
  }
} finally {
  await browser.close();
  await writeFile(
    `${dataOutput}/${onlyDrag ? "drag-geometry" : "geometry"}.json`,
    JSON.stringify(
      { baseURL, results, failures, dragErrors, dragStates },
      null,
      2,
    ),
  );
}

console.log(
  JSON.stringify(
    {
      screenshots: results.length,
      failures,
      geometry: `${dataOutput}/geometry.json`,
      output,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
