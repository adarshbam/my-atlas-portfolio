import { test, expect, type Page } from "@playwright/test";
import { pages } from "../src/data/portfolio";

const vaultIndex = pages.findIndex((page) => page.id === "vault");
const architectureIndex = pages.findIndex(
  (page) => page.id === "vault-architecture",
);
async function settled(page: Page, index: number) {
  await expect(page.locator("#book")).toHaveAttribute(
    "data-current-page",
    String(index),
  );
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
}

for (const width of [375, 768, 1280, 1920]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`${width}px ${reducedMotion}: all Vault pages and full captures are reachable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .getByRole("button", { name: "Vault Storage", exact: true })
        .click();
      await settled(page, vaultIndex);
      const activeChapter = page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .locator("button[aria-current]");
      await expect(activeChapter).toHaveCSS("color", "rgb(22, 21, 19)");
      await expect(activeChapter).toHaveCSS(
        "text-decoration-color",
        "rgb(118, 88, 24)",
      );
      const visible = () =>
        page.locator(
          reducedMotion === "reduce"
            ? ".plain-face[aria-hidden=false] .book-page"
            : ".library-slot .book-page[aria-hidden=false]",
        );
      const step = width < 768 ? 1 : 2;
      const encountered: string[] = [];
      for (let index = vaultIndex; index < pages.length; index += step) {
        await settled(page, index);
        const faces = visible();
        for (const face of await faces.all()) {
          encountered.push((await face.getAttribute("data-page-id"))!);
          const h2 = face.locator("h2");
          await expect(h2).toBeVisible();
          const contentBottom = await face
            .locator(".page-content")
            .evaluate(
              (element) =>
                element.lastElementChild!.getBoundingClientRect().bottom,
            );
          const folioTop = (await face.locator(".folio").boundingBox())!.y;
          expect(contentBottom).toBeLessThanOrEqual(folioTop + 1);
          for (const img of await face.locator(".vault-figure img").all()) {
            await expect(img).toHaveCSS("filter", "none");
          }
          for (const link of await face.locator(".vault-figure > a").all()) {
            // Enter keyboard modality and reach the real link through Tab order.
            // Programmatic focus after the chapter's mouse click need not match :focus-visible.
            for (let tab = 0; tab < 24; tab++) {
              if (await link.evaluate(element => element === document.activeElement)) break;
              await page.keyboard.press("Tab");
            }
            await expect(link).toBeFocused();
            expect(
              await link.evaluate(
                (element) => getComputedStyle(element).outlineStyle,
              ),
            ).toBe("solid");
            expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(
              44,
            );
            const popupPromise = page.waitForEvent("popup");
            await page.keyboard.press("Enter");
            const popup = await popupPromise;
            await popup.waitForLoadState();
            expect(popup.url()).toContain("/images/vault/");
            expect(popup.url()).toContain("-source.jpg");
            await expect(popup.locator("img")).toHaveJSProperty("naturalWidth", 1440);
            await popup.close();
            await settled(page, index);
          }
          if (width < 768) {
            // A long phone page keeps lower captions/actions reachable inside its sheet.
            const inner = face.locator(".page-inner");
            await inner.evaluate((element) => {
              element.scrollTop = element.scrollHeight;
            });
            const footer = (await face.locator(".folio").boundingBox())!;
            const bounds = (await face.boundingBox())!;
            expect(footer.y + footer.height).toBeLessThanOrEqual(
              bounds.y + bounds.height + 1,
            );
          }
        }
        if (index + step < pages.length) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
        }
      }
      expect(encountered).toEqual(
        pages.slice(vaultIndex).map((page) => page.id),
      );
      await expect(
        page.getByRole("button", { name: "Next page", exact: true }),
      ).toBeDisabled();
      await page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .getByRole("button", { name: "File flow", exact: true })
        .click();
      await settled(page, architectureIndex);
      await expect(visible().locator(".diagram-scroll")).toHaveCount(1);
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
