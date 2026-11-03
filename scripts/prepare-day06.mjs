import { readFile, writeFile } from "node:fs/promises";
import { pages } from "../src/data/portfolio.ts";
import { output, identities, manifest, json } from "./day06-common.mjs";

const previous = JSON.parse(await readFile("docs/review/day05/final-source.json", "utf8"));
const current = await identities(previous.records.map((record) => record.path));
const matches = current.map((record) => ({ ...record, matches: previous.records.find((p) => p.path === record.path).sha256 === record.sha256 }));
if (matches.some((record) => !record.matches)) throw new Error("Day 5 baseline identity mismatch");
await json("baseline", { date: new Date().toISOString(), pages, matches,
  presentation: ["native", "reduced paginated", "continuous reading"],
  closing: "colophon; no separate back cover", day5Accepted: "26 October 2026 00:11 IST",
  limits: ["Mobile LCP 2.943s exceeds target", "field INP and sustained 60fps unmeasured", "Day 3 UI move/hash/framing incomplete"] });
await manifest();
await writeFile(`${output}/baseline.md`, "# Day 6 entry baseline\n\nDay 5 accepted; 13/13 recorded source/build hashes freshly match. Thirteen registered surfaces, nine chapters, native/reduced/continuous-reading modes, colophon closing. Existing preview responds in DevTools. Detailed identities in baseline.json and manifest.json. Prior results are historical, not freshly rerun. No public origin selected.\n");
let geometry = await readFile("scripts/review-day05.mjs", "utf8");
geometry = geometry.replace('const output = "docs/review/day05";', 'import { output } from "./day06-common.mjs";').replaceAll("DAY05_WIDTH", "DAY06_WIDTH");
geometry = geometry.replace('if (failures.length || errors.length) process.exitCode = 1;', 'const expected = records.length > 0 && records.every((r) => r.faces.length > 0) && pages.every((p) => records.some((r) => r.faces.some((f) => f.id === p.id)));\nif (!expected || failures.length || errors.length) process.exitCode = 1;');
await writeFile("scripts/review-day06.mjs", geometry);
for (const [source, target] of [["record-day05-turns", "record-day06-turns"], ["check-day05-zoom", "check-day06-zoom"]]) {
  let code = await readFile(`scripts/${source}.mjs`, "utf8");
  code = 'import { run } from "./day06-common.mjs";\n' + code.replaceAll('"docs/review/day05"', '`docs/review/day06/${run}`').replaceAll('"docs/review/day05/', '`docs/review/day06/${run}/');
  // Handle literal output strings without altering established traversal logic.
  code = code.replace(/`docs\/review\/day06\/\$\{run\}\/([^"\n]+)"/g, '`docs/review/day06/${run}/$1`');
  code = code.replaceAll("tmp/day05/", "tmp/day06/${run}/").replace(/"tmp\/day06\/\$\{run\}\/([^"\n]+)"/g, '`tmp/day06/${run}/$1`');
  await writeFile(`scripts/${target}.mjs`, code);
}
await json("coverage-plan", { widths: [375,768,1280,1920], supplemental: [[375,600],[1280,720]], modes: ["native","reduced","reading"], pageIds: pages.map((p) => p.id), expectedGeometryStates: 186 });
await writeFile("docs/review/day06/progress.json", JSON.stringify({ completed: ["6.1.1", "6.1.2"],
  summary: "Day 5 accepted baseline reconciled: 13/13 source/build identities match; thirteen surfaces and three presentations. Isolated geometry/replay/zoom adapters prepared; historical evidence retained.",
  operation: "Production build, followed by full baseline browser regression and responsive checks.",
  next: "Inspect actual browser/geometry results, triage failures, then isolate loading measurements and investigate mobile LCP.",
  limits: "Review deferred to the final boundary as requested. Field INP/60fps/manual-device checks and Day 3 move/hash limits remain; no deployment." }, null, 2));
console.log(JSON.stringify({ baselineMatches: matches.length, pageCount: pages.length, output }));
