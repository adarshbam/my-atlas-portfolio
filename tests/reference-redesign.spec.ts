import { expect, test, type Page } from "@playwright/test";
import { pages } from "../src/data/portfolio";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
}

for (const width of [1280, 1920]) {
  test(`${width}px: the native opening retains the reference page proportions`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1080 });
    await open(page);
    const faces = page.locator('.library-slot .book-page[aria-hidden="false"]');
    await expect(faces).toHaveCount(2);
    for (const face of await faces.all()) {
      const bounds = (await face.boundingBox())!;
      expect(Math.abs(bounds.width / bounds.height - 0.88)).toBeLessThan(0.003);
    }
  });
}

test("the opening architecture drawing connects live selectable labels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const figure = page.locator(".library-slot .page--contents .system-diagram");
  const labels = figure.locator(".diagram-node > span");
  expect(await labels.count()).toBeGreaterThanOrEqual(4);
  await expect(figure.locator("svg text")).toHaveCount(0);
  await expect(figure.locator(".diagram-geometry .diagram-route")).toHaveCount(
    6,
  );
  const selection = await labels.first().evaluate((label) => {
    const range = document.createRange();
    range.selectNodeContents(label);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    return {
      text: label.textContent!.trim(),
      selected: selection.toString().trim(),
      svg: label.namespaceURI?.includes("svg") ?? false,
      userSelect: getComputedStyle(label).userSelect,
    };
  });
  expect(selection.svg).toBe(false);
  expect(selection.userSelect).not.toBe("none");
  expect(selection.selected).toBe(selection.text);
  expect(selection.selected.length).toBeGreaterThan(1);
});

for (const reduced of [false, true]) {
  test(`768px ${reduced ? "reduced" : "native"}: readable tablet spreads contain their content and folios`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    await open(page);
    const visible = reduced
      ? '.plain-face[aria-hidden="false"] .book-page'
      : '.library-slot .book-page[aria-hidden="false"]';
    for (const index of pages
      .map((_, index) => index)
      .filter((index) => index % 2 === 1)) {
      if (index > 1) {
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
      }
      const faces = page.locator(visible);
      await expect(faces).toHaveCount(2);
      const heights: number[] = [];
      for (const face of await faces.all()) {
        const bounds = (await face.boundingBox())!;
        heights.push(bounds.height);
        const inner = face.locator(".page-inner");
        expect(
          await inner.evaluate(
            (element) => element.scrollHeight <= element.clientHeight + 1,
          ),
        ).toBe(true);
        const folio = (await face.locator(".folio").boundingBox())!;
        expect(folio.y + folio.height).toBeLessThanOrEqual(
          bounds.y + bounds.height + 1,
        );
        expect(folio.x).toBeGreaterThanOrEqual(bounds.x);
        expect(folio.x + folio.width).toBeLessThanOrEqual(
          bounds.x + bounds.width + 1,
        );
      }
      expect(Math.abs(heights[0] - heights[1])).toBeLessThan(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}

test("an already open book retains its boards and current page when resized", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  for (const [width, height] of [
    [1920, 1080],
    [768, 1024],
    [375, 600],
    [1280, 720],
  ]) {
    await page.setViewportSize({ width, height });
    const book = page.locator("#book");
    await expect(book).toHaveAttribute("data-ready", "true");
    await expect(book).toHaveAttribute("data-current-page", "1");
    await expect(book).toHaveAttribute("data-turning", "false");
    await expect(page.locator(".flip-engine")).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const stage = document
            .querySelector(".book-stage")!
            .getBoundingClientRect();
          const board = document
            .querySelector("#book > .binding")!
            .getBoundingClientRect();
          return (
            board.width > 0 &&
            board.height > 0 &&
            board.left >= stage.left - 1 &&
            board.right <= stage.right + 1 &&
            board.top >= stage.top - 1 &&
            board.bottom <= stage.bottom + 1
          );
        }),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("[inert]")),
    ).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("a transient collapsed viewport preserves a partial cover drag and permits cancellation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  const engine = await page.locator(".flip-engine").elementHandle();
  const cover = (await page
    .locator(".library-slot .page--cover")
    .boundingBox())!;
  await page.mouse.move(cover.x + cover.width - 6, cover.y + 10);
  await page.mouse.down();
  await page.mouse.move(cover.x + cover.width * 0.5, cover.y + 70, {
    steps: 16,
  });
  await expect(book).toHaveAttribute("data-turning", "true");
  const geometry = await book.evaluate((element) => ({
    width: element.style.getPropertyValue("--page-width"),
    height: element.style.getPropertyValue("--page-height"),
  }));
  for (const viewport of [
    { width: 1, height: 1 },
    { width: 1280, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".flip-engine")).toHaveCount(1);
    expect(
      await engine!.evaluate(
        (element) => element === document.querySelector(".flip-engine"),
      ),
    ).toBe(true);
    expect(
      await book.evaluate((element) => ({
        width: element.style.getPropertyValue("--page-width"),
        height: element.style.getPropertyValue("--page-height"),
      })),
    ).toEqual(geometry);
    expect(
      await book.evaluate(
        (element) =>
          Number.isFinite(Number(element.dataset.presentationScale)) &&
          Number(element.dataset.presentationScale) > 0,
      ),
    ).toBe(true);
  }
  await expect(book).toHaveAttribute("data-turning", "true");
  // Full-page capture can itself emit a transient collapsed viewport in Chromium.
  await page.screenshot({ fullPage: true });
  expect(
    await engine!.evaluate(
      (element) => element === document.querySelector(".flip-engine"),
    ),
  ).toBe(true);
  const moving = (await page.locator(".flip-engine").boundingBox())!;
  await page.mouse.move(moving.x + moving.width - 3, moving.y + 3, {
    steps: 16,
  });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(book).toHaveAttribute("data-current-page", "0");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    await engine!.evaluate(
      (element) => element === document.querySelector(".flip-engine"),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
