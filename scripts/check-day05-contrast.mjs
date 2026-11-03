import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const luminance = (rgb) =>
  rgb
    .map((value) => {
      value /= 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
try {
  for (const width of [375, 768, 1280, 1920]) {
    if (process.env.DAY05_WIDTH && width !== Number(process.env.DAY05_WIDTH))
      continue;
    const page = await browser.newPage({ viewport: { width, height: 1200 } });
    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => document.fonts.ready);
    await page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "Vault Storage", exact: true })
      .click();
    for (const index of width < 768
      ? [3, 4, 5, 6, 7, 8, 9, 10]
      : [3, 5, 7, 9]) {
      if (index > 3)
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
      for (const position of width < 768 ? ["top", "bottom"] : ["top"]) {
        await page
          .locator(".library-slot .page--case[aria-hidden=false] .page-inner")
          .evaluateAll(
            (elements, position) =>
              elements.forEach((element) => {
                element.scrollTop =
                  position === "bottom" ? element.scrollHeight : 0;
              }),
            position,
          );
        const boxes = await page.evaluate(() => {
          const targets = [
            ...document.querySelectorAll(
              ".library-slot .page--case[aria-hidden=false]",
            ),
          ].flatMap((face) => [
            ...face.querySelectorAll(
              "h2,h3,p,dt,dd,figcaption,.text-link,.diagram-node > span,.diagram-node small,.diagram-route-label,.running-head span,.folio span",
            ),
          ]);
          const boxes = [];
          window.__vaultContrastHidden = targets.map((element) => ({
            element,
            visibility: element.style.visibility,
          }));
          for (const element of targets) {
            const face = element.closest(".book-page").getBoundingClientRect();
            const clip =
              element.closest(".diagram-scroll")?.getBoundingClientRect() ??
              face;
            const style = getComputedStyle(element);
            const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
            );
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(walker.currentNode);
              for (const rect of range.getClientRects())
                if (
                  rect.left >= Math.max(face.left, clip.left) &&
                  rect.right <= Math.min(face.right, clip.right) &&
                  rect.top >= face.top &&
                  rect.bottom <= face.bottom
                )
                  boxes.push({
                    text: walker.currentNode.textContent.trim(),
                    x: rect.x + scrollX,
                    y: rect.y + scrollY,
                    width: rect.width,
                    height: rect.height,
                    color: style.color
                      .match(/[\d.]+/g)
                      .slice(0, 3)
                      .map(Number),
                    size: parseFloat(style.fontSize),
                  });
            }
            element.style.visibility = "hidden";
          }
          return boxes;
        });
        const backgroundCapture = await page.screenshot({ fullPage: true });
        if (width === 375 && index === 10 && position === "bottom") {
          await writeFile(
            "docs/review/day05/contrast-contact-background.png",
            backgroundCapture,
          );
          await writeFile(
            "docs/review/day05/contrast-contact-boxes.json",
            JSON.stringify(boxes, null, 2),
          );
        }
        const { data, info } = await sharp(backgroundCapture)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        await page.evaluate(() => {
          for (const { element, visibility } of window.__vaultContrastHidden)
            element.style.visibility = visibility;
          delete window.__vaultContrastHidden;
        });
        const visibleCapture = await page.screenshot({ fullPage: true });
        const visiblePixels = await sharp(visibleCapture)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        if (
          visiblePixels.info.width !== info.width ||
          visiblePixels.info.height !== info.height
        )
          throw new Error("Contrast captures changed geometry");
        if (width === 375 && index === 10 && position === "bottom")
          await writeFile(
            "docs/review/day05/contrast-contact-visible.png",
            visibleCapture,
          );
        for (const box of boxes) {
          const foreground = luminance(box.color);
          let worst = Infinity;
          for (
            let y = Math.max(0, Math.ceil(box.y));
            y < Math.min(info.height, Math.floor(box.y + box.height));
            y++
          )
            for (
              let x = Math.max(0, Math.ceil(box.x));
              x < Math.min(info.width, Math.floor(box.x + box.width));
              x++
            ) {
              const offset = (y * info.width + x) * info.channels;
              // A text range includes empty ascender/line-box space. At a
              // scrolled sheet edge that space may cover the board outside
              // the paper mask. Sample only pixels actually painted by text,
              // identified by the visible-versus-hidden capture difference.
              if (
                Math.max(
                  ...[0, 1, 2].map((channel) =>
                    Math.abs(
                      visiblePixels.data[offset + channel] -
                        data[offset + channel],
                    ),
                  ),
                ) <= 16
              )
                continue;
              const background = luminance([
                ...data.subarray(offset, offset + 3),
              ]);
              worst = Math.min(
                worst,
                (Math.max(foreground, background) + 0.05) /
                  (Math.min(foreground, background) + 0.05),
              );
            }
          if (Number.isFinite(worst))
            results.push({
              width,
              index,
              position,
              text: box.text,
              ratio: Number(worst.toFixed(2)),
              required: box.size >= 24 ? 3 : 4.5,
            });
        }
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  "docs/review/day05/case-contrast.json",
  JSON.stringify(results, null, 2) + "\n",
);
const failures = results.filter((result) => result.ratio < result.required);
console.log(
  JSON.stringify(
    {
      samples: results.length,
      minimum: Math.min(...results.map((result) => result.ratio)),
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
