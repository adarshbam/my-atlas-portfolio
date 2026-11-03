import { test, expect } from "@playwright/test";
import { goToChapter, openContents } from "./helpers/book";

test("the opening uses compact original fonts without downloading unsupported glyph fallbacks", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", request => {
    if (request.url().endsWith(".woff2")) fonts.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  expect(fonts.some(url => url.endsWith("cormorant-garamond-portfolio-500.woff2"))).toBe(true);
  expect(fonts.some(url => url.endsWith("eb-garamond-portfolio-400.woff2"))).toBe(true);
  expect(fonts.some(url => url.endsWith("eb-garamond-latin-400-normal.woff2"))).toBe(false);
  expect(fonts.some(url => url.endsWith("cormorant-garamond-latin-500-normal.woff2"))).toBe(false);
});

test("direct story visits retain their fonts without eagerly fetching the book", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/story");
  await expect(page.locator(".observatory")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(requests.some(url => /book-slider-.*\.js/.test(url))).toBe(false);
  expect(requests.some(url => url.endsWith("eb-garamond-latin-600.woff2"))).toBe(true);
});

test("Light is the default; a saved Dark choice is restored before first paint", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("atlas-theme-v1")),
  ).toBe("dark");
  await page.addInitScript(() => {
    requestAnimationFrame(
      () =>
        ((window as any).firstTheme = document.documentElement.dataset.theme),
    );
  });
  await page.reload();
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  expect(await page.evaluate(() => (window as any).firstTheme)).toBe("dark");
  await expect(
    page.getByRole("button", { name: "Dark", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("invalid saved values fall back to Light", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("atlas-theme-v1", "invalid"),
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("blocked storage retains a usable theme selector", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("theme change during a native turn preserves the engine, destination and focus", async ({
  page,
}) => {
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await book.evaluate(
    (el) => ((window as any).savedEngine = el.querySelector(".flip-engine")),
  );
  const height = await page
    .locator(".book-stage")
    .evaluate((el) => el.getBoundingClientRect().height);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(book).toHaveAttribute("data-turning", "true");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(book).toHaveAttribute("data-current-page", "1");
  await expect(book).toHaveAttribute("data-turning", "false");
  expect(
    await book.evaluate(
      (el) => el.querySelector(".flip-engine") === (window as any).savedEngine,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".book-stage")
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBe(height);
  await expect(
    page.getByRole("button", { name: "Dark", exact: true }),
  ).toBeFocused();
});

for (const width of [375, 768, 1440, 1920]) {
  test(`${width}: cover copy does not collide and opening stays readable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1080 });
    await page.goto("/");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => document.fonts.ready);
    const collisions = await page
      .locator('.library-slot [data-page-id="cover"]')
      .evaluate((el) => {
        const parts = [
          ".running-head",
          ".portrait-cover-copy",
          ".portrait-cover-note",
          ".portrait-cover-footer",
        ].map((s) => el.querySelector(s)!.getBoundingClientRect());
        return parts.flatMap((a, i) =>
          parts
            .slice(i + 1)
            .filter(
              (b) =>
                Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 &&
                Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1,
            )
            .map(() => i),
        );
      });
    expect(collisions).toEqual([]);
    await openContents(page);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Contents", exact: true }),
    ).toBeFocused();
    await expect(page.locator("#atlas-contents")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("reading location and theme survive the night story roundtrip", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await goToChapter(page, "Harigurus");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  await page.getByRole("button", { name: "Reading view", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
  await openContents(page);
  await page.getByRole("link", { name: "My story", exact: true }).click();
  await page.locator(".observatory").waitFor();
  await expect(page.locator(".observatory")).toHaveCSS(
    "background-color",
    "rgb(13, 18, 19)",
  );
  await page.goBack();
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "8");
});

test("cold navigation materializes later pages without replacing native leaves", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.evaluate(
    () =>
      ((window as any).savedLeaves = [
        ...document.querySelectorAll(".library-slot [data-page]"),
      ]),
  );
  await goToChapter(page, "References");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  expect(
    await page.evaluate(() =>
      (window as any).savedLeaves.every(
        (el: Element, i: number) =>
          el === document.querySelectorAll(".library-slot [data-page]")[i],
      ),
    ),
  ).toBe(true);
  await expect(page.locator(".library-slot [data-page] h2")).toHaveCount(13);
  await expect(
    page
      .locator('.library-slot [data-page-id="references"] .reference-name')
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reading view", exact: true }).click();
  await expect(page.locator(".reading-document .book-page h2")).toHaveCount(13);
  await page
    .getByRole("button", { name: "Return to book", exact: true })
    .click();
  await expect(page.locator(".library-slot [data-page] h2")).toHaveCount(13);
  expect(errors).toEqual([]);
});
