# Day 7 — local delivery and review

Publication is **not authorized**. No host, origin, DNS or public URL is selected. The user requested review after all technical work. Both packages exist and passed extraction/hash and local delivery/rebuild checks. Final archive hashes and any documentation-refresh recheck are authoritative in package-verification.json and SHA256SUMS.txt.

## Delivery outputs

- Static site: `release/day07/engineering-atlas-site.zip` — website files at archive root, including bundled code/font notices.
- Source: `release/day07/engineering-atlas-source.zip` — explicit source/config/tests/public/verification-tool allowlist; excludes `.env`, account configuration, Git metadata, dependencies, private evidence and live-account scripts.
- Manifest: `release/day07/package-manifest.json` — candidate identity, lockfile hash and exact site/source hashes.
- Archive hashes and extraction/source-rebuild results: `release/day07/package-verification.json`.
- Notices: `release/day07/THIRD-PARTY-NOTICES.txt`, also inside both ZIPs.

Preparation copies reviewed files into `tmp/day07/package-stage/`. ZIP creation/extraction use Windows’ standard .NET compression library. Fresh destinations `tmp/day07/extracted-site/` and `tmp/day07/extracted-source/` do not replace the candidate or predecessor.

The site package is checked by comparing all extracted hashes, then serving those files locally. The source is rebuilt using already-installed dependencies matching the unchanged lockfile; this is distinct from testing a fresh online installation. Exact output comparison is recorded rather than assumed.

## Preview commands

Main candidate: reuse `http://127.0.0.1:4173/?review=day07`. From an installed source snapshot, `npm run build` then `npm run preview` starts the equivalent preview.

For the extracted static ZIP, from this workspace with installed Vite:

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort --outDir tmp/day07/extracted-site
```

Use a separate terminal; do not take over an occupied port. The static root must contain `index.html`. Package checks:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4174'
$env:DAY07_RUN = 'package'
node scripts/check-day07-package.mjs
```

Choose a fresh run name for a later repeat. Actual response hashes and smoke results: `docs/review/day07/package/package-delivery.json`. Historical terminal session IDs are not a resumption mechanism.

## Future host requirements

Build: `npm run build`; output: `dist`; verified Node: 24.11.1. Current paths assume a domain root. This static site has no contact/backend secrets. It uses local fonts/images; email is a mailto link.

Before separately authorized publication, choose the destination and verify official instructions, HTTPS, paths, MIME/compression/cache behavior, résumé body/hash and any CSP. HTML embeds built CSS; its exact style hash is saved with candidate verification. No provider command is invented. Set canonical/og:url/absolute share imagery only after the real origin is known, then re-verify. No previous public release or provider rollback identity is recorded; retain these source/site snapshots for recovery.

## End review

Check the cover/first turn, reverse/cancel a drag, use all chapters, read references, switch to Reading mode and return, and find résumé/contact on a phone-sized view. Judge live movement as well as stills. Record approval or concrete corrections against the candidate ID; final visual/live-motion acceptance is separate from automatic checks and publication approval.

Unmeasured field/device/manual targets and any failed final budget remain visible in the Day 7 review. Packages are review candidates while those gates or approval remain unresolved; packaging alone does not make them release-ready.

## Verified outcome

Candidate **day07-366c0e60bdd7**. Seventy site files served with matching SHA-256/MIME; six native/reduced/reading phone/desktop smoke states pass. The source rebuild reproduces all69 website files exactly on Node24.11.1 with existing dependencies; a fresh online installation is not claimed. All149 original application records remain unchanged through verification. Final source documentation is refreshed, re-extracted/hash-checked and rebuilt before handoff; earlier source-checkpoint archive/manifest remain under docs/review/day07/package/. Read the accompanying package-verification.json for exact current ZIP hashes and counts.

The source ZIP preserves an explicit code/config/public/tests/verification/documentation checkpoint; raw evidence is kept outside the distribution. The final review, delivery notes, backlog and JSON verification accompany the archives. No publication approval is inferred. Inline stylesheet CSP hash: sha256-r+Qar5ZdErn4i2VKs88ffLPrgzQ5u3wBPtkTf/MgV2o=; that is not a complete policy for native engine inline style attributes.
