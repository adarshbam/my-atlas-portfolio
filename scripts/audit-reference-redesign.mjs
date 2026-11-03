import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const output = "tmp/audits/reference-redesign";
const runs = Number(process.env.ATLAS_AUDIT_RUNS ?? 3);
if (!Number.isInteger(runs) || runs < 1 || runs > 5)
  throw new Error("ATLAS_AUDIT_RUNS must be an integer from 1 through 5.");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});
const accessibility = [];

async function settled(page, index) {
  await expect(page.locator("#book")).toHaveAttribute(
    "data-current-page",
    String(index),
  );
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  await page.waitForTimeout(220);
}

try {
  for (const [device, width, height] of [
    ["desktop", 1280, 900],
    ["phone", 375, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => document.fonts.ready);
    for (const state of ["cover", "opening", "vault", "reading", "reduced"]) {
      if (state === "opening") {
        await page
          .getByRole("button", { name: "Open book", exact: true })
          .click();
        await settled(page, 1);
      }
      if (state === "vault") {
        await page
          .getByRole("navigation", { name: "Portfolio chapters" })
          .getByRole("button", { name: "Vault Storage", exact: true })
          .click();
        await settled(page, 3);
      }
      if (state === "reading") {
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
        await expect(page.locator(".flip-engine")).toHaveCount(0);
        await settled(page, 3);
      }
      if (state === "reduced") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        if (width < 768) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await settled(page, 4);
        } else {
          await page
            .getByRole("navigation", { name: "Portfolio chapters" })
            .getByRole("button", { name: "Introduction", exact: true })
            .click();
          await settled(page, 1);
        }
      }
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      accessibility.push({
        device,
        state,
        width,
        height,
        page: await page.locator("#book").getAttribute("data-current-page"),
        violations: result.violations,
        incomplete: result.incomplete.map((entry) => ({
          id: entry.id,
          nodes: entry.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
      });
      console.log(
        JSON.stringify({
          device,
          state,
          violations: result.violations.map((violation) => violation.id),
        }),
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/axe.json`, JSON.stringify(accessibility, null, 2));
}

const chrome = await launch({
  chromePath,
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});
const performanceRuns = [];
try {
  for (const device of ["desktop", "mobile"]) {
    for (let run = 1; run <= runs; run++) {
      const desktop = device === "desktop";
      const result = await lighthouse(
        baseURL,
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
      await writeFile(
        `${output}/lighthouse-${device}-${run}.json`,
        result.report,
      );
      const report = result.lhr;
      const entry = {
        device,
        run,
        browser: report.environment.hostUserAgent,
        performance: report.categories.performance.score,
        accessibility: report.categories.accessibility.score,
        LCP: report.audits["largest-contentful-paint"].numericValue,
        CLS: report.audits["cumulative-layout-shift"].numericValue,
        TBT: report.audits["total-blocking-time"].numericValue,
      };
      performanceRuns.push(entry);
      console.log(JSON.stringify(entry));
    }
  }
} finally {
  await chrome.kill();
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const budgets = [];
for (const device of ["desktop", "mobile"]) {
  const sample = performanceRuns.filter((entry) => entry.device === device);
  const metrics = Object.fromEntries(
    ["performance", "accessibility", "LCP", "CLS", "TBT"].map((key) => [
      key,
      median(sample.map((entry) => entry[key])),
    ]),
  );
  budgets.push({
    device,
    runs: sample.length,
    median: metrics,
    passed:
      metrics.performance >= 0.9 &&
      metrics.accessibility >= 0.95 &&
      metrics.LCP < 2500 &&
      metrics.CLS < 0.05,
  });
}
const summary = {
  kind: "Local production-preview lab audit",
  baseURL,
  accessibilityStates: accessibility.length,
  violations: accessibility.flatMap((entry) =>
    entry.violations.map((violation) => ({
      device: entry.device,
      state: entry.state,
      id: violation.id,
    })),
  ),
  budgets,
  performanceRuns,
  INP: "Not measured; Lighthouse TBT is not an INP measurement.",
  acceptance:
    "Automated results do not establish human visual/motion acceptance or full WCAG compliance.",
};
await writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (summary.violations.length || budgets.some((entry) => !entry.passed))
  process.exitCode = 1;
