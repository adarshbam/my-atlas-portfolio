import { test, expect } from "@playwright/test";
for (const reducedMotion of ["no-preference", "reduce"] as const)
  test(`contents focus survives ${reducedMotion} page change`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Open book", exact: true }).click();
    await expect(page.locator("#book")).toHaveAttribute(
      "data-current-page",
      "1",
    );
    await expect(page.locator("#book")).toHaveAttribute(
      "data-turning",
      "false",
    );
    const selector =
      reducedMotion === "reduce"
        ? '.plain-face[aria-hidden="false"]'
        : ".library-slot";
    await page.locator(`${selector} [data-turn-page-id="vault"]`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#book")).toHaveAttribute(
      "data-current-page",
      "3",
    );
    await expect(page.locator(`${selector} [data-page="3"] h2`)).toBeFocused();
  });
