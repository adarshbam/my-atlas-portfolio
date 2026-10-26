# Day 7 preparation — release evidence and delivery

Prepared 25 October 2026. This is a repository-read preparation report, **not a release audit**. Read `docs/DAY-07.md` for the 24-exercise checklist and fixed 180-minute allocation on 31 October, 14:00–17:00 IST. October 30 remains off; project allowance stays 22 hours including the approved Day 3 revision.

## Observed baseline

At inspection, Day 4 is still finishing final verification in another chat. Its latest checkpoints record 27 affected browser cases, 96 responsive states and 763 painted-glyph samples passing after the body-leading correction; final settled captures/Axe/Lighthouse remain under that chat’s ownership. Those are saved reports, not checks performed here. Day 5 is prepared at `docs/DAY-05.md` / `docs/DAY-05-PREPARATION.md`, execution 0/24. No Day 6 plan/review was found in this read. Do not infer Day 5/6 completion from Day 7 preparation.

| Repository evidence | Day 7 implication |
|---|---|
| `src/data/portfolio.ts` has 11 stable page IDs ending in `colophon`; roadmap describes up to 12 surfaces with a separate back cover | Import Day 5’s actual scope resolution; do not invent a closing page on launch day |
| `package.json`: `build` = TypeScript check + Vite build; preview is loopback port 4173 with strict-port behavior | Static output is `dist`; reuse a known owned preview or choose/document a separate port for extracted-package verification |
| `vite.config.ts` has no explicit base path; asset URLs in `index.html` and data are root-relative | Root hosting is the current assumption; a subdirectory deployment needs explicit configuration and final asset/link checks |
| `index.html` has title, description, theme color, favicon fallbacks, font and cover preloads; no canonical/Open Graph/Twitter metadata observed | Day 6 must reconcile metadata against the actual chosen URL; absence is a source finding, not a measured runtime failure |
| No hosting/deployment configuration found by filename search for Vercel/Netlify/Wrangler/deploy/release | Host, account, destination and exact command remain undecided; no provider-specific deployment instructions are asserted here |
| `README.md` still describes the older Day 3/seven-surface state and historical sample scripts | Day 7 operating notes must reflect the final candidate, not copy obsolete commands/counts |
| `git status --short` reports project paths untracked and an fsmonitor IPC warning | No source commit exists for this work that this preparation can cite; inspect fresh status and use a deliberate source checkpoint/archive |
| `.gitignore` excludes `dist`, `tmp`, test reports and environment files | Ignored build output is not a durable source checkpoint; retain manifest/package at an explicit path and verify it exists |
| Day 4 review/audit/replay/contrast scripts hard-code Day 4 output locations; replay also fixes localhost 4173 | Do not run them as Day 7 commands unchanged or overwrite prior evidence; create/adapt day-specific outputs only during authorized execution |

The preparation reads inspected the handoff, status, roadmap, skill/complete constraints/reconciliation, active Day 4 plan/review, Day 5 plan, tokens, README, package/config files, registry, test inventory and selected verification-script entry points. No external URLs, hosting account or live demo was exercised.

## Carry-forward register to reconcile at entry

| Item | Present evidence boundary | Required disposition |
|---|---|---|
| Day 5 complete navigation/reading behavior | Only preparation exists at this snapshot | Import its completed final review and check final interactions; do not silently finish missing features as launch fixes |
| Day 6 candidate, defect list and release approval | No Day 6 review found | Require actual candidate identity and measured release gates before claiming release readiness |
| Mobile LCP | Historical Day 3 mobile median 2.943s exceeded <2.5s; Day 4 final measurements pending | Use final Day 6/7 evidence; optimize in budget or explicitly retain failed gate, never carry forward a pass |
| Sustained 60fps and field INP | Unverified; instrumented replay is diagnostic | Record measurement limits and unresolved mandatory targets; do not equate TBT or RAF samples with compliance |
| Physical-device/browser/screen-reader coverage | Earlier records distinguish these from Edge/Chrome emulation and DOM checks | Name actual coverage; leave unavailable checks unverified and classify their effect on release |
| Vault move/hash and capture framing | Day 3 revision 4/6 complete with workflow/capture stages partial/blocked; current Vault presentation accepted | Keep copy/source/runtime claims within evidence. Reopen a live mutation only with appropriate scope/access; do not rerun copy scripts as move verification |
| Ownership and source maturity | Course storage foundation, independently authored integrations, private Harigurus source, local lab WIP are explicitly recorded | Preserve disclosures across release package and visible portfolio |
| Host, base path, URL, access and publication | Not selected/authorized in this request | Prepare package; request concrete final-release approval only after reviewable candidate and intended destination exist |

These are entry dependencies, not a new finding that all are launch blockers. At 7.1.1 classify actual final status and its effect on release. A failed binding requirement cannot become optional merely through a backlog label; require an explicit user amendment for an exception.

## Evidence contract

Use `docs/DAY-07-REVIEW.md` for the execution record and `docs/review/day07/` for public-safe evidence. Create them during execution, not as prefilled pass reports. Record:

- Date/time, elapsed allocation, source snapshot/commit or archive hash, tool/browser versions, viewport, motion mode and test profile.
- Exact build command/result and sorted SHA-256 manifest of candidate files, including HTML, hashed JS/CSS, fonts, images and résumé. Keep manifest outside the directory it hashes. Record package hash separately after packaging.
- Reproduced defect, correction and affected retest; retain failures. Any source rebuild changes candidate identity and invalidates affected earlier evidence.
- Final responsive, keyboard/touch, reduced-motion, accessibility/loading and continuous-motion observations. Lab evidence, human visual/motion acceptance and field measurements are separate records.
- Review approval with candidate identity, host/URL and scope; exact publication command/result if authorized. Never save credentials or access tokens.
- Final outcome: **verified live release**, **verified deployable package awaiting publication**, or **candidate package with unresolved quality blockers**. Include exact URL/path/hash and next action.

Use the final Day 5/6 tests rather than assuming today’s selectors and page counts remain unchanged. Inspect script output paths before running them. An adapted Day 7 audit/replay must accept the correct URL and write only Day 7 outputs. Do not use `scripts/capture-vault-revision.mjs` as a portfolio smoke test.

## Prepared local commands — not executed

Run only when Day 7 execution is requested, earlier verification ownership has ended and the actual candidate is reconciled. Existing npm/Playwright commands below come from the repository; no install or provider deployment is needed for this preparation.

```powershell
npm run build

# Separate terminal, only if no existing preview owns port 4173:
npm run preview

# Against the built preview; include final Day 5/6 gap-specific tests as relevant:
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'
npx playwright test tests/opening.spec.ts tests/focus.spec.ts tests/supporting-work.spec.ts

# When the final changes justify broader regression and the allowance permits:
npm run test:e2e
```

Configured browser: headless Microsoft Edge, one worker. Day 4’s audit uses installed Chrome. Report actual final configuration rather than claiming all browsers passed. Preserve durable summaries separately from ignored `test-results` / `playwright-report`. Do not run old audit scripts unchanged to obtain Day 7 results.

## Package branch and hosting handoff

Prepare the exact reviewed **static `dist` contents** as a ZIP under a dedicated `release/day07/` directory, with manifest and delivery notes alongside. Create these only during execution. Inspect every public asset first, including full-resolution Vault screenshots and résumé. Public-safe portfolio assets are the website’s intended content; internal screenshots, credentials and customer records are not.

Keep a separate source snapshot using an explicit allowlist: application source, public assets after privacy review, build/config files, `package.json`, lockfile and required operating instructions. Include only reviewed supporting documentation. Exclude account configuration, `.env`/secrets, dependencies, local caches, raw private captures and unrelated projects. Inspect before packaging; do not archive the entire workspace or blanket-stage untracked paths.

Validate ZIP extraction into a fresh directory without replacing the candidate. Compare extracted file hashes to the manifest. Serve the extracted files on an available loopback port with the installed local tooling, then exercise HTML, JS/CSS, fonts/images, résumé response, navigation and contact href. An archive that only opens successfully is not a verified website package. Preserve the original candidate output during this test.

Hosting notes must specify chosen provider/account/site, exact build command (`npm run build`), output (`dist`), recorded Node version, root/subpath assumptions, HTTPS URL, asset behavior, and the provider’s actual release/recovery mechanism. Verify current official provider documentation when a host is chosen; no guesswork command is prepared here. Root asset paths must work at the final destination. Do not add a contact backend or external analytics to ship this static portfolio.

Before authorized publication, preserve any identifiable prior working release and its recovery procedure if one exists. For a first deployment with no prior release, state that fact. A failed public verification is not a successful launch; use bounded repair/recovery and record the actual resulting URL/state. Package delivery remains possible while approval or hosting access is unavailable, but unresolved quality gates must remain visible.

## Preparation verification

Allocation checked: six exercises per phase; 7.1 = 60, 7.2 = 30, 7.3 = 45, 7.4 = 45; **24 exercises / 180 minutes**. The final three exercises total the included 30-minute recovery/handoff reserve. All execution exercises remain pending.

Only repository reads and Markdown preparation were performed. No build, browser/test/audit, package, hosting mutation, source commit, push, deployment, model switch, new chat or message to another chat occurred. Account snapshot at preparation start: 1% five-hour / 5% weekly used, separate from the session allowance. Shared checkpoints retain Day 4 as active.

Next bounded execution action: **7.1.1**, reconcile the actual completed Day 6 candidate when Day 7 execution is requested.
