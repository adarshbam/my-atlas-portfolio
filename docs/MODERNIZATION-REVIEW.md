# Engineering Atlas modernization — final local review

The approved Light/Dark book is implemented. Local preview: http://127.0.0.1:4180/. No deployment or backend/API changes.

## Delivered behavior

Light defaults to stone #d8d6d0; explicit Dark selects graphite #343635 and persists before first paint. Both retain ivory paper, black cloth and the original approved portrait. The toolbar provides Contents, Reading view and accessible Light/Dark controls. Contents preserves chapters, atlas shortcuts, GitHub, résumé, story and sound. Theme changes preserve engine identity, location and focus, including during turns. The story keeps its night identity; its static reader stylesheet and image containment are repaired.

The dark introduction faces Selected work. All 13 surfaces, deep links and factual copy remain. Material tokens define 12px board overhang, 4px board radius, 3px board band, 16px fore-edge and 12px bottom depth. Static cloth, grain, gutter falloff and directional shadows replace the previous finish. StPageFlip owns hard-cover and soft-interior geometry for every input; 1,200ms cover, 800ms interior and 200ms reduced-motion crossfade remain. Desktop fitting accounts for width and height. Dense and short layouts scroll without shrinking body text.

The final performance follow-up preloads the book's complete static module graph only on book routes. Original-font subsets reduce the display face from 23,312 to 12,620 bytes, body face from 23,820 to 16,060 bytes and numeral face from 21,908 to 2,620 bytes. Scripts verify retained outlines and metrics against the originals. Full fonts remain available for additional Unicode, with accurate supported-character ranges; OFL licenses are included. The original portrait files remain unchanged. No runtime or animation dependency was added.

## Verification

- TypeScript and production Vite build pass.
- Final follow-up: 21/21 cover and modernization regressions pass, including font requests, direct-story loading isolation, first-paint theme, invalid/blocked storage, theme changes during turns, cover timing, story return and cold navigation through all 13 destinations.
- Final responsive recapture: 20/20 states pass at 375, 768, 1280, 1440 and 1920px, in both themes and motion preferences. No horizontal document overflow or page errors. Eight sampled Axe states have zero violations. The complete opening fits at 1440×900 and 1920×1080 without internal opening-page scrolling.
- Earlier full behavior run: 92/92 cover, hardcover, opening, navigation, reading, references, diagrams, focus and theme tests pass. The font/loading follow-up did not modify the turn engine, interactions or geometry.
- 18/18 Vault/input tests and 12/12 full accessibility cases pass. Native 200% browser zoom: 39/39 states pass across all 13 surfaces in native, reduced-motion and reading modes.
- 726 rendered text contrast samples pass. Ten story/static-reader layouts pass without horizontal overflow. These layout/contrast checks preceded font subsetting; retained glyph outlines, metrics and all colors are unchanged.
- Final Light, Dark and cover comparison sheets were visually inspected. Controlled-clock turn strips and a separate uninterrupted native-motion recording are saved.

## Measured performance and remaining limits

Final isolated local Chrome Lighthouse, default simulated mobile throttling: **Performance 93, Accessibility 100, LCP 2.72s, CLS 0**. Desktop: **Performance 100, Accessibility 100, LCP 0.60s, CLS 0**. The same candidate measured mobile LCP 2.70s in the preceding isolated run. Performance, accessibility and CLS targets pass; **mobile LCP below 2.5s remains unmet**. Do not label all performance acceptance criteria complete. Raw reports are preserved locally. Field INP and physical-device smoothness have not been measured.

Visual fidelity, native motion and automated checks are separate outcomes. The implementation follows the concept's composition and materials, using the original portrait, selectable text and semantic diagrams. It is not a pixel-identical rendering of the generated image: portrait details remain original, headings use compact tokens where page fitting requires them, and diagram labels retain factual relationships. Human approval of appearance and live motion is not inferred from passing tests. Controlled-clock 0/25/50/75/100% strips demonstrate geometry, not real-device frame rate.

## Review artifacts

- [Light comparison](review/modernization/comparison-light.png)
- [Dark comparison](review/modernization/comparison-dark.png)
- [Closed-cover comparison](review/modernization/comparison-cover.png)
- [Uninterrupted native motion](review/modernization/native-motion.webm)
- Approved concepts: `review/modernization/references/{light,dark,cover}.png`
- Five-width captures, responsive.json, zoom-200.json, contrast reports, story reports and Lighthouse reports: `review/modernization/`
- Controlled-clock strips: `motion-{opening,forward,backward,closing}.png`; timing evidence: `motion-sampling.json`

Review media remains local and Git-ignored. The active implementation record is MODERNIZATION-IMPLEMENTATION.md. Unrelated video work and existing repository changes were preserved.
