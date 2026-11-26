import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, statSync } from "node:fs";
import sharp from "sharp";

// Link preview: docs/RECRUITER-PACKAGE-PLAN-2026-11-22.md, Task 5. Node-side checks, no browser.
const image = "public/og-atlas.jpg";

test("preview image is 1200×630 and at most 250 KB", async () => {
  expect(existsSync(image)).toBe(true);
  const { width, height, format } = await sharp(image).metadata();
  expect({ width, height, format }).toEqual({ width: 1200, height: 630, format: "jpeg" });
  expect(statSync(image).size).toBeLessThanOrEqual(250 * 1024);
});

// Public address confirmed by the user on 22 November 2026.
const origin = "https://adarshbam.netlify.app";

test("built page carries large-image preview metadata", () => {
  const html = readFileSync("dist/index.html", "utf8");
  const meta = (key: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)="${key}"\\s+content="([^"]*)"`))?.[1];
  expect(meta("og:image")).toBe(`${origin}/og-atlas.jpg`);
  expect(meta("og:image:width")).toBe("1200");
  expect(meta("og:image:height")).toBe("630");
  expect(meta("og:image:alt")).toBeTruthy();
  expect(meta("twitter:card")).toBe("summary_large_image");
  expect(meta("twitter:image")).toBe(`${origin}/og-atlas.jpg`);
});
