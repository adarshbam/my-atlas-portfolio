import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { pages } from "../src/data/portfolio.ts";
import { output, baseURL, json } from "./day07-common.mjs";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [],
  coverage = [];
const luminance = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
try {
  for (const width of [375, 768, 1280, 1920])
    for (const mode of ["native", "reduced", "reading"]) {
      if (process.env.DAY07_WIDTH && width !== Number(process.env.DAY07_WIDTH))
        continue;
      const context = await browser.newContext({
        viewport: { width, height: 1200 },
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.goto(baseURL);
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      const targets = pages
        .map((_, i) => i)
        .filter(
          (i) => mode === "reading" || width < 768 || i === 0 || i % 2 === 1,
        );
      for (const index of targets) {
        if (index)
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
        await expect(page.locator("#book")).toHaveAttribute(
          "data-current-page",
          String(index),
        );
        await expect(page.locator("#book")).toHaveAttribute(
          "data-turning",
          "false",
        );
        const selector =
          mode === "reading"
            ? `.reading-document [data-page="${index}"]`
            : mode === "native"
              ? ".library-slot .book-page[aria-hidden=false]"
              : ".plain-face[aria-hidden=false] .book-page";
        const faces = page.locator(selector);
        if (mode === "reduced")
          for (const face of await page
            .locator(".plain-face[aria-hidden=false]")
            .all())
            await expect(face).toHaveCSS("opacity", "1");
        await faces.evaluateAll(async (elements) => {
          await Promise.all(
            elements
              .flatMap((el) => el.getAnimations({ subtree: true }))
              .filter((a) => Number.isFinite(a.effect.getTiming().iterations))
              .map((a) => a.finished.catch(() => {})),
          );
        });
        const ids = await faces.evaluateAll((els) =>
          els.map((el) => el.dataset.pageId),
        );
        const before = results.length;
        for (const position of width < 768 || mode === "reading"
          ? ["top", "bottom"]
          : ["top"]) {
          if (mode === "reading")
            await faces.evaluateAll(
              (els, p) =>
                els[0].closest("[data-reading-page]").scrollIntoView({
                  block: p === "top" ? "start" : "end",
                  behavior: "instant",
                }),
              position,
            );
          else
            await faces.locator(".page-inner").evaluateAll(
              (els, p) =>
                els.forEach((el) => {
                  el.scrollTop = p === "bottom" ? el.scrollHeight : 0;
                  el.scrollLeft = 0;
                }),
              position,
            );
          const boxes = await faces.evaluateAll((faces) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const targets = faces.flatMap((face) => [
              ...face.querySelectorAll(
                "h2,h3,p,dt,dd,figcaption,a,button,.running-head span,.folio span,.diagram-node > span,.diagram-node small,.diagram-route-label,blockquote",
              ),
            ]);
            const seen = new WeakSet();
            const textParents = new Set();
            const records = [];
            for (const element of targets) {
              const face = element
                .closest(".book-page")
                .getBoundingClientRect();
              const clip =
                element.closest(".diagram-scroll")?.getBoundingClientRect() ??
                face;
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
              );
              while (walker.nextNode()) {
                if (seen.has(walker.currentNode)) continue;
                seen.add(walker.currentNode);
                const text = walker.currentNode.textContent.trim();
                if (!text) continue;
                const style = getComputedStyle(
                  walker.currentNode.parentElement,
                );
                textParents.add(walker.currentNode.parentElement);
                ctx.clearRect(0, 0, 1, 1);
                ctx.fillStyle = style.color;
                ctx.fillRect(0, 0, 1, 1);
                const color = [...ctx.getImageData(0, 0, 1, 1).data].slice(
                  0,
                  3,
                );
                const range = document.createRange();
                range.selectNodeContents(walker.currentNode);
                for (const r of range.getClientRects())
                  if (
                    r.left >= Math.max(0, face.left, clip.left) &&
                    r.right <= Math.min(innerWidth, face.right, clip.right) &&
                    r.top >= Math.max(0, face.top) &&
                    r.bottom <= Math.min(innerHeight, face.bottom)
                  )
                    records.push({
                      text,
                      x: r.x,
                      y: r.y,
                      width: r.width,
                      height: r.height,
                      color,
                      size: parseFloat(style.fontSize),
                      id: element.closest(".book-page").dataset.pageId,
                    });
              }
            }
            window.__day07Hidden = [...textParents].map((element) => ({
              element,
              fill: element.style.getPropertyValue("-webkit-text-fill-color"),
              priority: element.style.getPropertyPriority(
                "-webkit-text-fill-color",
              ),
            }));
            for (const element of textParents)
              element.style.setProperty(
                "-webkit-text-fill-color",
                "transparent",
                "important",
              );
            return records;
          });
          // Suppress glyph fill without hiding focused/ancestor containers.
          // Settle the composited paint before each paired capture.
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          const hidden = await page.screenshot();
          await page.evaluate(() => {
            for (const item of window.__day07Hidden) {
              if (item.fill)
                item.element.style.setProperty(
                  "-webkit-text-fill-color",
                  item.fill,
                  item.priority,
                );
              else item.element.style.removeProperty("-webkit-text-fill-color");
            }
            delete window.__day07Hidden;
          });
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          const visible = await page.screenshot();
          if (
            width === 375 &&
            ((mode === "reduced" && index === 0 && position === "top") ||
              (mode === "native" && index === 2 && position === "bottom"))
          ) {
            const name = `contrast-${width}-${mode}-${index}-${position}`;
            await writeFile(`${output}/${name}-hidden.png`, hidden);
            await writeFile(`${output}/${name}-visible.png`, visible);
            await json(`${name}-boxes`, boxes);
          }
          const bg = await sharp(hidden)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          const fg = await sharp(visible)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          for (const box of boxes) {
            let worst = Infinity;
            const ink = luminance(box.color);
            for (
              let y = Math.max(0, Math.ceil(box.y));
              y < Math.min(bg.info.height, Math.floor(box.y + box.height));
              y++
            )
              for (
                let x = Math.max(0, Math.ceil(box.x));
                x < Math.min(bg.info.width, Math.floor(box.x + box.width));
                x++
              ) {
                const offset = (y * bg.info.width + x) * bg.info.channels;
                if (
                  Math.max(
                    ...[0, 1, 2].map((c) =>
                      Math.abs(fg.data[offset + c] - bg.data[offset + c]),
                    ),
                  ) <= 16
                )
                  continue;
                const paper = luminance([
                  ...bg.data.subarray(offset, offset + 3),
                ]);
                worst = Math.min(
                  worst,
                  (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05),
                );
              }
            if (Number.isFinite(worst))
              results.push({
                width,
                mode,
                index,
                position,
                id: box.id,
                text: box.text,
                ratio: Number(worst.toFixed(2)),
                required: box.size >= 24 ? 3 : 4.5,
              });
          }
        }
        coverage.push({
          width,
          mode,
          index,
          ids,
          samples: results.length - before,
        });
        if (mode === "reading") {
          await faces.evaluateAll((els) =>
            els[0]
              .closest("[data-reading-page]")
              .scrollIntoView({ block: "start", behavior: "instant" }),
          );
          await expect(page.locator("#book")).toHaveAttribute(
            "data-current-page",
            String(index),
          );
        }
      }
      await context.close();
    }
} finally {
  await browser.close();
  await json("contrast", { results, coverage });
}
const failures = results.filter((r) => r.ratio < r.required);
const complete = [375, 768, 1280, 1920]
  .filter(
    (w) => !process.env.DAY07_WIDTH || w === Number(process.env.DAY07_WIDTH),
  )
  .every((w) =>
    ["native", "reduced", "reading"].every((mode) =>
      pages.every((p) =>
        results.some((r) => r.width === w && r.mode === mode && r.id === p.id),
      ),
    ),
  );
const summary = {
  samples: results.length,
  minimum: Math.min(...results.map((r) => r.ratio)),
  completePageModeCoverage: complete,
  failures,
};
await json("contrast-summary", summary);
console.log(
  JSON.stringify(
    {
      ...summary,
      failureCount: failures.length,
      failures: failures.slice(0, 12),
    },
    null,
    2,
  ),
);
if (!complete || failures.length) process.exitCode = 1;
