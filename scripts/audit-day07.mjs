import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { pages } from "../src/data/portfolio.ts";
import { baseURL, output, json } from "./day07-common.mjs";

const mode = process.argv[2];
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
if (mode === "loading") {
  await mkdir(`${output}/lighthouse`, { recursive: true });
  const chrome = await launch({
    chromePath,
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  const runs = [];
  try {
    for (const device of ["desktop", "mobile"])
      for (let run = 1; run <= 3; run++) {
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
            settings:
              device === "desktop"
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
        const lhr = result.lhr;
        await writeFile(
          `${output}/lighthouse/${device}-${run}.json`,
          result.report,
        );
        const entry = {
          device,
          run,
          userAgent: lhr.userAgent,
          lighthouseVersion: lhr.lighthouseVersion,
          performance: lhr.categories.performance.score * 100,
          accessibility: lhr.categories.accessibility.score * 100,
          LCP: lhr.audits["largest-contentful-paint"].numericValue,
          CLS: lhr.audits["cumulative-layout-shift"].numericValue,
          TBT: lhr.audits["total-blocking-time"].numericValue,
          transferBytes: lhr.audits["total-byte-weight"].numericValue,
          lcpInsight: lhr.audits["lcp-breakdown-insight"]?.details,
        };
        runs.push(entry);
        console.log(JSON.stringify({ ...entry, lcpInsight: undefined }));
      }
  } finally {
    await chrome.kill();
  }
  const median = (numbers) =>
    [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)];
  const medians = Object.fromEntries(
    ["desktop", "mobile"].map((device) => [
      device,
      Object.fromEntries(
        [
          "performance",
          "accessibility",
          "LCP",
          "CLS",
          "TBT",
          "transferBytes",
        ].map((key) => [
          key,
          median(runs.filter((r) => r.device === device).map((r) => r[key])),
        ]),
      ),
    ]),
  );
  const gates = Object.fromEntries(
    Object.entries(medians).map(([device, m]) => [
      device,
      {
        performance: m.performance >= 90,
        accessibility: m.accessibility >= 95,
        LCP: m.LCP < 2500,
        CLS: m.CLS < 0.05,
        initialTransfer: m.transferBytes <= 1_500_000,
      },
    ]),
  );
  const summary = {
    date: new Date().toISOString(),
    runs,
    medians,
    gates,
    conditions:
      "Three sequential reports per established desktop/default mobile simulated profile. Lighthouse clears storage by default; raw resolved config preserved. Local production preview; no concurrent benchmark.",
    unmeasured: ["field INP", "physical-device sustained 60fps"],
    note: "TBT is not INP; unthrottled insight subparts do not add up to simulated LCP.",
  };
  await json("loading-summary", summary);
  console.log(JSON.stringify({ medians, gates }, null, 2));
  if (
    runs.length !== 6 ||
    Object.values(gates).some((group) =>
      Object.values(group).some((pass) => !pass),
    )
  )
    process.exitCode = 1;
} else if (mode === "accessibility") {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });
  const records = [];
  try {
    for (const width of [375, 1280])
      for (const presentation of ["native", "reduced", "reading"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion:
            presentation === "reduced" ? "reduce" : "no-preference",
        });
        const page = await context.newPage();
        await page.goto(baseURL);
        await expect(page.locator("#book")).toHaveAttribute(
          "data-ready",
          "true",
        );
        if (presentation === "reading")
          await page
            .getByRole("button", { name: "Reading mode", exact: true })
            .click();
        const targets =
          presentation === "reading"
            ? [0]
            : pages
                .map((_, i) => i)
                .filter((i) => width < 768 || i === 0 || i % 2 === 1);
        for (const index of targets) {
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
          if (presentation === "reduced")
            for (const face of await page
              .locator(".plain-face[aria-hidden=false]")
              .all())
              await expect(face).toHaveCSS("opacity", "1");
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();
          const ids = await page
            .locator(
              presentation === "reading"
                ? ".reading-document .book-page"
                : presentation === "native"
                  ? ".library-slot .book-page[aria-hidden=false]"
                  : ".plain-face[aria-hidden=false] .book-page",
            )
            .evaluateAll((elements) => elements.map((el) => el.dataset.pageId));
          records.push({
            width,
            presentation,
            index,
            ids,
            violations: result.violations,
            incomplete: result.incomplete,
          });
          console.log(
            JSON.stringify({
              width,
              presentation,
              index,
              violations: result.violations.length,
            }),
          );
        }
        await context.close();
      }
  } finally {
    await browser.close();
    await json("axe", { browser: browser.version(), records });
  }
  const complete = [375, 1280].every((width) =>
    ["native", "reduced", "reading"].every((p) =>
      pages.every((definition) =>
        records.some(
          (r) =>
            r.width === width &&
            r.presentation === p &&
            r.ids.includes(definition.id),
        ),
      ),
    ),
  );
  const summary = {
    states: records.length,
    violations: records.reduce((sum, r) => sum + r.violations.length, 0),
    completePageCoverage: complete,
  };
  await json("axe-summary", summary);
  console.log(JSON.stringify(summary));
  if (!complete || !records.length || summary.violations) process.exitCode = 1;
} else {
  throw new Error("Use loading or accessibility");
}
