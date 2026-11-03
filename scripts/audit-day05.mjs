import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
const output = "tmp/audits/day05";
const durable = "docs/review/day05";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
await mkdir(output, { recursive: true });
await mkdir(durable, { recursive: true });
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
        userAgent:lhr.userAgent,
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
  profiles:
    "Three runs/profile; Chrome localhost; default mobile simulation and historical desktop profile",
  performanceRuns,
  medians: Object.fromEntries(
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
          median(
            performanceRuns
              .filter((run) => run.device === device)
              .map((run) => run[key]),
          ),
        ]),
      ),
    ]),
  ),
  note: "TBT is not INP; mobile LCP and sustained 60fps are independent targets.",
};
await writeFile(
  durable + "/audit-summary.json",
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary.medians, null, 2));
