import { test, expect } from "@playwright/test";
import { pages } from "../src/data/portfolio";

for (const width of [375, 768, 1280, 1920]) {
  for (const motion of ["no-preference", "reduce"] as const) {
    test(`${width}px ${motion}: cover, opening order and navigation boundaries`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1400 });
      await page.emulateMedia({ reducedMotion: motion });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const book = page.locator("#book");
      await expect(book).toHaveAttribute("data-ready", "true");
      const scope =
        motion === "reduce"
          ? '.plain-face[aria-hidden="false"]'
          : '.library-slot [data-page][aria-hidden="false"]';
      const visible = () =>
        page.locator(`${scope} [data-page-id], ${scope}[data-page-id]`);
      const settled = async (index: number) => {
        await expect(book).toHaveAttribute("data-current-page", String(index));
        await expect(book).toHaveAttribute("data-turning", "false");
      };
      await settled(0);
      await expect(
        page.getByRole("button", { name: "Previous page", exact: true }),
      ).toBeDisabled();
      await expect(visible()).toHaveCount(1);
      await expect(visible()).toHaveAttribute("data-page-id", "cover");
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Skip to portfolio" }),
      ).toBeFocused();
      expect(
        await page
          .getByRole("link", { name: "Skip to portfolio" })
          .evaluate((x) => getComputedStyle(x).outlineStyle),
      ).toBe("solid");
      const open = page.getByRole("button", { name: "Open book", exact: true });
      await open.focus();
      await page.keyboard.press("Enter");
      await settled(1);
      await expect(page.getByRole("status")).toHaveText(
        `Page 2 of ${pages.length}. Introduction.`,
      );
      await expect(
        page.locator(
          `${scope} [data-page-id="introduction"] h2, ${scope}[data-page-id="introduction"] h2`,
        ),
      ).toBeFocused();
      if (width < 768) {
        await expect(visible()).toHaveCount(1);
        await page.keyboard.press("ArrowRight");
        await settled(2);
      } else {
        await expect(visible()).toHaveCount(2);
        expect(
          await visible().evaluateAll((faces) =>
            faces.map((x) => x.getAttribute("data-page-id")),
          ),
        ).toEqual(["introduction", "contents"]);
      }
      const contents = page.locator(`${scope} [data-turn-page-id="vault"]`);
      await contents.focus();
      await page.keyboard.press("Enter");
      await settled(3);
      await expect(page.getByRole("status")).toHaveText(
        `Page 4 of ${pages.length}. Vault Storage.`,
      );
      const lastGroupStart = width < 768 ? pages.length - 1 : pages.length - 2;
      while (
        Number(await book.getAttribute("data-current-page")) < lastGroupStart
      ) {
        const target = Math.min(
          lastGroupStart,
          Number(await book.getAttribute("data-current-page")) +
            (width < 768 ? 1 : 2),
        );
        await page.keyboard.press("ArrowRight");
        await settled(target);
      }
      await expect(
        page.getByRole("button", { name: "Next page", exact: true }),
      ).toBeDisabled();
      await page.keyboard.press("ArrowRight");
      await settled(lastGroupStart);
      await page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .getByRole("button", { name: "Cover", exact: true })
        .click();
      await settled(0);
      await expect(page.locator(".page-counter")).toHaveText(
        `01/${String(pages.length).padStart(2, "0")}`,
      );
      await page.keyboard.press("ArrowLeft");
      await settled(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page.evaluate(() => !!document.activeElement?.closest("[inert]")),
      ).toBe(false);
      expect(errors).toEqual([]);
    });
  }
}

test("page identity survives resizing and reading-mode changes from either opening face", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1400 });
  await page.goto("/");
  await page.locator("#book[data-ready=true]").waitFor();
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "2");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  await expect(
    page.locator(".library-slot [data-page][aria-hidden=false]"),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await expect(page.locator(".reading-document .book-page")).toHaveCount(
    pages.length,
  );
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Cover", exact: true })
    .click();
  await expect(
    page.locator(".reading-document [data-page-id=cover]"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Return to book", exact: true })
    .click();
  await expect(page.locator(".flip-engine")).toHaveCount(1);
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "0");
});
