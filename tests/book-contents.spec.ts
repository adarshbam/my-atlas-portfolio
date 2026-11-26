import { test, expect } from "@playwright/test";
import { openBook } from "./helpers/book";
import { opening, pages, professionalStory } from "../src/data/portfolio";

// The book, read from cover to contact a turn at a time, holds every page with its
// heading, its pictures and its folio, at each window size the atlas is checked at.
// (Until 23 November 2026 this sweep was made through the atlas's continuous view,
// which was withdrawn; the same things are checked here in the book itself.)
for (const [width, height] of [
  [360, 800],
  [375, 844],
  [390, 844],
  [768, 1024],
  [1280, 900],
  [1920, 1080],
  [375, 600],
  [1280, 720],
] as const) {
  test(`${width}x${height}: the book holds every page, heading, picture and folio, cover to contact`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await openBook(page);
    const book = page.locator("#book");
    await expect(book).toHaveAttribute("data-mode", "native");
    await expect(page.locator(".flip-engine")).toHaveCount(1);
    // Every page, in order (the engine's source copy holds them all).
    expect(
      await page
        .locator(".page-measure-source .book-page")
        .evaluateAll((faces) =>
          faces.map((face) => (face as HTMLElement).dataset.pageId),
        ),
    ).toEqual(pages.map((definition) => definition.id));

    const seen: string[] = [];
    const next = page.getByRole("button", { name: "Next page", exact: true });
    for (let turn = 0; turn <= pages.length; turn++) {
      await expect(book).toHaveAttribute("data-turning", "false");
      const faces = page.locator(
        '.library-slot .book-page[aria-hidden="false"]',
      );
      for (const face of await faces.all()) {
        const id = (await face.getAttribute("data-page-id"))!;
        seen.push(id);
        const heading = face.locator("h2");
        await heading.scrollIntoViewIfNeeded();
        await expect(heading, id).toBeVisible();
        await expect(
          page.locator(".chapter-nav").locator('[aria-current="page"]'),
        ).toHaveCount(1);
        const geometry = await face.evaluate((node) => {
          const folio = node.querySelector(".folio")?.getBoundingClientRect();
          const content = node
            .querySelector(".page-content")
            ?.getBoundingClientRect();
          return {
            folioFits: !folio || !content || folio.top >= content.bottom - 1,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        expect(geometry.overflow, id).toBe(false);
        expect(geometry.folioFits, id).toBe(true);
        for (const image of await face.locator("img").all()) {
          const shown = await image.evaluate(
            (el: HTMLElement) => el.offsetParent !== null,
          );
          if (!shown) continue;
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(
              () =>
                image.evaluate(
                  (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
                ),
              { message: `${id}: ${await image.getAttribute("src")}` },
            )
            .toBe(true);
        }
        if (id === "colophon") {
          await expect(
            face.getByRole("link", { name: professionalStory.email }),
          ).toHaveAttribute("href", `mailto:${professionalStory.email}`);
          await expect(
            face.getByRole("link", { name: /View résumé \(PDF\)/ }),
          ).toHaveAttribute("href", "/adarsh-singh-resume.pdf");
        }
      }
      if (await next.isDisabled()) break;
      const before = (await book.getAttribute("data-current-page"))!;
      await next.click();
      await expect(book).not.toHaveAttribute("data-current-page", before);
    }
    expect(seen).toEqual(pages.map((definition) => definition.id));
    await expect(next).toBeDisabled();
    expect(errors).toEqual([]);
  });
}

// The introduction is the page the opening lands on. Its blocks are placed over the portrait,
// so nothing but their own layout keeps one from being printed over another (found by review,
// 23 November 2026: on phones the stack line ran under the sentence).
for (const [width, height] of [
  [320, 568],
  [344, 882],
  [360, 640],
  [375, 600],
  [375, 812],
  [390, 844],
  [430, 932],
  [504, 900],
  [540, 900],
  [767, 1024],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1920, 1080],
] as const)
  for (const motion of ["no-preference", "reduce"] as const)
    test(`${width}x${height} ${motion}: on the introduction page no block is printed over another`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: motion });
      await openBook(page);
      const book = page.locator("#book");
      await page
        .getByRole("button", { name: "Open book", exact: true })
        .first()
        .click();
      await expect(book).toHaveAttribute("data-logical-page", "1");
      await expect(book).toHaveAttribute("data-turning", "false");
      await page.evaluate(() => document.fonts.ready);
      const scope =
        motion === "reduce"
          ? '.plain-face[aria-hidden="false"]'
          : '.library-slot [data-page][aria-hidden="false"]';
      const face = page
        .locator(
          `${scope} [data-page-id="introduction"], ${scope}[data-page-id="introduction"]`,
        )
        .first();
      await expect(face.locator("h2")).toBeVisible();
      const layout = await face.evaluate((node) => {
        const box = (selector: string) => {
          const rect = node.querySelector(selector)!.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
          };
        };
        const inner = node.querySelector<HTMLElement>(".introduction-inner")!;
        const sheet = node
          .querySelector(".sheet-surface")!
          .getBoundingClientRect();
        // Every line of text on the page, as drawn.
        const lines = [
          ".running-head",
          ".introduction-copy",
          ".introduction-note",
          ".folio",
        ].flatMap((selector) => {
          const range = document.createRange();
          range.selectNodeContents(node.querySelector(selector)!);
          return [...range.getClientRects()]
            .filter((rect) => rect.width > 1 && rect.height > 1)
            .map((rect) => ({
              selector,
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
            }));
        });
        return {
          head: box(".running-head"),
          copy: box(".introduction-copy"),
          note: box(".introduction-note"),
          folio: box(".folio"),
          sheet: {
            left: sheet.left,
            top: sheet.top,
            right: sheet.right,
            bottom: sheet.bottom,
          },
          lines,
          // Nothing is pushed out of the page where a reader would have to scroll for it.
          scrolls: inner.scrollHeight - inner.clientHeight,
          text: {
            stack: node.querySelector(".introduction-stack")!.textContent,
            note: node.querySelector(".introduction-note")!.textContent,
          },
        };
      });
      // Top to bottom: running head, name block, sentence, folio, each clear of the next.
      expect(
        layout.copy.top,
        "name block under the running head",
      ).toBeGreaterThanOrEqual(layout.head.bottom);
      expect(
        layout.note.top - layout.copy.bottom,
        "sentence under the name block",
      ).toBeGreaterThanOrEqual(8);
      expect(
        layout.folio.top - layout.note.bottom,
        "folio under the sentence",
      ).toBeGreaterThanOrEqual(4);
      // No two lines of text from different blocks share any ground.
      const crossings = layout.lines.flatMap((a, index) =>
        layout.lines
          .slice(index + 1)
          .filter(
            (b) =>
              a.selector !== b.selector &&
              a.left < b.right - 1 &&
              b.left < a.right - 1 &&
              a.top < b.bottom - 1 &&
              b.top < a.bottom - 1,
          )
          .map((b) => `${a.selector} over ${b.selector}`),
      );
      expect(crossings).toEqual([]);
      // Every line is on the sheet, and the page does not scroll.
      for (const line of layout.lines) {
        expect(line.left, line.selector).toBeGreaterThanOrEqual(
          layout.sheet.left,
        );
        expect(line.right, line.selector).toBeLessThanOrEqual(
          layout.sheet.right + 1,
        );
        expect(line.bottom, line.selector).toBeLessThanOrEqual(
          layout.sheet.bottom + 1,
        );
      }
      expect(layout.scrolls).toBeLessThanOrEqual(1);
      // The words are the data's, whole.
      expect(layout.text).toEqual({
        stack: opening.stack,
        note: opening.introduction,
      });
    });
