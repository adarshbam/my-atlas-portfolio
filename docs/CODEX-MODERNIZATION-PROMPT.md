# Codex prompt — modernize desk, black surfaces and page-flip

Paste everything below the line into Codex.

---

You are continuing the Engineering Atlas portfolio in this repository. Read, in order: `AGENTS.md`, `HANDOFF.md`, `.agents/skills/engineering-atlas/SKILL.md`, `.agents/skills/engineering-atlas/references/design-constraints.md`, `.agents/skills/engineering-atlas/references/constraint-reconciliation.md`. Do not deploy, do not add a second animation engine, do not change copy, content, IDs or the 13 surfaces.

## Explicit user amendment (record it before coding)

The user (Adarsh) explicitly amends the following binding rules for this task only. Add a dated "Approved amendment — 3 November 2026, modernization pass" entry to both reference files stating exactly what is superseded, then implement:

1. `--desk: #c9b8a0` ("dusty" tan) may be replaced with a cleaner, more modern backdrop. Superseding section 2's "No other colors" for the desk only.
2. Section 2's "No gradients except page-curl shadow and paper-edge shading" is relaxed for one subtle, static desk vignette/light falloff behind the book.
3. All pure-black / near-black surfaces (`--ink` #000000 cover, `--charcoal-surface` #282624, `/story` `--obs-night` #0d1213 and `--obs-surface` #192021) must carry a visible but tasteful static film-grain/noise texture. Static only: no flicker, no looping animation.
4. The book may be restyled toward the premium reference (Issue E): visible case board with overhang and corner radius on the board only, book-cloth texture, page-block thickness, static page curvature, directional lighting and layered desk shadow. This supersedes section 4's "no drop shadows except book shadow and curl shadow" only for these physical-material effects.
5. The first spread's left page returns to a dark full-bleed portrait page (Issue E, item 10), superseding the 30 October cream atlas map left page.
6. The page-turn physics and rendering may be corrected (see Issue C). Keep timings 180/420/800ms, `--ease-in-out`, max scale 1.04, reduced-motion crossfade, hover corner lift, full-edge click zones, arrows, keyboard and touch behavior.

Everything not listed stays binding: ivory paper `#efe9de`, fonts, printed-book identity, semantic HTML, original portrait, CLS < 0.05, asset budgets (texture tile <= 30KB or SVG noise filter), contrast and accessibility.

## Findings to fix (from live inspection at 1440x900 and code review)

### Issue A — Desk background looks dusty
- `--desk: #c9b8a0` (tokens.css) is a flat, low-saturation tan with no light falloff. Next to the near-black cover it looks muddy and dated.
- It is also set on `html` and on a second surface near `book.css:2365` (reading mode), so changes must be made via the token only.
- Fix direction: pick a cleaner, slightly cooler or warmer-neutral modern tone (e.g. a soft stone/bone or a deep graphite desk if the ivory book contrast works best — test both and keep whichever makes the book pop). Add one static radial light falloff centered on the book plus the existing contact shadow. Add very fine grain (see B). Define all new values as tokens first; components consume tokens.

### Issue B — Black surfaces are flat
- Cover `--ink` has only `--material-charcoal-opacity: 0.1` soft-light grain from `book-fiber-light.webp`, which is too faint to read at normal viewing size.
- `/story` (`src/story/story.css`, `.observatory`) uses flat `--obs-night` #0d1213 and `--obs-surface` #192021 with no texture; only the paper cards use `--obs-paper-texture`.
- Fix direction: one shared, seamless, static noise tile (small WebP or SVG `feTurbulence` data URI, <= 30KB), layered via `::after` with `mix-blend-mode: overlay`/`soft-light`, with separate opacity tokens for cover, charcoal, story night and story surface (start around 0.06–0.12 and tune visually). Must not reduce text contrast below WCAG AA, must not repaint on scroll, and must be `aria-hidden`/pseudo-element only. Apply it to `/story` background, hero veil base, and dark story panels as well as the book cover/charcoal pages.

### Issue C — Page flip looks "off"
Observed: during a forward turn from the cover, the closed cover first renders as a flat slab, then the spread appears with a hard rectangular edge and a dead gradient zone on the left of the stage; the turning page does not foreshorten or curve convincingly, and shading appears to jump rather than sweep.
Code causes to investigate and fix (`src/components/ui/book-slider.tsx`, `src/styles/book.css`):
1. `page-flip` (StPageFlip 2.0.7) HTML mode projects pages with 2D clip/rotate, not a true perspective hinge. Check `--perspective: 2000px` is actually applied to the right ancestor (`book.css:146`, and `perspective: none` at `book.css:2381`) so the turning leaf gets depth cues, and that `transform-style`/`backface-visibility` are not flattening it.
2. Two systems are mixed: `.cover-spine-canvas` uses a separate CSS `perspective(var(--perspective)) rotateY(var(--cover-wrap-angle))` (`book.css:1124-1125`) while StPageFlip drives the cover turn. The constraints file says "Don't mix approaches." Make the spine/board-thickness illusion follow the engine's progress value without a competing transform, or remove the divergence that causes the cover to pop.
3. `setTurnDensity` (`book-slider.tsx:171`) flips pages between `hard` and soft density depending on gesture (corner vs middle-edge). Hard density makes the leaf rotate rigidly while soft bends, so the same page turn looks different by input. Normalize so arrow, click, drag and touch turns give the same believable paper behavior (soft paper pages, hard only for the cover board).
4. `maxShadowOpacity` is `--curl-opacity: 0.25`, `drawShadow: true`. Verify the shadow sweeps continuously (0 -> 0.25 -> 0) under the page and a subtle highlight rides the curling edge; remove any stepwise jump. Shadows must be neutral and static-material-consistent.
5. The whole-book "fit cover; grow on opening" wrapper translates/scales in sync with progress. Verify that it is not applying a transition on top of the engine value (double easing causes the late jump) and that the left empty area during cover opening does not show a visible gradient seam. Animate transform/opacity only.
6. Check the page edge stack, gutter and contact shadow stay attached to the moving geometry during the turn (no layers lagging a frame), and that the pages are visible at the bottom without cropping at 1440x900 and 1920x1080.

Acceptance for C: in continuous live use (not still screenshots), cover open, spread forward, spread backward, cover close, corner drag and cancel, and reduced-motion crossfade all look like one coherent paper object. Capture frame strips at 0/25/50/75/100% of each turn for review.

### Issue E — The book reads as cheap; match the premium reference
Reference: `docs/artwork/editorial-spread-reference.png` (open it and keep it beside every review screenshot). The user explicitly wants this level of finish or better. Compared at 1920x1080, the live book loses on these points:

1. **The whole object is never visible.** The open spread fills almost the full viewport width and its bottom board is cropped below the fold, so it reads as a flat web panel rather than a book on a desk. Fit the complete spread (board included) with roughly 5–8% desk visible on all sides at desktop widths, without shrinking body text below the current readable size. Keep CLS < 0.05.
2. **Hardcover board is almost invisible.** Only a hairline of dark board shows at the top. Make the case board visible on all sides: 10–14px overhang beyond the page block, 3–4px corner radius on the board only (pages stay square), matte book-cloth texture (fine woven/linen grain, static), a faint bevel highlight on the top/left edge and a 2–3px darker board-thickness band at the bottom.
3. **Page block has no thickness.** Add a visible stacked fore-edge on both outer sides (12–16px), built from fine irregular page lines (existing `--material-edge-lines` tiles), tapering toward the head and tail, slightly darker toward the bottom. Left stack thickness should reflect pages already read; right stack the pages remaining, if this can be derived from the current page index without layout shift.
4. **Pages are perfectly flat.** In the reference, each page bows: the top and bottom edges arc down into the gutter and the sheet rises toward the outer edge. Use the existing static `.sheet-surface` contour mask (`--sheet-contour`, `book.css:1610-1660`) to create a visible but restrained curve on head and tail edges, plus shading: a deeper, wider gutter shadow (~8–12% of page width, soft falloff) and a faint highlight on the page crest. Static only; StPageFlip still owns the turning geometry.
5. **No lighting direction.** Pick one key light (top-left, matching the reference) and apply it consistently: a very subtle diagonal tonal falloff across the spread, the board bevel highlight on the lit edges, and a layered desk shadow cast down-right (tight dark contact shadow + large soft ambient shadow). Neutral colors only.
6. **Desk.** Replace flat tan with a warm, fine-grained paper/kraft or linen desk surface plus soft vignette toward the corners (static, tiled texture <= 30KB), so the book sits on a material and not on a fill color. Coordinate with Issue A.
7. **Typography polish to match the reference.** Larger display headings (e.g. "Selected work" ~1.2–1.3x current), lighter and larger index numerals, more generous row height with full-width hairline rules, smaller widely tracked caps for tags and running heads, and more white space between the list and the diagram. Running heads/folios stay as they are semantically.
8. **Diagram quality.** The right-page architecture diagram uses basic line icons. Redraw it as a refined, consistent-stroke isometric line illustration (single stroke weight, monochrome ink at reduced opacity, two-level labels: name + short description), as in the reference. Keep it as inline SVG/semantic labels; keep the same factual nodes (Browser, API, B2 & adapters, Cloudflare and their relations) — do not invent nodes the reference shows if they are not in the real Vault architecture.
9. **Cover.** Same materials as the board: matte black book-cloth with visible weave, blind-debossed or subtle foil title treatment (CSS inset highlight/shadow on the live HTML text, not an image of text), visible spine with a slightly rounded edge highlight, headband hint at head/tail, and page-block edges showing on the fore-edge.

10. **Dark portrait left page (approved by Adarsh on 3 November 2026).** Match the reference: the left page of the first open spread becomes a dark, full-bleed portrait page on the charcoal/ink stock with grain, paired with the cream "Selected work" page on the right. This supersedes the 30 October "cream atlas map replacing the duplicate introduction" requirement; record it in the amendment. Rules:
   - Use the existing approved portrait assets (see `docs/artwork/EDITORIAL-PORTRAIT.md`; preserve the original photograph and identity, no new generated likeness, no mirroring). If this makes the cover and the left page show the identical image, use a distinct approved crop and show Adarsh screenshots before finalizing.
   - Live HTML text over the portrait, as in the reference: name, "Software engineer", stack line, short intro sentence, running head/folio. Keep the factual copy and the current year; do not copy the reference's invented taglines.
   - Preserve the atlas map's navigation function (The work · 02, The systems · 05, The people · 09, Contact · 12, "Begin with selected work"): keep it reachable as a compact, accessible index on this page or in the existing contents navigation. Keep the 13 surfaces, page IDs and deep links working.
   - Text over the photo must meet WCAG AA; use a static tonal scrim on the ink stock if needed, not a decorative gradient.

Acceptance for E: side-by-side screenshots of the reference and the live spread at 1280, 1440 and 1920 widths, plus a closed-cover screenshot, showing the full object on the desk, visible board overhang, page-block thickness, page curvature, gutter depth and a single consistent light direction. Text stays live HTML and fully readable.

## Other modernization (bounded)
- Keep the printed-book identity. Modernize through material quality (grain, light falloff, softer contact shadow, cleaner edges), not through cards, glass, neon or gradients on UI.
- `/story`: keep the sky imagery, paper cards and handwritten notes. Lift the flat black with grain and a subtle top-to-bottom tonal variation between chapters so long scrolls do not read as one slab. Fix the horizontal scrollbar seen at the top of the story page (page-level horizontal overflow) if reproducible.

## Process
1. Write the amendment into both reference files first.
2. Update `HANDOFF.md`, `PROJECT-STATUS.md` and the active day plan before long operations; replace the in-progress entry with results afterward.
3. Implement tokens first, then components.
4. Verify with `npm run build`, the existing Playwright suites touching the cover, hardcover, opening, wrapped-binding, responsive-input and story pages, 375/768/1280/1920 widths in normal and reduced motion, Axe, and a Lighthouse run (do not claim LCP/CLS without measuring).
5. Keep motion acceptance separate from static visual approval and automated results: report what you could and could not verify, and leave the final live-motion judgement to Adarsh.
