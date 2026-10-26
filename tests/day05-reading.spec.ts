import { test, expect } from "@playwright/test";
import { pages, references, professionalStory } from "../src/data/portfolio";

for (const [width, height] of [
  [360, 800],
  [375, 844],
  [390, 844],
  [768, 1024],
  [1280, 900],
  [1920, 1080],
  [375, 600],
  [1280, 720],
]) {
  test(`D5-5.2.1 D5-5.2.3 D5-5.2.5 ${width}x${height}: continuous reading contains every page, portrait and action`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    const book = page.locator("#book");
    await expect(book).toHaveAttribute("data-ready", "true");
    await page
      .getByRole("button", { name: "Reading mode", exact: true })
      .click();
    await expect(book).toHaveAttribute("data-mode", "reading");
    await expect(page.locator(".flip-engine")).toHaveCount(0);
    const document = page.locator(".reading-document");
    await expect(document.locator("[data-reading-page]")).toHaveCount(
      pages.length,
    );
    expect(
      await document
        .locator(".book-page")
        .evaluateAll((faces) =>
          faces.map((face) => (face as HTMLElement).dataset.pageId),
        ),
    ).toEqual(pages.map((page) => page.id));
    await page.screenshot({
      path: testInfo.outputPath(`${width}-reading-cover.jpg`),
      type: "jpeg",
      quality: 85,
    });
    for (const definition of pages) {
      const face = document.locator(`[data-page-id="${definition.id}"]`);
      await face.locator("h2").scrollIntoViewIfNeeded();
      await expect(face.locator("h2")).toBeVisible();
      await expect(
        page
          .getByRole("navigation", { name: "Portfolio chapters" })
          .locator('[aria-current="page"]'),
      ).toHaveCount(1);
      const geometry = await face.evaluate((face) => {
        const folio = face.querySelector(".folio")?.getBoundingClientRect();
        const content = face
          .querySelector(".page-content")
          ?.getBoundingClientRect();
        return {
          folioFits: !folio || !content || folio.top >= content.bottom - 1,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(geometry.overflow, definition.id).toBe(false);
      expect(geometry.folioFits, definition.id).toBe(true);
      for (const image of await face.locator("img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
    }
    for (const reference of references) {
      const quote = document.locator(`[data-reference-id="${reference.id}"]`);
      await expect(quote.locator("blockquote")).toHaveText(
        `“${reference.quote}”`,
      );
      await expect(quote.locator("img")).toHaveCSS("filter", "none");
      await expect(quote.locator("img")).toHaveCSS("animation-name", "none");
    }
    const contact = document.locator('[data-page-id="colophon"]');
    await expect(
      contact.getByRole("link", { name: professionalStory.email }),
    ).toHaveAttribute("href", `mailto:${professionalStory.email}`);
    const download = page.waitForEvent("download");
    await contact.getByRole("link", { name: "Download résumé (PDF)" }).click();
    expect((await download).suggestedFilename()).toBe(
      "Adarsh-Singh-Resume.pdf",
    );
    await contact.screenshot({
      path: testInfo.outputPath(`${width}-reading-contact.jpg`),
      type: "jpeg",
      quality: 85,
    });
    expect(errors).toEqual([]);
  });
}

test("D5-5.2.2 explicit reading remains available under OS reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reduced");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
  await expect(page.locator(".reading-document .book-page")).toHaveCount(
    pages.length,
  );
  await page
    .getByRole("button", { name: "Return to pages", exact: true })
    .click();
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reduced");
  await expect(page.locator(".flip-engine")).toHaveCount(0);
});

test("D5-5.2.6 scrolling changes return location without focus or announcement spam", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  const toggle = page.getByRole("button", {
    name: "Return to book",
    exact: true,
  });
  const announcement = await page.getByRole("status").textContent();
  await page
    .locator("#reading-references")
    .evaluate((section) =>
      section.scrollIntoView({ block: "start", behavior: "auto" }),
    );
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "9");
  await expect(toggle).toBeFocused();
  await expect(page.getByRole("status")).toHaveText(announcement!);
  await toggle.click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "9");
  await expect(page.locator(".flip-engine")).toHaveCount(1);
});

test("D5-5.2.4 touch scroll stays native and diagram gestures stay inside their region", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Vault Storage", exact: true })
    .click();
  const cdp = await context.newCDPSession(page);
  const before = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 700 }],
  });
  for (let step = 1; step <= 7; step++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190, y: 700 - step * 40 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "File flow", exact: true })
    .click();
  const diagram = page.locator("#reading-vault-architecture .diagram-scroll");
  // End the previous vertical fling, then use a visible, hit-tested region.
  await page.evaluate(() =>
    window.scrollTo({ top: scrollY, behavior: "instant" }),
  );
  await diagram.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const { x, y } = await diagram.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const toolbar = document
      .querySelector(".book-toolbar")!
      .getBoundingClientRect();
    const top = Math.max(box.top + 8, toolbar.bottom + 8);
    const bottom = Math.min(box.bottom - 8, innerHeight - 8);
    const x = box.right - 12,
      y = (top + bottom) / 2;
    if (bottom <= top || !el.contains(document.elementFromPoint(x, y)))
      throw new Error("No visible diagram touch target");
    return { x, y };
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 7; step++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - step * 20, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => diagram.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
