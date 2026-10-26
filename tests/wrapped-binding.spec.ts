import { test, expect } from "@playwright/test";

test("phone cover uses the full width including material depth and retains two subtitle lines", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  for (const reduced of [false, true]) {
    if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
    const cover = page.locator(
      reduced
        ? ".plain-face[aria-hidden=false] .page--cover"
        : ".library-slot .page--cover",
    );
    const bounds = (await cover.boundingBox())!;
    const geometry = await book.evaluate((element) => {
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => parseFloat(styles.getPropertyValue(name));
      return {
        scale: Number(element.dataset.presentationScale),
        stageWidth:
          document.querySelector<HTMLElement>(".book-stage")!.clientWidth,
        foreEdge: token("--material-fore-edge-depth"),
        overhang: token("--material-board-overhang"),
        gutter: token("--s4"),
        regular: token("--cover-regular-width"),
        large: token("--cover-large-width"),
      };
    });
    const expectedWidth =
      geometry.stageWidth - geometry.foreEdge - geometry.overhang * 2;
    expect(bounds.width).toBeCloseTo(expectedWidth * geometry.scale, 0);
    expect(
      bounds.x - geometry.overhang * geometry.scale,
    ).toBeGreaterThanOrEqual(geometry.gutter - 1);
    expect(
      bounds.x +
        bounds.width +
        (geometry.foreEdge + geometry.overhang) * geometry.scale,
    ).toBeLessThanOrEqual(375 - geometry.gutter + 1);
    const visibleWidth = Math.round(bounds.width);
    const preset =
      visibleWidth < geometry.regular
        ? "compact"
        : visibleWidth < geometry.large
          ? "regular"
          : "large";
    await expect(book).toHaveAttribute("data-cover-size", preset);
    await expect(cover.locator(".cover-title span")).toHaveText([
      "An engineering",
      "atlas",
    ]);
    for (const line of await cover
      .locator(".cover-title span, .cover-role, .cover-stack")
      .all()) {
      expect(
        await line.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
    }
    const title = cover.locator(".cover-title");
    expect(
      await title.evaluate(
        (el) => el.clientHeight / parseFloat(getComputedStyle(el).lineHeight),
      ),
    ).toBeCloseTo(2, 1);
    await expect(cover.getByRole("img")).toHaveCount(1);
  }
});

test("cover type follows fitted width when laptop height changes, without rebuilding pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 580 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const engine = await page.locator(".flip-engine").elementHandle();
  const presets: string[] = [];
  for (const height of [900, 580]) {
    await page.setViewportSize({ width: 1280, height });
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    const expected = await page
      .locator(".library-slot .page--cover")
      .evaluate((cover) => {
        const styles = getComputedStyle(document.documentElement);
        const token = (name: string) =>
          parseFloat(styles.getPropertyValue(name));
        const width = Math.round(cover.getBoundingClientRect().width);
        const preset =
          width < token("--cover-regular-width")
            ? "compact"
            : width < token("--cover-large-width")
              ? "regular"
              : "large";
        return {
          preset,
          size: token(
            preset === "compact"
              ? "--text-base"
              : preset === "regular"
                ? "--text-lg"
                : "--text-xl",
          ),
        };
      });
    presets.push(expected.preset);
    await expect(book).toHaveAttribute("data-cover-size", expected.preset);
    const rendered = await page
      .locator(".library-slot .cover-title")
      .evaluate(
        (el) =>
          parseFloat(getComputedStyle(el).fontSize) *
          Number(
            document.querySelector<HTMLElement>("#book")!.dataset
              .presentationScale,
          ),
      );
    expect(rendered).toBeCloseTo(expected.size, 1);
    expect(
      await engine!.evaluate(
        (el) => el === document.querySelector(".flip-engine"),
      ),
    ).toBe(true);
  }
  expect(new Set(presets).size).toBe(2);
});

test("printed binding remains attached to the native cover through reversal and cancellation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const cover = page.locator(".library-slot .page--cover");
  const strip = cover.locator(".cover-spine");
  const image = strip.locator("img");
  await expect(strip).toHaveAttribute("aria-hidden", "true");
  await expect(strip).toHaveCSS("pointer-events", "none");
  await expect(image).toHaveAttribute("alt", "");
  await expect
    .poll(() =>
      image.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      ),
    )
    .toBe(true);
  expect(await image.evaluate((el: HTMLImageElement) => el.currentSrc)).toBe(
    await cover
      .locator(".cover-art")
      .evaluate((el: HTMLImageElement) => el.currentSrc),
  );
  const canvas = await strip.locator(".cover-spine-canvas").elementHandle();
  const transform = await canvas!.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  expect(transform).not.toBe("none");
  const b = (await cover.boundingBox())!;
  await page.mouse.move(b.x + b.width - 6, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.5, b.y + 70, { steps: 16 });
  await expect(book).toHaveAttribute("data-turning", "true");
  expect(
    await canvas!.evaluate(
      (el) =>
        el.closest(".page--cover") ===
        document.querySelector(".library-slot .page--cover"),
    ),
  ).toBe(true);
  expect(await canvas!.evaluate((el) => getComputedStyle(el).transform)).toBe(
    transform,
  );
  const moving = (await page.locator(".flip-engine").boundingBox())!;
  await page.mouse.move(moving.x + moving.width - 3, moving.y + 3, {
    steps: 16,
  });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    await canvas!.evaluate(
      (el) =>
        el === document.querySelector(".library-slot .cover-spine-canvas"),
    ),
  ).toBe(true);
});
