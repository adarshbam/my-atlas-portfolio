# Day 7 — fix, release and hand off

**Technical24/24 complete (26/10/2026, 14:38:21IST), verified-package branch. User review/publication approval and unmeasured gates remain pending; not release-ready.** Final record: docs/DAY-07-REVIEW.md. Task7.3.2 is the prepared end-review brief, not fabricated human acceptance. Task7.3.3 records missing host/origin; task7.3.4 uses package fallback; task7.4 recovery reserve verifies extraction/rebuild/integrity rather than adding scope.

Started **26 October 2026, 13:37:53 IST**, under the user's explicit continuous-execution authorization. Work all 24 exercises back to back; human visual/live-motion review is deferred to the end. Package fallback is selected: **no deployment, push, DNS or hosting resources**. Live progress is recorded in `docs/review/day07/progress.json` and `docs/DAY-07-REVIEW.md`.

The user started the existing Day 7 session early on 26 October. Use the existing **180 minutes**: 60 + 30 + 45 + 45, ending no later than **16:37:53 IST**. The amended project allowance remains 22 hours; **30 October stays off**. This is not an additional session. The user's latest instruction supersedes the one-exercise default and older Day 6-review-before-Day-7 sequencing; approval itself remains pending.

## Entry and first action

Read `HANDOFF.md`, `PROJECT-STATUS.md`, the completed Day 5/6 reviews and defect list, this plan and `docs/DAY-07-PREPARATION.md`. Before any UI fix, read the Engineering Atlas skill, complete design constraints/reconciliation and current tokens.

**First bounded action: 7.1.1, up to 10 minutes.** Reconcile the actual Day 6 candidate, source/build identity, completed checks, outstanding defects and user acceptance. Record those facts in `docs/DAY-07-REVIEW.md` before changing anything. If Day 6 has not produced a candidate, record that dependency and prepare the available package/status honestly; do not assume it passed or absorb unfinished feature work into this session.

At entry Day 5 is complete/accepted and Day 6's thirteen-page LCP revision is technically verified. All 227 predecessor manifest records freshly match. Preserve earlier evidence, pending approval and the native book; Day 7 writes separate outputs. Reread shared checkpoints before updating them.

## Saved allocation

| Phase | Minutes | Deliverable | State |
|---|---:|---|---|
| 7.1 | 60 | Reproduce and resolve release blockers from the Day 6 candidate | Complete |
| 7.2 | 30 | Final desktop, phone, keyboard and reduced-motion smoke evidence | Complete |
| 7.3 | 45 | Concrete release review; approved publication or verified deployable package | Complete |
| 7.4 | 45 | Source/package checkpoint, operating notes, recovery and future backlog | Complete |

The final 30 minutes of 7.4 are the launch recovery, retest and handoff reserve **inside** the 180 minutes. Do not spend them on optional features. If a fix or deployment exceeds its time box, retain the last known candidate, record the blocker and use the package fallback. No silent deadline extension or October 30 catch-up.

## 7.1 — release blockers only

| Exercise | Minutes | Output and acceptance | State |
|---|---:|---|---|
| 7.1.1 | 10 | Establish actual Day 6 source/build identity and defect baseline; distinguish passed, failed, blocked and unmeasured evidence | Complete |
| 7.1.2 | 10 | Reproduce and rank launch blockers; record expected/observed behavior, affected route/mode and test evidence; defer feature requests | Complete |
| 7.1.3 | 10 | Fix the highest-priority reproduced blocker using existing tokens, templates and native engine; save the exact change | Complete |
| 7.1.4 | 10 | Resolve the next bounded blocker or finish the first; if blocked, preserve a reproducible report instead of speculative redesign | Complete |
| 7.1.5 | 10 | Build and run affected regressions; after UI changes check 375/768/1280/1920px and reduced motion, retaining failures and corrected results | Complete |
| 7.1.6 | 10 | Identify the candidate to smoke-test, classify remaining release gates and save checkpoint; unmet mandatory budgets remain failures unless explicitly amended | Complete |

No new pages, turn engine, portrait, effects, dependency migration or unrelated project changes. Preserve factual ownership, course attribution, published/local lab distinctions and existing evidence disclosures.

## 7.2 — final candidate smoke

| Exercise | Minutes | Output and acceptance | State |
|---|---:|---|---|
| 7.2.1 | 5 | Check final build identity and exercise cover → contents → all projects → colophon at required widths; no clipped content, page-wide overflow or runtime errors | Complete |
| 7.2.2 | 5 | Replay desktop native forward/back, boundaries, repeated input and drag cancellation; record continuous movement separately from static approval | Complete |
| 7.2.3 | 5 | Check phone touch/swipe, ordinary vertical scrolling, diagram input and reading/book position at 375px plus targeted 360/390px | Complete |
| 7.2.4 | 5 | Traverse keyboard destinations and visible focus; check hidden-page exclusion, settled announcement, reading mode and system reduced motion | Complete |
| 7.2.5 | 5 | Verify all project/profile/source destinations, résumé response/download/hash and email href; inspect metadata/icons without sending mail or mutating live demos | Complete |
| 7.2.6 | 5 | Save final smoke results with source/build hashes, browser/profile and evidence paths; reconcile Day 6 budgets and any affected reruns before release review | Complete |

If a smoke check fails, the candidate has not passed. Correct within remaining allowance and repeat affected checks; evidence from another build does not clear the failure. Day 6 supplies broader loading/accessibility measurements. Refresh those measurements when a Day 7 change affects them; do not assume a full audit fits a five-minute exercise.

## 7.3 — release review and publication branch

| Exercise | Minutes | Output and acceptance | State |
|---|---:|---|---|
| 7.3.1 | 5 | Assemble reviewable preview/package, candidate identity, changes, gate results and known limitations; verify intended public assets contain no private data | Complete |
| 7.3.2 | 7 | Prepare the concrete candidate/preview brief for the user's end review; explicitly record approval pending and continue the authorized package branch | Complete |
| 7.3.3 | 8 | Record the unresolved host/origin and root-path assumptions; prepare exact local build/output/recovery instructions without selecting a host or creating resources | Complete |
| 7.3.4 | 10 | Create the reviewed static `dist` candidate package and verification manifest; no publication under this execution authorization | Complete |
| 7.3.5 | 8 | Extract the package to a fresh directory and serve/check its actual bytes locally, including assets, navigation, résumé/contact and console | Complete |
| 7.3.6 | 7 | Record live versus packaged versus blocked result, exact identity/URL or package path/hash, checks and any failure/recovery action | Complete |

Publishing is conditional in the roadmap: “Publishing happens after the reviewed result is approved.” Preparing Day 7 is not that approval. A prior Vault design approval is not final-release approval. Do all independent preparation first; if approval is still absent, deliver the package with publication pending. Do not wait indefinitely or claim the site is live. If a mandatory quality gate remains failed, deliver a candidate package with that blocker rather than calling it release-ready.

## 7.4 — recovery and durable handoff

| Exercise | Minutes | Output and acceptance | State |
|---|---:|---|---|
| 7.4.1 | 5 | Save a recoverable source checkpoint or allowlisted source archive; inspect Git state first and record an actual commit only if created successfully | Complete |
| 7.4.2 | 5 | Update README with current pages, setup/build/preview, exact artifact/live location and hosting instructions or unresolved hosting dependency | Complete |
| 7.4.3 | 5 | Save final decisions and prioritized backlog; separate mandatory failed gates from optional future improvements and unmeasured field behavior | Complete |
| 7.4.4 | 10 | Use recovery reserve for reproduced launch/package failure; preserve candidate and evidence, restore only an identified previously working release when applicable | Complete |
| 7.4.5 | 10 | Recheck affected public/local delivery after recovery; verify package/served hashes and retain the failed attempt plus final result | Complete |
| 7.4.6 | 10 | Finish Day 7 review and update handoff/status/roadmap with honest counts, paths, approval/deployment status, unresolved work and next bounded action | Complete |

If no recovery is needed, use the reserve for package integrity and documentation checks, then finish early. Do not fill it with new scope. Keep credentials, account config, `.env`, private/customer data, `node_modules` and private review artifacts out of distributable packages. No blanket staging, reset/clean, fabricated SHA or unsolicited repository push.

## Exit evidence

- The final candidate has an identifiable source snapshot and build manifest; final verification names that same candidate. Preserve the exact deployed/package bytes.
- Required interactions, responsive widths, reduced motion, focus, announcements, contact and résumé delivery are checked. Continuous motion and human acceptance remain separate from automated reliability.
- Required targets are assessed honestly: LCP <2.5s, CLS <0.05, INP <200ms, animation JS ≤60KB gzip, portrait ≤200KB, texture ≤30KB, Lighthouse Performance ≥90 / Accessibility ≥95, and sustained 60fps. Lab proxies do not establish field INP or sustained frame rate. No implicit exception for a missed target.
- Public result is verified at its real URL only after authorized publication. Otherwise return the verified package with exact hosting/approval/quality blockers; distinguish a deployable release from an unfinished candidate.
- README, review, decisions/backlog and continuation files permit another session to resume without chat history. Record actual elapsed budget and all uncompleted exercises; checklist progress is not proof of release acceptance.

## Preparation checkpoint

25 October 2026: prepared four blocks, 24 pending exercises and the release/package branches. Source-based findings and later commands are in `docs/DAY-07-PREPARATION.md`. No source/test changes, build, audit, browser/server launch, package creation or deployment occurred. Day 7 remains **0/24**. Next execution action is **7.1.1**, after a real Day 6 candidate is available and Day 7 execution is requested.
