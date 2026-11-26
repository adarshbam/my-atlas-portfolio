// Compares a Playwright JSON report with the pre-change baseline, test by test.
// Usage: node scripts/compare-with-baseline.mjs <report.json> [summary-out.json]
// Baseline: docs/review/front-run/baseline-summary.json (the old site, 22 November 2026).
// Prints every failure that is NOT in the baseline, with its first error lines, and the totals.
// Exit code 0 always: read the output.
import { readFileSync, writeFileSync } from "node:fs";

const [report, summaryOut] = process.argv.slice(2);
if (!report) throw new Error("usage: node scripts/compare-with-baseline.mjs <report.json> [summary-out.json]");
const run = JSON.parse(readFileSync(report, "utf8"));
const base = JSON.parse(readFileSync("docs/review/front-run/baseline-summary.json", "utf8"));
const strip = (text) => text.replace(/\u001b\[[0-9;]*m/g, "");
const out = {};

const walk = (suite, file) => {
  const name = file || suite.file;
  for (const spec of suite.specs || []) {
    out[name] ??= { pass: 0, fail: 0, skip: 0, failed: [], errors: {} };
    for (const test of spec.tests) {
      if (test.status === "expected") out[name].pass++;
      else if (test.status === "skipped") out[name].skip++;
      else {
        out[name].fail++;
        out[name].failed.push(spec.title);
        const error = test.results.at(-1)?.error || {};
        out[name].errors[spec.title] = `${error.location?.line ?? "?"}: ${strip(error.message || "").split("\n").filter(Boolean).slice(0, 6).join(" | ").slice(0, 500)}`;
      }
    }
  }
  for (const child of suite.suites || []) walk(child, name);
};
for (const suite of run.suites) walk(suite, suite.file);
if (summaryOut) writeFileSync(summaryOut, JSON.stringify(out, null, 1));

let pass = 0;
let fail = 0;
let fresh = 0;
for (const [file, result] of Object.entries(out)) {
  pass += result.pass;
  fail += result.fail;
  const before = base[file];
  const newFails = result.failed.filter((title) => !(before?.failed || []).includes(title));
  fresh += newFails.length;
  if (!newFails.length && before) continue;
  console.log(`${file.padEnd(36)} ${result.pass}p ${result.fail}f ${before ? `(baseline ${before.pass}p ${before.fail}f)` : "(not in baseline)"}`);
  for (const title of newFails) console.log(`    NEW FAIL: ${title.slice(0, 100)}\n       ${result.errors[title]}`);
}
console.log(`TOTAL ${pass} pass, ${fail} fail; failures not in the baseline: ${fresh}`);
