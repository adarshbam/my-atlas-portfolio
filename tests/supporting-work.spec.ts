import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { pages, professionalStory } from "../src/data/portfolio";

for (const width of [375, 768, 1280, 1920]) {
  for (const mode of ["native", "reduced", "reading"] as const) {
    test(`${width}px ${mode}: supporting work, attribution and contact are keyboard reachable`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const book = page.locator("#book");
      await expect(book).toHaveAttribute("data-ready", "true");
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      const scope =
        mode === "native"
          ? ".library-slot .book-page[aria-hidden=false]"
          : mode === "reading"
            ? ".reading-document .book-page"
            : ".plain-face[aria-hidden=false] .book-page";
      for (const id of ["pipeline", "harigurus", "security-lab"] as const) {
        await page
          .getByRole("navigation", { name: "Portfolio chapters" })
          .getByRole("button", { name: "Introduction", exact: true })
          .click();
        await expect(book).toHaveAttribute("data-current-page", "1");
        await expect(book).toHaveAttribute("data-turning", "false");
        if (width < 768 && mode !== "reading") {
          await page.keyboard.press("ArrowRight");
          await expect(book).toHaveAttribute("data-current-page", "2");
          await expect(book).toHaveAttribute("data-turning", "false");
        }
        const destination = page.locator(
          `${scope} [data-turn-page-id="${id}"]`,
        );
        await destination.focus();
        await page.keyboard.press("Enter");
        const index = pages.findIndex((p) => p.id === id);
        await expect(book).toHaveAttribute(
          "data-current-page",
          String(
            mode === "reading" || width < 768 || index % 2 ? index : index - 1,
          ),
        );
        await expect(book).toHaveAttribute("data-turning", "false");
        const face = page.locator(`${scope}[data-page-id="${id}"]`);
        await expect(face.locator("h2")).toBeVisible();
        await expect(face.locator("h2")).toBeFocused();
        await expect(page.getByRole("status")).toContainText(
          `of ${pages.length}`,
        );
        if (id === "pipeline") {
          await expect(face).toContainText("two slots per run");
          await expect(face).toContainText("runner’s OS permissions");
          await expect(face).toContainText(
            "full-engine behavior was source-reviewed",
          );
        } else if (id === "harigurus") {
          await expect(face).toContainText("8 months");
          await expect(face).toContainText(
            "repository is a written case study",
          );
        } else {
          await expect(face).toContainText("has not been published");
          await expect(face).toContainText("Loopback only");
        }
      }
      await page
        .getByRole("navigation", { name: "Portfolio chapters" })
        .getByRole("button", { name: "Contact", exact: true })
        .click();
      await expect(book).toHaveAttribute(
        "data-current-page",
        String(
          mode === "reading" || width < 768
            ? pages.length - 1
            : pages.length - 2,
        ),
      );
      await expect(book).toHaveAttribute("data-turning", "false");
      const contact = page.locator(`${scope}[data-page-id="colophon"]`);
      const resume = contact.getByRole("link", {
        name: "Download résumé (PDF)",
      });
      await contact.locator("h2").focus();
      await page.keyboard.press("Tab");
      await expect(resume).toBeFocused();
      await expect(resume).toHaveCSS("outline-style", "solid");
      for (const link of await contact.locator("a").all()) {
        const box = (await link.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
      await expect(resume).toHaveAttribute(
        "download",
        "Adarsh-Singh-Resume.pdf",
      );
      await expect(
        contact.getByRole("link", { name: professionalStory.email }),
      ).toHaveAttribute("href", `mailto:${professionalStory.email}`);
      for (const [label, href] of [
        ["+91 8005156732", "tel:+918005156732"],
        ["+91 6386036252", "tel:+916386036252"],
      ]) {
        const phone = contact.getByRole("link", { name: label, exact: true });
        await phone.focus();
        await expect(phone).toBeFocused();
        await expect(phone).toBeVisible();
        await expect(phone).toHaveAttribute("href", href);
      }
      const downloadEvent = page.waitForEvent("download");
      await resume.press("Enter");
      expect((await downloadEvent).suggestedFilename()).toBe(
        "Adarsh-Singh-Resume.pdf",
      );
      const response = await request.get("/adarsh-singh-resume.pdf");
      expect(response.ok()).toBe(true);
      expect(
        createHash("sha256")
          .update(await response.body())
          .digest("hex"),
      ).toBe(
        "07cfd35fd117b2eb3fb26bf4d0956cebb2dd53d16a3e0dc62482f6f998c17daa",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      expect(
        await page.evaluate(() => !!document.activeElement?.closest("[inert]")),
      ).toBe(false);
      expect(errors).toEqual([]);
    });
  }
}
