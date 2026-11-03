import { test, expect } from "@playwright/test";

for (const width of [375, 768, 1280, 1920]) {
  for (const mode of ["book", "reading", "reduced"] as const) {
    test(`atlas connects every circle at ${width}px in ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
      await page.goto("/");
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      if (mode === "reading") await page.getByRole("button", { name: "Reading mode", exact: true }).click();
      else await page.getByRole("button", { name: "Open book", exact: true }).click();
      await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
      const route = page.locator(".atlas-route:visible");
      await expect(route).toHaveCount(1);
      await expect.poll(async () => route.evaluate((element) => {
        const path = element.querySelector("path")!;
        const matrix = path.getScreenCTM()!;
        const numbers = path.getAttribute("d")?.match(/-?[\d.]+/g)?.map(Number) ?? [];
        if (numbers.length !== 20) return Infinity;
        // The initial M and each cubic endpoint must match independently measured DOM centres.
        const points = [[numbers[0], numbers[1]], ...[6, 12, 18].map(i => [numbers[i], numbers[i + 1]])];
        return Math.max(...[...element.querySelectorAll(".atlas-node")].map((node, i) => {
          const r = node.getBoundingClientRect();
          const p = new DOMPoint(...points[i]).matrixTransform(matrix);
          return Math.hypot(p.x - r.x - r.width / 2, p.y - r.y - r.height / 2);
        }));
      })).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({ path: `docs/review/map-sound/${width}-${mode}.png`, fullPage: mode !== "reading" });
    });
  }
}

test("all atlas destinations work after responsive clone rebuilding", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  for (const [name, index] of [["The work", "2"], ["The systems", "5"], ["The people", "9"], ["Contact ·", "12"]] as const) {
    await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
    await page.locator(".atlas-route:visible").getByRole("button", { name: new RegExp(name) }).click();
    await expect(page.locator("#book")).toHaveAttribute("data-current-page", index);
    await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
    await page.getByRole("button", { name: "Atlas map", exact: true }).click();
    await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  }
});
