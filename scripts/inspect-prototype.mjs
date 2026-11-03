import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("tmp/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const width of [375, 768, 1280, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 1080 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/");
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `tmp/screenshots/${width}-intro.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Vault Storage", exact: false })
    .last()
    .click();
  await page.waitForTimeout(1100);
  await page.screenshot({
    path: `tmp/screenshots/${width}-vault.png`,
    fullPage: true,
  });
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    current: document
      .querySelector("[data-current-page]")
      ?.getAttribute("data-current-page"),
    pages: [...document.querySelectorAll(".library-slot [data-page]")].map(
      (x) => ({
        page: x.getAttribute("data-page"),
        hidden: x.getAttribute("aria-hidden"),
        size: [x.clientWidth, x.clientHeight],
        innerScroll: x.firstElementChild.scrollHeight,
        innerHeight: x.firstElementChild.clientHeight,
        rect: x.getBoundingClientRect().toJSON(),
      }),
    ),
  }));
  results.push({ width, errors, ...result });
  await page.close();
}
await writeFile("tmp/inspection.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
