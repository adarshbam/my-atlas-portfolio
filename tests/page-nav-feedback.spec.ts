import { test, expect } from "@playwright/test";

test("navigation press releases outside the button and reduced motion clears its transform", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  const next = page.getByRole("button", { name: "Next page", exact: true });
  const scale = () =>
    next.evaluate((el) => {
      const value = getComputedStyle(el).transform;
      return value === "none" ? 1 : new DOMMatrixReadOnly(value).a;
    });
  const box = (await next.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(scale).toBeCloseTo(0.98, 2);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect.poll(scale).toBeCloseTo(1, 3);
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(next).toHaveCSS("transform", "none");
  await next.click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  for (const face of await page
    .locator('.plain-face[aria-hidden="false"]')
    .all()) {
    await expect(face).toHaveCSS("opacity", "1");
  }
});
