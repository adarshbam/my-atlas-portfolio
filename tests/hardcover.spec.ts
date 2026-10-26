import { test, expect } from "@playwright/test";

for (const [width, height] of [
  [375, 844],
  [768, 1024],
  [1280, 720],
  [1920, 1080],
]) {
  for (const motion of ["no-preference", "reduce"] as const) {
    test(`${width}x${height} ${motion}: hardcover fits, centers and has usable opening target`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto("/");
      const book = page.locator("#book");
      await expect(book).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      const cover = page.locator(
        motion === "reduce"
          ? ".plain-face[aria-hidden=false] [data-page-id=cover]"
          : ".library-slot [data-page-id=cover]",
      );
      await expect
        .poll(() =>
          book.locator(":scope > .binding").evaluate((el) => {
            const board = el.getBoundingClientRect();
            return Math.abs(board.x + board.width / 2 - innerWidth / 2);
          }),
        )
        .toBeLessThan(2);
      const b = (await cover.boundingBox())!;
      const target = await page
        .getByRole("button", { name: "Open book", exact: true })
        .boundingBox();
      const geometry = await book.evaluate((el) => ({
        scale: Number(el.dataset.presentationScale),
        foreEdge: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--material-fore-edge-depth",
          ),
        ),
        bottomDepth: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--material-bottom-depth",
          ),
        ),
        overhang: parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--material-board-overhang",
          ),
        ),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      const board = (await book.locator(":scope > .binding").boundingBox())!;
      expect([
        geometry.foreEdge,
        geometry.bottomDepth,
        geometry.overhang,
      ]).toEqual([16, 12, 8]);
      expect(Math.abs(board.x + board.width / 2 - width / 2)).toBeLessThan(2);
      expect(board.width).toBeCloseTo(
        b.width + (geometry.foreEdge + geometry.overhang * 2) * geometry.scale,
        0,
      );
      expect(board.y).toBeGreaterThanOrEqual(0);
      expect(board.y + board.height).toBeLessThanOrEqual(height + 1);
      expect(target!.height).toBeGreaterThanOrEqual(44);
      expect(target!.width).toBeGreaterThanOrEqual(44);
      expect(geometry.overflow).toBe(false);
      const artwork = cover.locator(".cover-art");
      await expect(artwork).toHaveAttribute("alt", /unfinished charcoal/);
      expect(
        await artwork.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Open book", exact: true })
        .click();
      await expect(book).toHaveAttribute("data-current-page", "1");
      await expect(book).toHaveAttribute("data-turning", "false");
      await expect(book).toHaveAttribute("data-presentation-scale", "1");
      if (motion === "no-preference") {
        await book.evaluate(
          (el) =>
            ((window as any).coverEngine = el.querySelector(".flip-engine")),
        );
        await page
          .getByRole("button", { name: "Previous page", exact: true })
          .click();
        await expect(book).toHaveAttribute("data-current-page", "0");
        await expect(book).toHaveAttribute("data-turning", "false");
        expect(
          await book.evaluate(
            (el) =>
              el.querySelector(".flip-engine") === (window as any).coverEngine,
          ),
        ).toBe(true);
        expect(
          Number(await book.getAttribute("data-presentation-scale")),
        ).toBeCloseTo(geometry.scale, 3);
        expect(
          await book.evaluate((el) => getComputedStyle(el).willChange),
        ).toBe("auto");
      }
    });
  }
}

test("native cover drag grows with progress, reverses, cancels and commits without changing engines", async ({
  page,
}) => {
  // The proportional desktop pages already fit at taller sizes. A short
  // viewport exercises the approved fit-closed / grow-open presentation.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const initialScale = Number(
    await book.getAttribute("data-presentation-scale"),
  );
  await book.evaluate(
    (el) => ((window as any).coverEngine = el.querySelector(".flip-engine")),
  );
  const cover = (await page
    .locator(".library-slot [data-page-id=cover]")
    .boundingBox())!;
  await page.mouse.move(cover.x + cover.width - 6, cover.y + cover.height - 12);
  await page.mouse.down();
  await page.mouse.move(
    cover.x + cover.width * 0.5,
    cover.y + cover.height - 70,
    { steps: 12 },
  );
  await expect(book).toHaveAttribute("data-turning", "true");
  const partial = Number(await book.getAttribute("data-presentation-scale"));
  expect(partial).toBeGreaterThan(initialScale);
  expect(partial).toBeLessThan(1);
  await expect(page.locator(".book-block--left")).toHaveCSS("opacity", "0");
  const root = (await page.locator(".flip-engine").boundingBox())!;
  await page.mouse.move(root.x + root.width - 3, root.y + root.height - 3, {
    steps: 16,
  });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    Number(await book.getAttribute("data-presentation-scale")),
  ).toBeCloseTo(initialScale, 3);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  // Closing the native hardcover also shrinks the entire presentation.
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    await book.evaluate(
      (el) => el.querySelector(".flip-engine") === (window as any).coverEngine,
    ),
  ).toBe(true);
});

test("scaled middle-edge tap opens once and short-window resizing preserves a settled state", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const b = (await page
    .locator(".library-slot [data-page-id=cover]")
    .boundingBox())!;
  await page.touchscreen.tap(b.x + b.width - 8, b.y + b.height / 2);
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  await page.waitForTimeout(850);
  await expect(book).toHaveAttribute("data-current-page", "1");
  await page.setViewportSize({ width: 768, height: 768 });
  await expect(book).toHaveAttribute("data-ready", "true");
  await expect(book).toHaveAttribute("data-presentation-scale", "1");
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Cover", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("native cover drag commits and reverse closing drag can cancel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  let b = (await page
    .locator(".library-slot [data-page-id=cover]")
    .boundingBox())!;
  await page.mouse.move(b.x + b.width - 6, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(80, b.y + 70, { steps: 24 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(Number(await book.getAttribute("data-presentation-scale"))).toBe(1);
  b = (await book.boundingBox())!;
  await page.mouse.move(b.x + 6, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.4, b.y + 80, { steps: 16 });
  await expect(book).toHaveAttribute("data-turning", "true");
  expect(
    Number(await book.getAttribute("data-presentation-scale")),
  ).toBeLessThan(1);
  const moving = (await page.locator(".flip-engine").boundingBox())!;
  await page.mouse.move(moving.x + 3, moving.y + 3, { steps: 16 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(Number(await book.getAttribute("data-presentation-scale"))).toBe(1);
});

test("resize and repeated navigation during cover opening leave a usable engine", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(book).toHaveAttribute("data-turning", "false");
  await expect(book).toHaveAttribute("data-presentation-scale", "1");
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  await page.evaluate(() => {
    const next = document.querySelector<HTMLButtonElement>(
      '[aria-label="Next page"]',
    )!;
    next.click();
    next.click();
    next.click();
  });
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  await expect(page.locator(".flip-engine")).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(book).toHaveAttribute("data-current-page", "3");
  await expect(book).toHaveAttribute("data-turning", "false");
});

test("short enlarged-layout viewport scrolls to the opening action without clipping text or controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 450 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const open = page.getByRole("button", { name: "Open book", exact: true });
  await open.scrollIntoViewIfNeeded();
  const rect = (await open.boundingBox())!;
  expect(rect.height).toBeGreaterThanOrEqual(44);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight > innerHeight,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".plain-face[aria-hidden=false] .cover-inner")
      .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true);
  await open.click();
  await expect(book).toHaveAttribute("data-current-page", "1");
});
