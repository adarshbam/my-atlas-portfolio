import { test, expect } from "@playwright/test";
import { chapters, pages } from "../src/data/portfolio";

const indexOf = (id: string) => pages.findIndex((page) => page.id === id);
for (const width of [375, 768, 1280, 1920]) {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    test(`D5-5.1.2 D5-5.1.3 ${width}px ${reducedMotion}: every persistent destination and final boundary`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const book = page.locator("#book");
      await expect(book).toHaveAttribute("data-ready", "true");
      const nav = page.getByRole("navigation", { name: "Portfolio chapters" });
      for (const chapter of chapters) {
        const action = nav.getByRole("button", {
          name: chapter.label,
          exact: true,
        });
        const box = (await action.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        await action.click();
        const target = indexOf(chapter.id);
        await expect(book).toHaveAttribute(
          "data-current-page",
          String(
            width < 768 || target === 0 || target % 2 ? target : target - 1,
          ),
        );
        await expect(book).toHaveAttribute("data-turning", "false");
        await expect(book).toHaveAttribute("data-logical-page", String(target));
        await expect(action).toHaveAttribute("aria-current", "page");
        await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
        await expect(page.getByRole("status")).toContainText(
          `of ${pages.length}`,
        );
      }
      await expect(
        page.getByRole("button", { name: "Next page", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("ArrowRight");
      await expect(book).toHaveAttribute("data-turning", "false");
      await nav.getByRole("button", { name: "Cover", exact: true }).click();
      await expect(book).toHaveAttribute("data-current-page", "0");
      await expect(book).toHaveAttribute("data-turning", "false");
      await expect(
        page.getByRole("button", { name: "Previous page", exact: true }),
      ).toBeDisabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("D5-5.1.4 latest interior chapter request wins and mode changes clear stale requests", async ({
  page,
}) => {
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  const nav = page.getByRole("navigation", { name: "Portfolio chapters" });
  await nav.getByRole("button", { name: "Vault Storage", exact: true }).click();
  await expect(book).toHaveAttribute("data-turning", "false");
  await nav.getByRole("button", { name: "Pipeline", exact: true }).click();
  await expect(book).toHaveAttribute("data-turning", "true");
  await nav.getByRole("button", { name: "References", exact: true }).click();
  await nav.getByRole("button", { name: "Contact", exact: true }).click();
  await expect(book).toHaveAttribute(
    "data-current-page",
    String(indexOf("colophon") - 1),
  );
  await expect(book).toHaveAttribute("data-turning", "false");
  await expect(book).toHaveAttribute(
    "data-logical-page",
    String(indexOf("colophon")),
  );
  await nav.getByRole("button", { name: "Vault Storage", exact: true }).click();
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await expect(book).toHaveAttribute("data-mode", "reading");
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await nav.getByRole("button", { name: "Harigurus", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to book", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-current-page", "7");
  await expect(book).toHaveAttribute("data-turning", "false");
  await expect(book).toHaveAttribute("data-logical-page", "8");
});

test("D5-5.1.5 exact right-hand destination survives phone resize and reading roundtrip", async ({
  page,
}) => {
  await page.goto("/");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Contact", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-turning", "false");
  await page.setViewportSize({ width: 375, height: 844 });
  await expect(book).toHaveAttribute("data-current-page", "12");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await expect(book).toHaveAttribute("data-current-page", "12");
  await expect(book).toHaveAttribute("data-mode", "reading");
  await page
    .getByRole("button", { name: "Return to book", exact: true })
    .click();
  await expect(book).toHaveAttribute("data-current-page", "12");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(book).toHaveAttribute("data-current-page", "11");
  await expect(book).toHaveAttribute("data-logical-page", "12");
});
