import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const summary=await read('docs/review/day07/final/summary.json');
const archive=await read('release/day07/package-verification.json');
const delivery=await read('docs/review/day07/package/package-delivery.json');
if(Object.values(summary.gates).some(pass=>!pass)||!archive.sourceRebuild.allBuildHashesMatch||
  !archive.originalApplicationUnchanged||Object.values(archive.archives).some(item=>!item.allExtractedHashesMatch)||
  delivery.responses.length!==70||delivery.smoke.length!==6||delivery.smoke.some(r=>r.errors.length))
  throw new Error('Cannot finalize: required recorded technical checks did not pass');
const now=new Date();
const time=now.toLocaleString('en-GB',{timeZone:'Asia/Kolkata',hour12:false});
const elapsed=Math.ceil((now.getTime()-Date.parse('2026-10-26T08:07:53Z'))/60000);
const review=`# Day 7 — verified local review candidate

${time} IST. **24/24 technical exercises complete through the authorized package branch. Final human visual/live-motion review and publication approval remain pending. Nothing is published; this is not a release-ready claim.** Existing 180-minute allocation started 26 October at 13:37:53 IST; approximately ${elapsed} minutes charged at this documentation checkpoint, with final metadata-integrity confirmation still inside the allowance. Hard boundary 16:37:53 IST. No October 30 or later-session time borrowed; amended project allowance stays 22 hours.

## Result and changes

Candidate **${summary.candidate}**. Final assets: index-DOi2xIuO.js / index-D_1qH5wR.css; animation-0z3debQN.js. Open the extracted static package at **http://127.0.0.1:4174/?review=day07**; original preview remains at http://127.0.0.1:4173/. Thirteen surfaces, nine chapters, native/reduced/continuous reading, colophon closing. Accepted design, artwork, all 64 public assets, attribution, dependency lockfile and native PageFlip geometry/timings are preserved.

The native adapter now lets the selected-chapter feedback paint before the first cover-to-chapter fold. This separates immediate feedback from cold native compositor/raster work, using two animation-frame callbacks. The same engine owns the actual turn. Latest queued requests still win; preference/reading/engine cleanup cancels pending frames. Two regressions cover queued commands during that gap and cancellation before native rendering. Crossfades now consume the approved --ease-in-out token rather than Motion's hard-coded easing, retaining the approved 200ms opacity transition.

Reproduced cold phone samples were 256/280/264ms, with click processing below 4ms; most delay preceded presentation. After the first fix: 88/112/96ms, with one warm 232ms outlier retained. On final frozen bytes: cold phone 112/136/136ms, warm phone 80ms, desktop 56/56ms. These short lab observations do **not** establish field INP or a universal response guarantee. Raw before/after/final samples and trace remain under review/day07/interaction-*.

README now describes the actual product, source/build/verification commands, delivery and evidence limits. New Day 7 verification/package tools write separate evidence without overwriting predecessors. Final source and site archives include actual third-party notices for bundled code/fonts; no dependency was added.

## Verification and provenance

| Check | Actual evidence |
|---|---|
| Entry reconciliation | All 227 Day 6 source/build manifest records freshly matched before edits; Gemini claims were not assumed |
| Final application identity | All 149 frozen source/public/config/lock/build records match after final checks; manifest in final/candidate-manifest.json |
| Production build/typecheck | PASS; failed sandbox initialization log retained, approved outside-sandbox build passes |
| Full regression | **137/137** on first-turn fix before token-only easing correction; pre-easing/playwright.json |
| Final affected regression | **32/32** focus/reading/reduced/preference/first-turn checks on final bytes; final/focused-playwright.json |
| Responsive geometry | **186/186**, 375/768/1280/1920px plus short windows, three modes; zero recorded overflow/folio collisions/runtime errors |
| Native browser zoom | **39/39** at actual isolated Chrome 200% page zoom, no recorded errors |
| Rendered contrast | **4,402** samples, complete page/mode coverage; minimum body 6.08:1, large text 4.29:1; thresholds met for each size |
| Axe | **42** states, zero automatic violations; incomplete checks retained, not WCAG certification |
| Native replay | **20 turns, six cancellations, two committed drags**; same engine/images, zero errors; video and compressed trace saved |
| Destinations/résumé | **23** links resolved or syntax-inspected mailto; no mail sent/live accounts mutated; PDF bytes/hash and download name pass |
| Static package delivery | **70/70** served files match expected bytes and MIME; six phone/desktop native/reduced/reading smoke states pass |
| Source recovery | Source ZIP extracted/hash-checked and rebuilt using existing installed dependencies; **69/69 build files reproduce exactly** |

The full 137-case pass is **not** a full rerun on final easing bytes. The final 32 cases cover the changed crossfade, focus/preference, reading and first-turn behavior; geometry, contrast, replay, zoom, Axe, loading, interactions and package smoke were then refreshed on final bytes. Baseline results are not relabelled as final. All application checks preserve the frozen identity; later source-archive documentation refresh is re-extracted/hash-checked and rebuilt, with authoritative results in package-verification.json.

### Loading and motion conditions

Three sequential desktop and three mobile Lighthouse 13.5 runs, Headless Chrome 155, localhost; no competing automated browser benchmark. Established desktop 1280×900, RTT40ms/10240Kbps/CPU×1; default mobile 412×823/DPR1.75, simulated150ms RTT/1638.4Kbps/CPU×4, storage reset. Raw resolved config/reports retained in final/lighthouse/.

| Profile | Performance / accessibility | Median LCP | CLS | Median TBT | Transfer |
|---|---:|---:|---:|---:|---:|
| Desktop | 100 / 100 | 0.565s | 0.000041 | 0ms | 267,286 bytes |
| Mobile | 97 / 100 | 2.471s | 0 | 30.5ms | 231,384 bytes |

All three mobile observations were below 2.5s (2.453–2.475s); headroom is small. These are lab measurements, not hosted/field guarantees. TBT is not INP. Dedicated animation vendor chunk: **13,285 bytes gzip** (native PageFlip and Motion); project interaction code is in the main application chunk. Portrait 104,388 bytes; texture 19,866 bytes. All 64 public files and lockfile remain byte-identical to the predecessor.

Native video/trace recorded RAF median20.8ms/p95 21.1ms/max62.5ms on headless Edge156.0.4314.42 at1280×900. Those instrumented intervals are diagnostic and do not establish sustained physical-device60fps. Physical hardware inventory was not established. Required visual layouts and representative opening/supporting/reference/phone captures were inspected; human acceptance remains yours.

## Packages and content review

Static ZIP: release/day07/engineering-atlas-site.zip. Source ZIP: release/day07/engineering-atlas-source.zip. Exact file hashes, final archive hashes, extraction counts and source-rebuild result are recorded in **release/day07/package-manifest.json**, **package-verification.json** and **SHA256SUMS.txt**. See DAY-07-DELIVERY.md for exact commands and recovery notes. The source is a deliberate allowlist, not a blanket workspace archive. Fresh online npm ci was not performed; the rebuild used unchanged saved dependencies already installed in the workspace.

The six full-resolution Vault captures, legacy workspace/dialog and original reviewer portrait were inspected. Demo fixtures/author identities are intentional; the user-directory image is cropped to the intended demo account. No credentials/private customer records were observed. Responsive derivatives remain hash-identical; imagery was not edited/recaptured. Raw private evidence, account configuration, .env, Git metadata, node_modules, unrelated projects and live-account scripts are excluded from source/site distributions.

## Pending gates and end review

No host/public origin is selected. Canonical/og:url/absolute social imagery, actual HTTPS/headers/cache/compression/CSP and hosted-path checks remain dependent on a separately authorized destination. Inline stylesheet hash: **${summary.styleCspHash}**. That hash covers the stylesheet only; native engine inline style attributes require actual host-policy testing. No deployment, push, DNS/resource change, external message or model switch occurred.

Field INP, sustained physical-device60fps, manual screen-reader and Safari/Firefox/physical-device coverage remain unmeasured. Day 3 production-UI move/source-removal/returned-hash and exact capture-framing gaps remain unchanged; copies are not moves. Preserve ProCodrr/personal-extension attribution, private Harigurus-source disclosure, public-versus-local lab maturity and authentic references. See review/day07/defects.json and DAY-07-BACKLOG.md.

Please review: (1) cover/first turn plus reverse/cancel, (2) all chapters and reference portraits/copy, (3) Reading mode/return and phone scrolling, (4) résumé/contact. Record approval or concrete corrections against ${summary.candidate}. Visual/live-motion acceptance and publication approval are separate from technical checklist completion. **readyForPublication remains false.**
`;
await writeFile('docs/DAY-07-REVIEW.md',review);
await writeFile('docs/DAY-07-BACKLOG.md',`# Day 7 — decisions and remaining work\n\nCandidate ${summary.candidate}. All 24 technical exercises use the authorized package fallback. No new feature scope is opened.\n\n## Release decisions / evidence gates\n\n- Pending user visual/live-motion review of the exact preview and replay; record actual acceptance/corrections. Day 5 acceptance is historical, not approval of this candidate.\n- Publication authorization pending. No host/origin selected; choose only after explicit authorization, then set actual URL metadata and verify HTTPS, paths, MIME, compression/cache, CSP including inline attributes, résumé and served bytes.\n- Field INP and sustained physical-device60fps unmeasured; short EventTiming/RAF/TBT are not substitutes. Cold lab feedback improved, but preserved warm outlier and limited LCP margin remain useful follow-ups.\n- Manual screen-reader, Safari/Firefox and physical-device checks not performed. Automatic Axe and synthetic touch/zoom do not establish them.\n\n## Preserved factual evidence boundaries\n\nDay 3 move/source-removal/returned-byte hash and exact capture framing remain incomplete; earlier API copies do not prove moves. Keep genuine imagery, course/personal authorship, private Harigurus-source disclosure, local lab WIP and faithful historical quotes. No live-account work was authorized here.\n\n## Optional future work\n\nFresh online dependency installation of the source ZIP was not verified; existing installed dependencies rebuilt the source exactly. Broader cross-device observations and hosted monitoring require actual access/scope. No redesign, replacement engine, new backend, decorative feature, dependency migration or extra session is scheduled by this backlog. October30 stays off.\n`);
let instructions=await readFile('docs/DAY-07-DELIVERY.md','utf8');
instructions=instructions.replace('Actual packaging results will be recorded before handoff; planned paths below are not yet evidence that files exist.',
  'Both packages exist and passed extraction/hash and local delivery/rebuild checks. Final archive hashes and any documentation-refresh recheck are authoritative in package-verification.json and SHA256SUMS.txt.');
instructions+=`\n## Verified outcome\n\nCandidate **${summary.candidate}**. Seventy site files served with matching SHA-256/MIME; six native/reduced/reading phone/desktop smoke states pass. The source rebuild reproduces all69 website files exactly on Node24.11.1 with existing dependencies; a fresh online installation is not claimed. All149 original application records remain unchanged through verification. Final source documentation is refreshed, re-extracted/hash-checked and rebuilt before handoff; earlier source-checkpoint archive/manifest remain under docs/review/day07/package/. Read the accompanying package-verification.json for exact current ZIP hashes and counts.\n\nThe source ZIP preserves an explicit code/config/public/tests/verification/documentation checkpoint; raw evidence is kept outside the distribution. The final review, delivery notes, backlog and JSON verification accompany the archives. No publication approval is inferred. Inline stylesheet CSP hash: ${summary.styleCspHash}; that is not a complete policy for native engine inline style attributes.\n`;
await writeFile('docs/DAY-07-DELIVERY.md',instructions);
let readme=await readFile('README.md','utf8');
readme=readme.replace('Day 7 is producing a local review candidate and verified packages.',
  'Day 7’s 24 technical exercises are complete, including verified local site/source packages.');
await writeFile('README.md',readme);
await mkdir('docs/review/day07/checkpoint-history',{recursive:true});
for(const path of ['HANDOFF.md','PROJECT-STATUS.md','PORTFOLIO-ROADMAP.md'])
  await copyFile(path,`docs/review/day07/checkpoint-history/${path}-before-final`);
const handoff=`# Engineering Atlas — Day 7 final handoff\n\n${time} IST. **Day7 technical24/24 complete; final user visual/live-motion review and publication approval pending.** Candidate **${summary.candidate}**. No publication/push/DNS/hosting resource or live-account mutation. No release-ready claim.\n\n## Read next\n\n1. AGENTS.md and the Engineering Atlas skill/complete references before any UI change.\n2. docs/DAY-07-REVIEW.md, docs/DAY-07-DELIVERY.md and docs/DAY-07-BACKLOG.md.\n3. docs/review/day07/final/candidate-manifest.json, summary.json and docs/review/day07/defects.json.\n4. release/day07/package-manifest.json, package-verification.json and SHA256SUMS.txt for final archive identities and extraction/rebuild outcome. Raw evidence accompanies this workspace, not the allowlisted source distribution.\n\n## Deliverable\n\nVerified extracted-site preview **http://127.0.0.1:4174/?review=day07**. Original4173 preview preserved. New preview owns a separate loopback port; no takeover. Reproduce with the command in delivery notes; old terminal IDs are not resumption mechanisms. Static/source ZIPs are under release/day07/.\n\nFirst cover-to-chapter feedback paints before native rendering; queued requests and mode/preference cancellation remain valid. Crossfade easing now reads the approved token. Native engine, fold timing, accepted design and all64 public assets/lockfile preserved. Source/build frozen at149 records. Final source-doc archive refresh is independently verified in package-verification.json; no app changes are involved.\n\n## Evidence\n\n137/137 full cases before token-only crossfade easing correction;32/32 final affected checks.186/186 geometry;39/39 actual200% zoom;4402 rendered contrast samples (body min6.08, large4.29);42 Axe states zero automatic violations.20 turns/6 cancellations/2 drags same engine/images.23 destinations resolved/mailto inspected;70 exact served package files and6 smoke states. Source rebuild reproduces69/69 build bytes. Final medians desktop100/100 LCP0.565s; mobile97/100 LCP2.471s, CLS0. Raw profiles/variability retained; no field/60fps/WCAG claim.\n\n## Next bounded action\n\nUser reviews cover/turn/reversal, chapters/references, reading/return/phone scrolling and résumé/contact. Record actual approval or corrections against this candidate. Do not publish until separately authorized and applicable gates resolved. Host/origin/URL metadata and hosted checks pending; field INP/physical60fps/manual screen-reader/Safari/Firefox/devices unmeasured. Day3 UI move/hash/framing limits retained.\n\n## Budget and recovery\n\nExisting Day7 allocation began26October13:37:53IST, ends16:37:53IST. Approximately${elapsed}minutes at this checkpoint; final metadata confirmation remains inside it.22-hour project allowance and October30 off unchanged; unused time is not an extra session. Source ZIP is recovery checkpoint; no Git commit/SHA claimed, no blanket staging/reset/clean. Latest usage snapshot31% five-hour/5% weekly is shared-account historical data. Prior checkpoints are in docs/review/day07/checkpoint-history/ and entry/. User controls model switching.\n`;
await writeFile('HANDOFF.md',handoff);
await writeFile('PROJECT-STATUS.md',handoff.replace('# Engineering Atlas — Day 7 final handoff','# Engineering Atlas — project status'));
let roadmap=await readFile('PORTFOLIO-ROADMAP.md','utf8');
const marker='<!-- DAY07_CURRENT_END -->';
if(roadmap.startsWith('# Engineering Atlas — Day 7')&&roadmap.includes(marker))roadmap=roadmap.slice(roadmap.indexOf(marker)+marker.length).trimStart();
await writeFile('PORTFOLIO-ROADMAP.md',`# Engineering Atlas — latest roadmap checkpoint\n\n${time}IST: **Day7 technical24/24 complete through verified-package branch**, candidate ${summary.candidate}. Final human visual/live-motion review and publication remain pending. All measured automatic gates pass; field/device/manual/host gates remain explicitly open. Final review: docs/DAY-07-REVIEW.md; delivery/recovery: docs/DAY-07-DELIVERY.md; backlog: docs/DAY-07-BACKLOG.md. Existing180-minute allocation only, approximately${elapsed}minutes at checkpoint; hard boundary16:37:53IST.22-hour amended allowance; October30 off. No publishing, push, DNS, hosting selection or extra session.\n\n## Historical schedule and records\n\n`+roadmap);
let plan=await readFile('docs/DAY-07.md','utf8');
plan=plan.replace(/^(\| 7\.[1-4]\.[1-6] \| [^\n]+ \| )(?:Pending|Complete) \|$/gm,(_,prefix)=>prefix+'Complete |');
plan=plan.replace(/^(\| 7\.[1-4] \| [^\n]+ \| )Pending \|$/gm,(_,prefix)=>prefix+'Complete |');
plan=plan.replace('# Day 7 — fix, release and hand off',`# Day 7 — fix, release and hand off\n\n**Technical24/24 complete (${time}IST), verified-package branch. User review/publication approval and unmeasured gates remain pending; not release-ready.** Final record: docs/DAY-07-REVIEW.md. Task7.3.2 is the prepared end-review brief, not fabricated human acceptance. Task7.3.3 records missing host/origin; task7.3.4 uses package fallback; task7.4 recovery reserve verifies extraction/rebuild/integrity rather than adding scope.`);
await writeFile('docs/DAY-07.md',plan);
const completed=Array.from({length:4},(_,phase)=>Array.from({length:6},(_,i)=>`7.${phase+1}.${i+1}`)).flat();
await writeFile('docs/review/day07/progress.json',JSON.stringify({date:now.toISOString(),start:'2026-10-26T08:07:53Z',hardBoundary:'2026-10-26T11:07:53Z',completed,
  operation:'Technical checks/package branch complete; final source-document archive refresh and integrity confirmation in progress before opening user preview.',
  next:'Inspect final archive verification, open extracted-site preview and hand off user review.',candidate:summary.candidate,publicationAuthorized:false,humanReview:'pending',
  limits:summary.unmeasured,elapsedMinutesAtDocumentationCheckpoint:elapsed},null,2)+'\n');
console.log(JSON.stringify({candidate:summary.candidate,completed:completed.length,elapsedMinutes:elapsed,publicationAuthorized:false}));
