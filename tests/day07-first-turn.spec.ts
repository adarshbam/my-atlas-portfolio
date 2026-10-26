import { test, expect } from "@playwright/test";

test("first chapter feedback paints before native rendering while latest request still wins", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/");
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
    page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "Contact", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("reading mode cancels a first turn before its native rendering frame", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Portfolio chapters"]')!;
    [...nav.querySelectorAll("button")]
      .find((button) => button.textContent === "Vault Storage")!
      .click();
    (document.querySelector(".reading-toggle") as HTMLButtonElement).click();
  });
  await expect(page.locator("#book")).toHaveAttribute("data-mode", "reading");
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  const vault = page.locator('.reading-document [data-page-id="vault"]');
  await expect(vault).toBeVisible();
  await page
    .getByRole("button", { name: "Return to book", exact: true })
    .click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "3");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
});
