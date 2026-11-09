# Engineering Atlas

Adarsh Singh's software engineering portfolio, presented as an editorial book with a continuous Reading view and a separate personal story.

[Open portfolio](https://adarshbam.netlify.app/) · [Architecture](docs/ARCHITECTURE.md) · [Verification guide](docs/VERIFICATION.md)

## What it contains

- Thirteen semantic book-page records covering selected projects, contribution boundaries, engineering decisions, references, and contact details.
- Native hard-cover/interior page turns, chapter navigation, keyboard/touch input, and a reduced-motion presentation.
- Continuous Reading view using the same project content and preserving logical position when returning.
- A twenty-chapter `/story` tracing early experiments, learning projects, professional work, client feedback and Octoworlds.
- Full-screen framed image inspection with lazy high-resolution originals, zoom, panning and keyboard controls.
- An in-page résumé PDF preview with optional download and a new-tab alternative.
- Seven connected Security Lab modules and 28 experiments, described with a clear local-only runtime boundary.

React · TypeScript · Vite · StPageFlip · Motion. Static output; no portfolio-owned backend or account configuration is required to run the book. Hosted story media can use an external provider.

## Run from source

Use Node.js 24 and the committed lockfile:

```sh
npm ci
npm run dev
```

Development binds to `http://127.0.0.1:5173`. For the production build and local preview:

```sh
npm run build
npm run preview
```

Build performs TypeScript checking and emits `dist/`. Preview binds to `http://127.0.0.1:4173` with a strict port. A local build does not update the hosted site; the public deployment can differ from the latest local or repository candidate.

## Source map

| Area | Entry point |
| --- | --- |
| Project facts, page IDs, and destinations | [portfolio.ts](src/data/portfolio.ts) |
| Semantic book content | [book-pages.tsx](src/components/book-pages.tsx) |
| Page-turn lifecycle, input, and focus | [book-slider.tsx](src/components/ui/book-slider.tsx) |
| Continuous presentation | [reading-view.tsx](src/components/reading-view.tsx) |
| Design tokens and styles | [src/styles/](src/styles/) |
| Personal story | [src/story/](src/story/) |
| Browser regressions | [tests/](tests/) |

## Verify and maintain

With a built preview running, set `PLAYWRIGHT_BASE_URL` and run `npm run test:e2e`. [Verification guide](docs/VERIFICATION.md) explains scope, visual review, responsive checks, and historical reports.

Preserve stable page IDs, factual authorship, company-private source boundaries, original portraits, reference quotations, and content access with reduced motion. Book/Reading/story are related presentations, not permission to apply one visual system everywhere. [Project instructions](AGENTS.md) govern further UI work.

Serve the static output from a domain root or deliberately adjust root-relative asset paths and verify them. Provider caching, CSP, redirects, and deployed media behavior require hosted checks. Third-party code/font/media notices remain in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt) and [audio licenses](public/audio/LICENSES.md).

Historical implementation/checkpoint documents record specific candidates; they are not fresh test results for new bytes. Continue local work from [HANDOFF.md](HANDOFF.md), not an old daily completion statement.
