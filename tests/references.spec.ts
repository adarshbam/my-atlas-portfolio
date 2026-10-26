import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pages, references, chapters } from "../src/data/portfolio";

const evidence = JSON.parse(
  readFileSync("tests/fixtures/references.json", "utf8"),
);
const indexOf = (id: string) => pages.findIndex((page) => page.id === id);
const groupStart = (id: string, width: number) => {
  const index = indexOf(id);
  return width < 768 || index % 2 ? index : index - 1;
};

for (const width of [375, 768, 1280, 1920]) {
  for (const mode of ["native", "reduced", "reading"] as const) {
    test(`${width}px ${mode}: faithful references, portraits, navigation and closing boundary`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto("/");
      const book = page.locator("#book");
      await expect(book).toHaveAttribute("data-ready", "true");
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      const nav = page.getByRole("navigation", { name: "Portfolio chapters" });
      const referenceButton = nav.getByRole("button", {
        name: "References",
        exact: true,
      });
      for (const button of await nav.getByRole("button").all()) {
        const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await nav.getByRole("button", { name: "Cover", exact: true }).focus();
      for (
        let index = 0;
        index < chapters.findIndex((chapter) => chapter.id === "references");
        index++
      ) {
        await page.keyboard.press("Tab");
      }
      await expect(referenceButton).toBeFocused();
      await expect(referenceButton).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Enter");
      await expect(book).toHaveAttribute(
        "data-current-page",
        String(indexOf("references")),
      );
      await expect(book).toHaveAttribute("data-turning", "false");
      const scope =
        mode === "native"
          ? ".library-slot .book-page[aria-hidden=false]"
          : mode === "reading"
            ? ".reading-document .book-page"
            : ".plain-face[aria-hidden=false] .book-page";
      for (const id of ["references", "references-continued"]) {
        if (
          width < 768 &&
          mode !== "reading" &&
          id === "references-continued"
        ) {
          await page.keyboard.press("ArrowRight");
          await expect(book).toHaveAttribute(
            "data-current-page",
            String(indexOf(id)),
          );
          await expect(book).toHaveAttribute("data-turning", "false");
        }
        const face = page.locator(`${scope}[data-page-id="${id}"]`);
        await expect(face.locator("h2")).toBeVisible();
        for (const reference of references.filter(
          (record) => record.pageId === id,
        )) {
          const original = evidence.records.find(
            (record: { id: string }) => record.id === reference.id,
          );
          const figure = face.locator(`[data-reference-id="${reference.id}"]`);
          expect(original.raw_quote).toContain(reference.quote);
          await expect(figure.locator("blockquote")).toHaveText(
            `“${original.excerpt}”`,
          );
          await expect(figure.locator(".reference-name")).toHaveText(
            original.name,
          );
          await expect(figure.locator(".reference-role")).toHaveText(
            original.source_role,
          );
          const image = figure.getByRole("img", {
            name: `Portrait of ${original.name}`,
          });
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              image.evaluate(
                (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
              ),
            )
            .toBe(true);
          expect(
            await image.evaluate((el: HTMLImageElement) => el.currentSrc),
          ).toContain(`/images/references/${reference.id}-`);
          await expect(image).toHaveCSS("filter", "none");
          if (mode !== "native")
            await expect(image).toHaveCSS("animation-name", "none");
          const bounds = (await image.boundingBox())!;
          expect(bounds.width).toBeCloseTo(bounds.height, 1);
        }
        await expect(face.locator("a, [cite]")).toHaveCount(0);
        await expect(face).not.toContainText("Previous portfolio");
        expect(
          await page.evaluate(
            () => !!document.activeElement?.closest("[inert]"),
          ),
        ).toBe(false);
      }
      await expect(page.getByRole("status")).toContainText(
        `of ${pages.length}`,
      );
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .some((entry) =>
              /anuragsingh[.]jfif|AnuragSingProcodrr[.]png/.test(entry.name),
            ),
        ),
      ).toBe(false);
      await nav.getByRole("button", { name: "Contact", exact: true }).click();
      await expect(book).toHaveAttribute(
        "data-current-page",
        String(
          mode === "reading"
            ? indexOf("colophon")
            : groupStart("colophon", width),
        ),
      );
      await expect(book).toHaveAttribute("data-turning", "false");
      await expect(
        page.getByRole("button", { name: "Next page", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("ArrowRight");
      await expect(book).toHaveAttribute(
        "data-current-page",
        String(
          mode === "reading"
            ? indexOf("colophon")
            : groupStart("colophon", width),
        ),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      expect(errors).toEqual([]);
    });
  }
}
