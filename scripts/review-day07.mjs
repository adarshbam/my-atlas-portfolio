import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { pages } from "../src/data/portfolio.ts";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
import { output } from "./day07-common.mjs";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const records = [];
const errors = [];
async function settled(page, index) {
  await expect(page.locator("#book")).toHaveAttribute(
    "data-current-page",
    String(index),
  );
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
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
    if (process.env.DAY07_WIDTH && width !== Number(process.env.DAY07_WIDTH))
      continue;
    for (const mode of ["native", "reduced", "reading"]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      page.on("pageerror", (error) =>
        errors.push({ width, height, mode, message: error.message }),
      );
      page.on("console", (message) => {
        if (message.type() === "error")
          errors.push({ width, height, mode, message: message.text() });
      });
      await page.goto(baseURL);
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      await page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .getByRole("button", { name: "Cover", exact: true })
        .click();
      await settled(page, 0);
      const targets = pages
        .map((_, index) => index)
        .filter(
          (index) =>
            mode === "reading" || width < 768 || index === 0 || index % 2 === 1,
        );
      for (let i = 0; i < targets.length; i++) {
        if (i) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await settled(page, targets[i]);
        }
        const selector =
          mode === "native"
            ? ".library-slot .book-page[aria-hidden=false]"
            : mode === "reading"
              ? `.reading-document [data-page="${targets[i]}"]`
              : ".plain-face[aria-hidden=false] .book-page";
        const faces = page.locator(selector);
        if (mode === "reduced") {
          for (const face of await page
            .locator(".plain-face[aria-hidden=false]")
            .all()) {
            await expect(face).toHaveCSS("opacity", "1");
          }
        }
        await faces.evaluateAll(async (elements) => {
          await Promise.all(
            elements
              .flatMap((element) => element.getAnimations({ subtree: true }))
              .filter((animation) =>
                Number.isFinite(animation.effect.getTiming().iterations),
              )
              .map((animation) => animation.finished.catch(() => {})),
          );
        });
        // Real images may load only after their native sheet becomes visible.
        for (const img of await faces.locator("img").all()) {
          await img.scrollIntoViewIfNeeded();
          await expect(img).toHaveJSProperty("complete", true);
          await expect
            .poll(() => img.evaluate((el) => el.naturalWidth))
            .toBeGreaterThan(0);
        }
        await faces.locator(".page-inner").evaluateAll((elements) =>
          elements.forEach((el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
          }),
        );
        const data = await faces.evaluateAll((faces) =>
          faces.map((face) => {
            const inner = face.querySelector(".page-inner");
            const bounds = face.getBoundingClientRect();
            const folio =
              face.querySelector(".folio")?.getBoundingClientRect() ?? bounds;
            const last =
              face
                .querySelector(".page-content")
                ?.lastElementChild?.getBoundingClientRect() ?? bounds;
            return {
              id: face.dataset.pageId,
              width: bounds.width,
              height: bounds.height,
              innerHeight: inner.clientHeight,
              innerScrollHeight: inner.scrollHeight,
              contained: inner.scrollHeight <= inner.clientHeight + 1,
              contentBeforeFolio:
                !face.querySelector(".folio") || last.bottom <= folio.top + 1,
              contentBottom: last.bottom,
              folioTop: folio.top,
              folioInside: folio.bottom <= bounds.bottom + 1,
              images: [...face.querySelectorAll("img")].map((img) => ({
                source: img.currentSrc,
                loaded: img.complete && img.naturalWidth > 0,
                width: img.clientWidth,
                height: img.clientHeight,
              })),
            };
          }),
        );
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        const filename = `${output}/${width}x${height}-${mode}-${targets[i]}.jpg`;
        await (mode === "reading" ? faces.first() : page).screenshot({
          path: filename,
          ...(mode === "reading" ? {} : { fullPage: true }),
          type: "jpeg",
          quality: 85,
        });
        records.push({
          width,
          height,
          mode,
          index: targets[i],
          overflow,
          faces: data,
          capture: filename,
        });
        if (mode === "reading") {
          // Locator screenshots may center a whole section. Restore the actual
          // reading line before exercising the next-section control.
          await faces.evaluateAll((elements) =>
            elements[0]
              .closest("[data-reading-page]")
              .scrollIntoView({ block: "start", behavior: "auto" }),
          );
          await settled(page, targets[i]);
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(
    `${output}/geometry.json`,
    JSON.stringify({ browser: browser.version(), records, errors }, null, 2) + "\n",
  );
}
const failures = records.filter(
  (record) =>
    record.overflow ||
    record.faces.some((face) => !face.contentBeforeFolio) ||
    (record.width >= 768 &&
      record.faces.some((face) => !face.contained || !face.folioInside)),
);
console.log(
  JSON.stringify({ states: records.length, errors, failures }, null, 2),
);
const expected = records.length > 0 && records.every((r) => r.faces.length > 0) && pages.every((p) => records.some((r) => r.faces.some((f) => f.id === p.id)));
if (!expected || failures.length || errors.length) process.exitCode = 1;
