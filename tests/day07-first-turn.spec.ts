import { test, expect } from "@playwright/test";

test("first chapter feedback paints before native rendering while latest request still wins", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/#book");
  const book = page.locator("#book");
  await expect(book).toHaveAttribute("data-ready", "true");
  // Dispatch in one task so this exercises the pending-frame window rather
  // than depending on Playwright's actionability waits between real clicks.
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Portfolio chapters"]')!;
    for (const label of ["Vault Storage", "Contact"])
      [...nav.querySelectorAll("button")]
        .find((button) => button.textContent === label)!
        .click();
  });
  await expect(book).toHaveAttribute("data-current-page", "12");
  await expect(book).toHaveAttribute("data-turning", "false");
  await expect(page.getByRole("status")).toContainText("Page 13 of 13");
  await expect(
    page.locator(".chapter-nav")
      .getByRole("button", { name: "Contact", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
