import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
await mkdir("tmp/audits/day02", { recursive: true });
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 1400 },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4173/");
await page.locator('[data-ready="true"]').waitFor();
await page.evaluate(() => document.fonts.ready);
const a11y = [];
for (const state of ["cover", "opening", "vault", "reduced", "reduced-cover"]) {
  if (state === "opening") {
    await page.getByRole("button", { name: "Open book", exact: true }).click();
    await page
      .locator('#book[data-current-page="1"][data-turning="false"]')
      .waitFor();
  }
  if (state === "vault") {
    await page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "Vault Storage", exact: true })
      .click();
    await page
      .locator('#book[data-current-page="3"][data-turning="false"]')
      .waitFor();
  }
  if (state === "reduced") {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(300);
  }
  if (state === "reduced-cover") {
    await page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "Cover", exact: true })
      .click();
    await page.locator('#book[data-current-page="0"]').waitFor();
    await page.waitForTimeout(250);
  }
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  a11y.push({
    state,
    violations: result.violations,
    incomplete: result.incomplete.map((x) => ({
      id: x.id,
      nodes: x.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
}
await writeFile("tmp/audits/day02/axe.json", JSON.stringify(a11y, null, 2));
console.log(
  "Axe:",
  a11y.map((x) => ({
    state: x.state,
    violations: x.violations.map((v) => v.id),
    incomplete: x.incomplete,
  })),
);
await browser.close();
const chrome = await launch({
  chromePath,
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});
try {
  for (const mode of ["desktop", "mobile"]) {
    const desktop = mode === "desktop";
    const result = await lighthouse(
      "http://127.0.0.1:4173/",
      {
        port: chrome.port,
        output: "json",
        onlyCategories: ["performance", "accessibility"],
        logLevel: "error",
      },
      {
        extends: "lighthouse:default",
        settings: desktop
          ? {
              formFactor: "desktop",
              screenEmulation: {
                mobile: false,
                width: 1280,
                height: 900,
                deviceScaleFactor: 1,
                disabled: false,
              },
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }
          : {},
      },
    );
    await writeFile(`tmp/audits/day02/lighthouse-${mode}.json`, result.report);
    const l = result.lhr;
    console.log(
      mode,
      JSON.stringify(
        {
          browser: l.environment.hostUserAgent,
          performance: l.categories.performance.score,
          accessibility: l.categories.accessibility.score,
          LCP: l.audits["largest-contentful-paint"].numericValue,
          CLS: l.audits["cumulative-layout-shift"].numericValue,
          TBT: l.audits["total-blocking-time"].numericValue,
          failed: Object.values(l.audits)
            .filter((x) => x.score !== null && x.score < 1)
            .map((x) => ({
              id: x.id,
              score: x.score,
              displayValue: x.displayValue,
            })),
        },
        null,
        2,
      ),
    );
  }
} finally {
  await chrome.kill();
}
