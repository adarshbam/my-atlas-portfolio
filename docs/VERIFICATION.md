# Portfolio verification

[Overview](../README.md) · [Architecture](ARCHITECTURE.md)

## Current checks

Install the lockfile, build, then run a known local preview:

```sh
npm ci
npm run build
npm run preview
```

In PowerShell, with that preview running:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'
npm run test:e2e
```

Use an available strict port; do not stop another task's server without identifying it. The browser configuration uses installed browser tooling; read [playwright.config.ts](../playwright.config.ts) before moving to another platform.

## Review beyond a green test result

- Check 375, 768, 1280, and 1920px, reduced motion, Reading view, and both themes where supported.
- Exercise keyboard focus, chapter/arrow navigation, touch/vertical scrolling, links, and return position.
- Inspect genuine portraits/screenshots, text wrapping, image stability, and runtime errors.
- Review uninterrupted page turns, including release/reversal. Stills do not validate motion.
- Measure loading in an isolated browser without concurrent tests/recording; distinguish local lab results from field metrics.

## Historical evidence

[Modernization review](MODERNIZATION-REVIEW.md), [Day7 review](DAY-07-REVIEW.md), and [contact update](CONTACT-UPDATE.md) identify their own candidate and scope. Local checkpoint/evidence files may include later work not present in a published branch or hosted build.

Do not promote a dated Lighthouse score, test total, screenshot, or accepted earlier presentation into a fresh pass for changed code. A documentation-only refresh does not rerun product suites or establish hosted Core Web Vitals, Safari/Firefox behavior, manual screen-reader acceptance, or physical 60fps.

For new verification, record the revision, exact commands, browser/platform, viewport/motion/theme, observed results, and remaining limitations. Keep operational handoff history separate from visitor-facing project explanations.
