# Day 7 — verified local review candidate

26/10/2026, 14:38:21 IST. **24/24 technical exercises complete through the authorized package branch. Final human visual/live-motion review and publication approval remain pending. Nothing is published; this is not a release-ready claim.** Existing 180-minute allocation started 26 October at 13:37:53 IST; approximately 61 minutes charged at this documentation checkpoint, with final metadata-integrity confirmation still inside the allowance. Hard boundary 16:37:53 IST. No October 30 or later-session time borrowed; amended project allowance stays 22 hours.

## Result and changes

Candidate **day07-366c0e60bdd7**. Final assets: index-DOi2xIuO.js / index-D_1qH5wR.css; animation-0z3debQN.js. Open the extracted static package at **http://127.0.0.1:4174/?review=day07**; original preview remains at http://127.0.0.1:4173/. Thirteen surfaces, nine chapters, native/reduced/continuous reading, colophon closing. Accepted design, artwork, all 64 public assets, attribution, dependency lockfile and native PageFlip geometry/timings are preserved.

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

No host/public origin is selected. Canonical/og:url/absolute social imagery, actual HTTPS/headers/cache/compression/CSP and hosted-path checks remain dependent on a separately authorized destination. Inline stylesheet hash: **sha256-r+Qar5ZdErn4i2VKs88ffLPrgzQ5u3wBPtkTf/MgV2o=**. That hash covers the stylesheet only; native engine inline style attributes require actual host-policy testing. No deployment, push, DNS/resource change, external message or model switch occurred.

Field INP, sustained physical-device60fps, manual screen-reader and Safari/Firefox/physical-device coverage remain unmeasured. Day 3 production-UI move/source-removal/returned-hash and exact capture-framing gaps remain unchanged; copies are not moves. Preserve ProCodrr/personal-extension attribution, private Harigurus-source disclosure, public-versus-local lab maturity and authentic references. See review/day07/defects.json and DAY-07-BACKLOG.md.

Please review: (1) cover/first turn plus reverse/cancel, (2) all chapters and reference portraits/copy, (3) Reading mode/return and phone scrolling, (4) résumé/contact. Record approval or concrete corrections against day07-366c0e60bdd7. Visual/live-motion acceptance and publication approval are separate from technical checklist completion. **readyForPublication remains false.**
