import { test, expect, type Page } from "@playwright/test";

async function duration(page: Page, selector: string, target: number) {
  return page.evaluate(
    async ({ selector, target }) => {
      const book = document.querySelector<HTMLElement>("#book")!;
      const start = performance.now();
      (document.querySelector(selector) as HTMLButtonElement).click();
      await new Promise<void>((resolve) => {
        const tick = () => {
          if (
            book.dataset.currentPage === String(target) &&
            book.dataset.turning === "false"
          )
            resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return performance.now() - start;
    },
    { selector, target },
  );
}

for (const width of [375, 768, 1280, 1920]) {
  for (const reduced of [false, true]) {
    test(`${width}px ${reduced ? "reduced" : "native"}: portrait left, copy right, mobile cover proportions`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 375 ? 844 : 1080 });
      await page.emulateMedia({
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      await page.goto("/");
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      const cover = page.locator(
        reduced
          ? ".plain-face[aria-hidden=false] .page--cover"
          : ".library-slot .page--cover",
      );
      if (reduced)
        await expect(page.locator(".plain-face[aria-hidden=false]")).toHaveCSS(
          "opacity",
          "1",
        );
      // Font settlement schedules presentation measurements on the next frame.
      // Compare all rectangles in one observation, never cached old page bounds
      // against children sampled after a subsequent layout update.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const { bounds, portrait, kicker, copy, children } = await cover.evaluate(
        (element) => ({
          bounds: element.getBoundingClientRect().toJSON(),
          portrait: element
            .querySelector(".cover-art")!
            .getBoundingClientRect()
            .toJSON(),
          kicker: element
            .querySelector(".cover-kicker")!
            .getBoundingClientRect()
            .toJSON(),
          copy: element
            .querySelector(".cover-copy")!
            .getBoundingClientRect()
            .toJSON(),
          children: Array.from(element.querySelectorAll(".cover-copy > *")).map(
            (child) => child.getBoundingClientRect().toJSON(),
          ),
        }),
      );
      // The transparent canvas extends behind the copy; the illustration is
      // composed at its left. Contain preserves the complete, uncropped head.
      await expect(cover.locator(".cover-art")).toHaveCSS(
        "object-fit",
        "contain",
      );
      expect(portrait.x).toBeLessThan(copy.x);
      expect(portrait.x + portrait.width).toBeLessThanOrEqual(
        bounds.x + bounds.width + 1,
      );
      expect(kicker.x).toBeLessThan(copy.x);
      expect(kicker.y).toBeLessThan(copy.y + 1);
      for (const b of children) {
        expect(b.x).toBeGreaterThanOrEqual(copy.x - 1);
        expect(b.x + b.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
        expect(b.y + b.height).toBeLessThanOrEqual(
          bounds.y + bounds.height + 1,
        );
      }
      if (width === 375) {
        expect(bounds.width / bounds.height).toBeGreaterThan(0.65);
        expect(bounds.width / bounds.height).toBeLessThan(0.72);
      }
    });
  }
}

test("cover opening and closing take longer than an interior turn", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  const opening = await duration(page, ".library-slot .cover-open", 1);
  const interior = await duration(page, '[aria-label="Next page"]', 3);
  await duration(page, '[aria-label="Previous page"]', 1);
  const closing = await duration(page, '[aria-label="Previous page"]', 0);
  expect(opening).toBeGreaterThan(1000);
  expect(closing).toBeGreaterThan(1000);
  expect(opening - interior).toBeGreaterThan(200);
  expect(closing - interior).toBeGreaterThan(200);
});
