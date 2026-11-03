import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { output, identities, json } from "./day06-common.mjs";

const read = async (name) => JSON.parse(await readFile(`${output}/${name}.json`, "utf8"));
const [frozen, tests, geometry, replay, contrast, axe, zoom, loading, destinations] = await Promise.all([
  read("manifest"), read("playwright"), read("geometry"), read("motion-summary"),
  read("contrast-summary"), read("axe-summary"), read("zoom-200"), read("loading-summary"), read("destinations"),
]);
const current = await identities(frozen.records.map((record) => record.path));
const drift = current.filter((record) => frozen.records.find((r) => r.path === record.path).sha256 !== record.sha256);
if (drift.length) throw new Error(`Frozen candidate changed: ${drift.map((r) => r.path).join(", ")}`);
const baseline = JSON.parse(await readFile("docs/review/day06/baseline/manifest.json", "utf8"));
const assets = current.filter((record) => record.path.startsWith("public/"));
const changedAssets = assets.filter((record) => baseline.records.find((r) => r.path === record.path)?.sha256 !== record.sha256);
const html = await readFile("dist/index.html", "utf8");
const cssRecord = current.find((record) => record.path.startsWith("dist/assets/") && record.path.endsWith(".css"));
const css = await readFile(cssRecord.path, "utf8");
const inlineCSS = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const animation = current.filter((record) => /dist\/assets\/animation-.*\.js$/.test(record.path));
const budgets = {
  animationGzipBytes: animation.reduce((sum, record) => sum + record.gzipBytes, 0),
  portraitBytes: current.find((record) => record.path === "public/images/editorial-portrait-960.webp").bytes,
  textureBytes: current.find((record) => record.path === "public/images/book-fiber.webp").bytes,
};
const app = current.filter((record) => record.path.startsWith("src/") || record.path.startsWith("dist/assets/") || ["dist/index.html","index.html","vite.config.ts","package-lock.json"].includes(record.path));
const failures = geometry.records.filter((r) => r.overflow || r.faces.some((f) => !f.contentBeforeFolio || r.width >= 768 && (!f.contained || !f.folioInside)));
const passed = {
  regression: tests.stats.unexpected === 0 && tests.stats.flaky === 0 && tests.stats.skipped === 0 && tests.stats.expected >= 134,
  geometry: geometry.records.length === 186 && !geometry.errors.length && !failures.length,
  replay: replay.sameEngine && replay.imagesAttached && replay.alternatingTurns === 20 && !replay.errors.length,
  contrast: contrast.samples > 0 && contrast.completePageModeCoverage && !contrast.failures.length,
  axe: axe.completePageCoverage && axe.states > 0 && axe.violations === 0,
  zoom: zoom.records.length === 39 && !zoom.errors.length,
  exactInlineCSS: inlineCSS === css.replace(/<\/style/gi,"<\\/style"),
  assetsPreserved: assets.length === 64 && changedAssets.length === 0,
  animation: budgets.animationGzipBytes <= 60_000,
  portrait: budgets.portraitBytes <= 200_000,
  texture: budgets.textureBytes <= 30_000,
};
const summary = {
  date: new Date().toISOString(), candidate: "day06-local-review-candidate", sourceAndBuildUnchangedDuringFinalChecks: !drift.length,
  app, passed, regression: tests.stats, responsiveStates: geometry.records.length,
  contrast, axe, zoomStates: zoom.records.length, replay, loading: { medians: loading.medians, gates: loading.gates }, budgets,
  assets: { count: assets.length, changed: changedAssets },
  destinations: { total: destinations.length, unresolved: destinations.filter((r) => r.state.includes("unresolved") || r.state.includes("failure")) },
  styleHash: inlineCSS ? `sha256-${createHash("sha256").update(inlineCSS).digest("base64")}` : null,
  humanReview: "pending; reserved for final boundary by user", handoff: "prepared; final Day 7 handoff waits for review",
  publicOrigin: "not selected; canonical/og:url/absolute social image pending",
  unmeasured: ["field INP", "sustained physical-device 60fps", "manual screen-reader", "Safari/Firefox/physical devices"],
  preservedLimits: "Day 3 production-UI move/source-removal/returned-hash and exact capture-framing gaps remain.",
  publicationAuthorized: false, readyForPublication: false,
  qualityNote: "A successful automated suite is distinct from the failed mobile LCP gate, unmeasured field/physical-device targets and final human acceptance.",
};
await json("summary", summary);
await json("candidate-manifest", { ...frozen, finalVerifiedAt: summary.date, app, sourceAndBuildUnchangedDuringFinalChecks: true, evidence: ["playwright.json","geometry.json","contrast.json","contrast-summary.json","axe.json","axe-summary.json","zoom-200.json","motion-summary.json","motion-trace.json.gz","loading-summary.json","lighthouse/","destinations.json","summary.json"], review: summary.humanReview, handoff: summary.handoff, publicationAuthorized: false });
const defects = JSON.parse(await readFile("docs/review/day06/defects.json","utf8"));
const lcp = defects.find((d) => d.id === "D6-LCP");
lcp.class = "fresh measured target result";
lcp.observed = `Final mobile median LCP ${loading.medians.mobile.LCP.toFixed(1)}ms; P${loading.medians.mobile.performance}/A${loading.medians.mobile.accessibility}`;
lcp.status = loading.gates.mobile.LCP ? "passed" : "failed required target";
lcp.next = "Day 7: reproduce on this exact candidate/profile; address within existing blocker allocation, without changing measurement conditions or claiming readiness.";
await writeFile("docs/review/day06/defects.json", JSON.stringify(defects,null,2)+"\n");
console.log(JSON.stringify({ passed, regression: tests.stats, responsiveStates: geometry.records.length, contrastSamples: contrast.samples, axeStates: axe.states, loading: loading.medians, readyForPublication: false },null,2));
if (Object.values(passed).some((pass) => !pass)) process.exitCode=1;
