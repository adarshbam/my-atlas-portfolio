# Engineering Atlas

Current source version: the user approved the Day 7 presentation and requested both phone numbers in Contacts. They are accessible tap-to-call links in every presentation. Source commit/push to `adarshbam/my-atlas-portfolio` is authorized; website hosting/DNS remains unconfigured. Verification and publication details: [contact update](docs/CONTACT-UPDATE.md).

Adarsh Singh’s software engineering portfolio, presented as an editorial book. Thirteen semantic page records cover the introduction, Vault Storage, Pipeline, Harigurus, professional references, Security Lab and a closing experience/contact page. Nine persistent chapters provide direct navigation.

Day 7’s 24 technical exercises are complete. Its package records and measured results describe the version before this phone update; those local archives are preserved and excluded from Git. The user subsequently accepted the presentation. Current contact-specific results are recorded separately; unmeasured field/device/hosting checks remain open. Historical results: [Day 7 review](docs/DAY-07-REVIEW.md). Continuation: [HANDOFF.md](HANDOFF.md).

## Run from source

Verified runtime: Node.js **24.11.1**. Use the saved lockfile. A fresh dependency installation requires registry access; this static portfolio needs no account credentials or environment variables.

```powershell
npm ci
npm run dev
```

Development binds to http://127.0.0.1:5173. For the production build:

```powershell
npm run build
npm run preview
```

Build performs TypeScript checking and emits `dist/`. Preview binds only to http://127.0.0.1:4173 with a strict port. Reuse a known working preview rather than stopping another session’s server. Native PageFlip handles geometry; installed Motion mini handles separate button feedback and reduced-motion crossfades. No backend, CMS, analytics or contact service is required.

## Read and navigate

- Native book: use chapters, previous/next, arrow keys, deliberate outer-edge taps or corner drags. Reversal cancels a drag. Links and text selection retain priority.
- Phone: one page at a time, with vertical scrolling for longer content. Touch scrolling and the architecture diagram retain their native input behavior.
- Reading mode: the same thirteen records in continuous document flow; returning retains logical position.
- System reduced motion: paginated content with the approved 200ms crossfade. Continuous Reading mode remains available.
- Contact and résumé use ordinary links. Email links open the visitor’s mail client; this site sends no mail.

The first explicit cover-to-chapter request paints selection feedback before starting the native fold. Native geometry, nominal 1200ms cover / 800ms interior timing, artwork and palette remain unchanged.

## Verify

With a built preview and installed Microsoft Edge:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'
npm run test:e2e
```

Day 7 scripts select isolated output directories using `DAY07_RUN`. Choose a new name before repeating a check to preserve earlier evidence. Run browser work sequentially; Lighthouse should have no competing tests or recordings.

```powershell
$env:DAY07_RUN = 'my-review'
node scripts/review-day07.mjs
node scripts/check-day07-contrast.mjs
node scripts/record-day07-turns.mjs
node scripts/audit-day07.mjs accessibility
node scripts/audit-day07.mjs loading
node scripts/check-day07-zoom.mjs
node scripts/check-day07-links.mjs
```

Geometry, contrast, replay and tests use Edge; accessibility/loading and native zoom use installed Chrome. Replay requires the existing Playwright video encoder. These commands do not establish physical-device, Safari/Firefox, manual screen-reader, field INP or sustained physical-device 60fps results. Saved measurements identify their browser/profile and candidate hashes.

## Packages and hosting

[Delivery notes](docs/DAY-07-DELIVERY.md) record the static-site ZIP, separate allowlisted source ZIP, hashes, included notices, extraction checks and source-rebuild result. Notes accompany the packages separately; a source-only ZIP excludes private evidence archives.

Those Day 7 archives are local historical snapshots and predate the phone addition. Rebuild the current committed version from source. Raw verification/capture/provenance directories are intentionally not published. Reference regressions use `tests/fixtures/references.json`, containing the approved text without private legacy source URLs. Bundled font/code licenses are retained in `THIRD-PARTY-NOTICES.txt`.

The static site assumes a domain’s **root**: assets, résumé and icons use root-relative paths. No provider, public origin, DNS or deployment configuration is selected. Subdirectory delivery needs deliberate configuration and verification. Canonical/social-origin fields remain pending a real public URL; no placeholder domain is shipped.

Generated HTML embeds the exact built stylesheet. Delivery verification records its CSP style hash if the eventual host enforces a strict policy. Local preview does not establish hosted compression, caching, headers or social crawler behavior. Obtain final reviewed publication approval before uploading or pushing anything.

## Source and evidence

- `src/data/portfolio.ts`: immutable page records, chapters, destinations and factual copy.
- `src/components/book-pages.tsx`: memoized semantic pages; `reading-view.tsx`: continuous reading.
- `src/components/ui/book-slider.tsx`: native engine lifecycle, input, focus and presentation modes.
- `src/styles/tokens.css` and `book.css`: binding editorial design system.
- `tests/`: interaction, accessibility, content and delivery regressions.
- `docs/DAY-07-REVIEW.md` and `docs/review/day07/`: current conclusions and durable evidence.

Preserve the ProCodrr foundation/personal-extension attribution, company-private Harigurus source versus its written case study, published versus local lab maturity, and faithful historical references. Day 3’s production-UI move/source-removal/returned-hash and capture-framing gaps remain explicit. Earlier API copies do not prove moves. Older daily reports are historical, not verification of new bytes.

Original identity and approved generated portrait sources remain in the repository; product screenshots retain authentic colours, and references retain the approved ivory/ink/gold treatment and colour portraits. Product text is semantic HTML. Bundled code/font notices accompany the distribution.
