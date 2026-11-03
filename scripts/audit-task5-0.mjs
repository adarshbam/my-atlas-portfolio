import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
import { pages } from "../src/data/portfolio.ts";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const output = "tmp/audits/task5-0";
const durable = "docs/review/task5-0/final";
await mkdir(output, { recursive: true });
await mkdir(durable, { recursive: true });
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});
const accessibility = [];
const contrast = [];
const assets = [];
try {
  for (const [width, height] of [
    [375, 844],
    [1280, 900],
  ]) {
    for (const mode of ["native", "reading", "reduced"]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.goto(baseURL);
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      await page.evaluate(() => document.fonts.ready);
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      const targets =
        width < 768
          ? pages.map((_, index) => index)
          : pages
              .map((_, index) => index)
              .filter((index) => index === 0 || index % 2 === 1);
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
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        accessibility.push({
          width,
          mode,
          index,
          violations: result.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            targets: nodes.map((node) => node.target),
          })),
          incomplete: result.incomplete.map((entry) => entry.id),
        });
        if (index >= 3) {
          const scope =
            mode === "native"
              ? ".library-slot .page--case[aria-hidden=false]"
              : ".plain-face[aria-hidden=false] .page--case";
          contrast.push(
            ...(await page
              .locator(
                `${scope} .case-title,${scope} p,${scope} figcaption,${scope} .text-link,${scope} .diagram-node > span,${scope} .diagram-node small`,
              )
              .evaluateAll((elements) =>
                elements.map((element) => ({
                  text: element.textContent.trim(),
                  color: getComputedStyle(element).color,
                  background: getComputedStyle(document.documentElement)
                    .getPropertyValue("--paper")
                    .trim(),
                  fontSize: parseFloat(getComputedStyle(element).fontSize),
                })),
              )),
          );
        }
        if (!index && mode === "native")
          assets.push({
            width,
            resources: await page.evaluate(() =>
              performance.getEntriesByType("resource").map((entry) => ({
                name: new URL(entry.name).pathname,
                bytes: entry.encodedBodySize,
                duration: entry.duration,
              })),
            ),
          });
        console.log(
          JSON.stringify({
            kind: "axe",
            width,
            mode,
            index,
            violations: result.violations.length,
          }),
        );
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/axe.json`, JSON.stringify(accessibility, null, 2));
  await writeFile(
    `${durable}/axe.json`,
    JSON.stringify(accessibility, null, 2),
  );
}
const luminance = (rgb) =>
  rgb
    .map((value) => {
      value /= 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
const paper = luminance([239, 233, 222]);
const contrasts = contrast.map((record) => {
  const color = record.color
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
  const ink = luminance(color);
  return {
    ...record,
    ratio: (Math.max(paper, ink) + 0.05) / (Math.min(paper, ink) + 0.05),
  };
});
await writeFile(
  `${output}/case-contrast.json`,
  JSON.stringify(contrasts, null, 2),
);
const chrome = await launch({
  chromePath,
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});
const performanceRuns = [];
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
      const entry = {
        device,
        run,
        performance: lhr.categories.performance.score * 100,
        accessibility: lhr.categories.accessibility.score * 100,
        LCP: lhr.audits["largest-contentful-paint"].numericValue,
        CLS: lhr.audits["cumulative-layout-shift"].numericValue,
        TBT: lhr.audits["total-blocking-time"].numericValue,
        transferBytes: lhr.audits["total-byte-weight"].numericValue,
      };
      performanceRuns.push(entry);
      await writeFile(`${output}/${device}-${run}.json`, result.report);
      console.log(JSON.stringify(entry));
    }
} finally {
  await chrome.kill();
}
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = {
  date: "2026-10-25",
  browser:
    "Headless Chrome via installed Google Chrome, Lighthouse simulated loading",
  axeStates: accessibility.length,
  axeViolations: accessibility.reduce(
    (total, state) => total + state.violations.length,
    0,
  ),
  caseContrastMinimum: Math.min(...contrasts.map((record) => record.ratio)),
  caseContrastBelowAA: contrasts.filter(
    (record) => record.ratio < (record.fontSize >= 24 ? 3 : 4.5),
  ).length,
  performanceRuns,
  medians: Object.fromEntries(
    ["desktop", "mobile"].map((device) => [
      device,
      Object.fromEntries(
        ["performance", "accessibility", "LCP", "CLS", "TBT"].map((key) => [
          key,
          median(
            performanceRuns
              .filter((run) => run.device === device)
              .map((run) => run[key]),
          ),
        ]),
      ),
    ]),
  ),
  initialAssets: assets,
  note: "Lighthouse TBT is not INP. Sampled case contrast uses the paper token background; screenshot pixels are product evidence, not portfolio body text. Portrait/material contrast remains covered by separate sampling.",
};
await writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2));
await writeFile(
  `${durable}/audit-summary.json`,
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary.medians, null, 2));
if (summary.axeViolations || summary.caseContrastBelowAA) process.exitCode = 1;
