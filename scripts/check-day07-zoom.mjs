import { run } from "./day07-common.mjs";
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pages } from "../src/data/portfolio.ts";

// Dedicated test profile only. Chromium stores native page zoom per partition:
// https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
// The default partition has empty relative path, giving key "x". This changes
// native browser page zoom, not CSS zoom, pinch scale or emulated device density.
const profile = resolve(`tmp/day07/${run}/zoom-profile-${Date.now()}`);
await mkdir(`${profile}/Default`, { recursive: true });
await writeFile(
  `${profile}/Default/Preferences`,
  JSON.stringify({
    partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
  }),
);
await mkdir(`docs/review/day07/${run}`, { recursive: true });
const browser = await chromium.launchPersistentContext(profile, {
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  viewport: null,
  args: ["--window-size=1280,900", "--force-device-scale-factor=1"],
});
const page = browser.pages()[0];
const records = [];
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  for (const mode of ["native", "reduced", "reading"]) {
    await page.emulateMedia({
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    await page.goto(
      process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/",
    );
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    const metrics = await page.evaluate(() => ({
      dpr: devicePixelRatio,
      innerWidth,
      innerHeight,
      outerWidth,
      scale: visualViewport.scale,
    }));
    expect(metrics.dpr).toBeCloseTo(2, 2);
    expect(metrics.innerWidth).toBeLessThanOrEqual(metrics.outerWidth / 2);
    expect(metrics.scale).toBe(1);
    if (mode === "reading")
      await page
        .getByRole("button", { name: "Reading mode", exact: true })
        .click();
    for (let index = 0; index < pages.length; index++) {
      if (index)
        await page
          .getByRole("button", { name: "Next page", exact: true })
          .click();
      await expect(page.locator("#book")).toHaveAttribute(
        "data-current-page",
        String(index),
      );
      await expect(page.locator("#book")).toHaveAttribute(
        "data-turning",
        "false",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const face = page.locator(
        mode === "reading"
          ? `.reading-document [data-page="${index}"]`
          : mode === "reduced"
            ? `.plain-face[aria-hidden=false] [data-page="${index}"]`
            : `.library-slot [data-page="${index}"]`,
      );
      await expect(face.locator("h2")).toBeVisible();
      await expect(page.getByRole("navigation",{name:"Portfolio chapters"}).locator('[aria-current="page"]')).toHaveCount(1);
      records.push({ mode, index, ...metrics });
    }
    await page.screenshot({
      path: `docs/review/day07/${run}/zoom-200-${mode}.jpg`,
      type: "jpeg",
      quality: 85,
    });
  }
} finally {
  await browser.close();
  await writeFile(
    `docs/review/day07/${run}/zoom-200.json`,
    JSON.stringify(
      {
        method:
          "Native Chrome default-partition page zoom in isolated profile, forced device scale 1, viewport:null",
        records,
        errors,
      },
      null,
      2,
    ),
  );
}
expect(errors).toEqual([]);
console.log(JSON.stringify({ states: records.length, errors }));
