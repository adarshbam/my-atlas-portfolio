
## Reference-section amendment — 25 October 2026, Task 5.0

The user explicitly requests that the work-experience reviews receive particular importance: use authentic colour portraits and complementary text, a coordinated tricolour scheme, and a luxurious, premium editorial treatment. This is a reference-section-only exception to the monochrome portrait and restricted accent-use rules. Preserve the existing book design elsewhere, authentic identities, faithful quotations, historical attribution and native page engine. Define any section-specific palette/type/motion values as tokens before implementing. Task 5.0 implements warm ivory, deep ink and muted gold through reference-section tokens, with 96px colour portraits, 43px headings and 24px author names. Final verification and limits are recorded in docs/TASK-5.0-REVIEW.md.

Remove all visitor-facing links or mentions directing readers to the previous portfolio. The old site is provenance only, retained privately in the repository evidence; it must not be required to read or validate the reviews in the product. Do not erase the evidence ledger or invent new attribution.

The user requests proper 21st.dev animation inspiration for an immersive, premium section. Research relevant 21st examples and adapt only behavior compatible with the approved native turn engine, token timing, immediate readability and reduced-motion support. This request does not explicitly authorize competing page engines, overshoot, looping decoration, new dependencies or expanded time. Task 5.0 adapts 21st Mask Reveal to post-turn portrait mask/settle, immediately readable heading movement and divider draw; maximum scale 1.04 and supporting sequence 1,270ms. Reduced/reading modes remain static apart from their existing page crossfade. Automated verification is complete; human visual/live-motion acceptance is separate. This amendment supersedes Task 5.0's earlier monochrome/source-link composition requirements.

---

Design Constraints — "Engineering Atlas" Portfolio
These rules are binding. Every UI change must stay inside them. If a request conflicts with a rule, follow the rule and say which rule blocked it.

Approved amendment — 25 October 2026, connected Vault revision: product screenshots preserve their original full colors, with no grayscale, contrast grading, overlays or AI reconstruction. This is a product-evidence exception to section 2; portraits retain their approved treatment. Permit a single muted-gold active-chapter underline through `--accent: #765818`, with navigation/body text remaining ink. No other palette/material/type/engine changes. The user approved an additional bounded 60-minute Day 3 revision (22-hour total project allowance); later session dates and October 30 off stay unchanged. Seven-surface scope and no deployment remain.

The visual reference is an editorial hardcover book: a dark portrait page on the left, a cream "paper" page on the right, serif typography, hairline rules, tracked small caps, and a monochrome technical diagram. Think printed monograph or museum catalogue, not SaaS landing page.

1. Design principles (in priority order)
Restraint over decoration. If an element doesn't carry content or structure, remove it.
Typography is the design. Hierarchy comes from size, weight, case and spacing, not color or boxes.
Whitespace is a feature. When in doubt, add space, not elements.
Motion explains, never performs. Every animation must answer "what changed / where did it go".
Consistency beats novelty. Reuse tokens; never invent one-off values.
2. Color tokens (only these)
:root {
  --ink:        #161513;  /* primary text on paper, dark page bg */
  --ink-soft:   #2a2825;  /* dark page secondary surface */
  --paper:      #efe9de;  /* right page / light surface */
  --paper-deep: #e4dccd;  /* page edges, gutters, subtle fills */
  --graphite:   #6e685f;  /* secondary text, captions */
  --rule:       rgba(22, 21, 19, 0.18);  /* hairlines on paper */
  --rule-dark:  rgba(239, 233, 222, 0.22); /* hairlines on dark */
  --desk:       #c9b8a0;  /* background behind the book */
  --accent:     #8a6a3f;  /* optional; max ONE use per spread (e.g. active state) */
}
No other colors. No gradients except the page-curl shadow and paper-edge shading.
No pure #000 or #fff.
Photos are black & white, slightly warm. Use filter: grayscale(1) contrast(1.05) or pre-graded images.
Text contrast must meet WCAG AA (4.5:1 body, 3:1 large).
3. Typography
Role	Font (free)	Size (desktop)	Style
Display (name, "Selected Work")	Cormorant Garamond 500, or Instrument Serif	clamp(48px, 6vw, 96px)	line-height 0.95, letter-spacing -0.02em
Project titles	Cormorant Garamond 500	26–32px	line-height 1.1
Big numerals (01, 02…)	Cormorant Garamond 300	56–72px	font-variant-numeric: lining-nums tabular-nums, color --graphite
Body	EB Garamond 400	17–19px	line-height 1.55, max 60ch
Labels / running heads ("PORTFOLIO", "SOFTWARE ENGINEER")	EB Garamond or Inter 400	10–12px	UPPERCASE, letter-spacing 0.24–0.32em
Diagram captions	Inter 400	11–12px	--graphite
Rules:

Max 2 font families. Self-host or use Google Fonts with font-display: swap and preload the display font.
Use a modular scale (ratio 1.333). Don't use sizes outside it.
Never bold for emphasis in body copy; use italic.
No center-aligned paragraphs. Labels and titles may be left- or right-aligned only.
Use real typographic characters: · separators, — em dash, ’ curly quotes.
4. Layout & spacing
Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Nothing else.
Each page has generous margins: at least 8% of page width inside and outside.
Running heads at top (label left, label right) and folios (page numbers) at bottom, separated from content by a 1px hairline.
Use a 12-column grid per page. Numerals sit in columns 1–2, titles start at column 3.
Hairlines are always 1px, --rule / --rule-dark. No borders thicker than 1px anywhere.
No cards, no rounded corners (max border-radius: 2px on the book itself), no drop shadows except the book's shadow on the desk and the page-curl shadow.
Icons: thin line icons only (1–1.25px stroke), one family (e.g. Lucide or Phosphor "light"). No emoji, no filled icons, no colored icons.
5. Motion system
Global tokens
:root {
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);      /* entrances */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);      /* page turns, moves */
  --ease-in:     cubic-bezier(0.55, 0, 1, 0.45);      /* exits */
  --dur-fast:    180ms;  /* hovers, focus */
  --dur-base:    420ms;  /* reveals */
  --dur-slow:    800ms;  /* page turn */
  --stagger:     70ms;
}
Hard rules:

Animate only transform and opacity (plus clip-path / stroke-dashoffset for reveals). Never animate width, height, top, left, margin or box-shadow.
No bounce, no elastic, no spring overshoot, no spinning, no shaking, no confetti.
Max movement for reveals: 24px. Max scale change: 1.04.
Only one "hero" motion at a time; supporting motion runs after it, never with it.
Total entrance sequence for a spread: ≤ 1.6s. The user can interact at any time; motion never blocks input.
Must run at 60fps on a mid-range laptop. Use will-change only during the animation, then remove it.
Approved animations (use these, not new ones)
Page turn (hero interaction)

Real 3D hinge: parent has perspective: 2000px; the turning page uses transform-origin: left center (or right) and rotates rotateY(0 → -180deg) over --dur-slow with --ease-in-out.
Front and back faces with backface-visibility: hidden.
A soft shadow gradient sweeps across the page underneath as it turns (opacity 0 → 0.25 → 0), plus a slight highlight on the curling page.
Triggers: click on page edge/corner, arrow keys, swipe on touch. Dragging the corner may scrub the turn (optional).
Implementation: custom CSS 3D + GSAP, or the page-flip (StPageFlip) library. Don't mix approaches.
Line-by-line text reveal (headings on each new spread)

Each line is wrapped in a mask (overflow: hidden); the inner line goes translateY(100%) → 0, --dur-base, --ease-out, staggered by --stagger.
Use on display text only, not on body paragraphs.
Hairline draw

Rules animate scaleX(0 → 1) from the left, 600ms, --ease-out, before the content they separate fades in.
Soft fade-up (body text, labels, list rows)

opacity 0 → 1, translateY(12px → 0), --dur-base, staggered by --stagger.
Portrait settle

Image goes opacity 0 → 1 and scale(1.04 → 1) over 1.2s, --ease-out. Optional very slow grain overlay (static noise texture, no flicker).
Diagram build (architecture illustration)

Nodes fade in in data-flow order: Client → CDN → API → Core → Auth/Queue/Cache/Storage → Runner/Scan.
Connectors draw with stroke-dashoffset, then dashed lines may drift very slowly (one dash length per ~4s) to suggest data flow. No glowing, no pulsing.
Project row hover (Selected Work list)

Over --dur-fast: the numeral shifts from --graphite to --ink, the title moves translateX(6px), and the row's hairline darkens. Optional: a small "→" fades in on the right.
Cursor stays the default pointer. No custom cursors or magnetic buttons.
Forbidden motion
Parallax on more than one layer, scroll-jacking, auto-playing carousels, typewriter effects, text scramble/glitch, 3D tilt-on-hover cards, cursor trails, looping background animations, and anything that loops forever except the slow diagram dash drift.

Reduced motion (required)
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
Page turn is replaced by a 200ms crossfade.
Reveals show content immediately.
6. Responsive behavior
≥ 1024px: two-page spread, book centered on the desk background with a realistic soft shadow.
768–1023px: spread scales down proportionally; it keeps its aspect ratio and never squishes.
< 768px: single page at a time. The page turn becomes a horizontal swipe with the same easing. Running heads stay; the diagram becomes a vertical stack or a horizontally scrollable figure.
No horizontal page scroll at any width. Minimum side gutter is 16px.
Touch targets are at least 44×44px.
7. Accessibility & semantics
All text is real HTML text, never baked into images.
Each spread is a <section> with a heading; page navigation uses <button>s with labels ("Next page", "Previous page").
Keyboard: ← / → turn pages, Tab reaches every link, focus ring is a 1px --ink outline offset by 3px.
Live region announces "Page 3 of 12" after a turn.
Portrait has meaningful alt text; decorative textures are aria-hidden.
8. Performance budget
LCP < 2.5s, CLS < 0.05, INP < 200ms.
Images in AVIF/WebP with srcset; the portrait is ≤ 200KB at desktop size.
JS for animation ≤ 60KB gzipped. Lazy-load pages that aren't visible yet.
Paper texture is one small tiling image (≤ 30KB) or an SVG noise filter, not a large photo.
9. Tech constraints
Stack: React + TypeScript (match the existing project). Animations via GSAP (free, including plugins) or Motion (motion.dev). Pick one and use only that.
All design values come from the CSS tokens above. No hard-coded colors, durations or easings in components.
No UI kits (no Bootstrap, MUI or shadcn default styling), so the look stays custom.
10. Anti-patterns (instant reject)
Gradients, glassmorphism, neon, glow, or colored shadows
Rounded cards, pill buttons, or chunky borders
More than 2 fonts, or any font that isn't a serif or neutral sans
Emoji, stock 3D illustrations, or colorful icon sets
Stretching text to fill space, centered body text, or long full-width lines
"Hero" sections with big CTA buttons such as "Hire me!!"; contact belongs in a quiet colophon page
Animations that delay reading content by more than 300ms
11. Definition of done (check before every handoff)
 Only tokens from sections 2, 4 and 5 are used
 Looks right at 375px, 768px, 1280px and 1920px
 Page turn is smooth (no frame drops in Chrome DevTools performance panel)
 prefers-reduced-motion tested
 Keyboard-only navigation works end to end
 Lighthouse: Performance ≥ 90, Accessibility ≥ 95
 No console errors or layout shift on load
 Side-by-side with the reference image, it feels like the same book

Interaction amendment — 23 October 2026, explicit user request after arrow-fold review:
Permit a small, bounded native corner lift on hover as a page-turn affordance. Hover alone must never complete a turn or scrub the page farther open. The corner lowers naturally when the pointer leaves. Clicking and dragging an available left or right corner controls a turn from that corner; dragging back cancels. Working arrow turns remain. Use the same StPageFlip engine, contain curl overflow, and omit the hover affordance in reduced-motion/reading mode and on single-page phone layouts. This supplements section 5’s approved page-turn interaction; it does not authorize a second animation engine or decorative looping motion.

Interaction clarification — 23 October 2026, expanded outer edges:
The user explicitly requested much larger interaction areas on every device and confirmed that “middle” means the middle of the outer edge. Extend left/back and right/forward click/tap zones along the full outer edge. Top/bottom areas retain the native corner curl and bounded pointer hover; middle-edge clicks/taps use the same engine’s straight native turn. Keep links, text selection, native vertical scrolling, working arrows and reduced-motion crossfades. This adds an intentional straight middle-edge gesture alongside the accepted soft corner behavior; it does not replace corner folding or authorize another turn engine.

# Approved cover amendment — 24 October 2026

The user rejected the plain, right-aligned Day 02 cover and approved a dark charcoal hardcover with a recognizable, unfinished charcoal interpretation of the supplied original portrait. This is a cover-only illustration exception to the original-photograph guidance in sections 2 and 7; retain the original interior portrait and identity. Keep all lettering as real HTML. Static material grain, a left binding/spine and layered right/bottom paper edges are approved within the existing palette and asset budgets. The cover uses a dedicated composition rather than interior running heads/folios (section 4).

The user explicitly selected “Fit cover; grow on opening,” permitting a narrow exception to section 5’s 1.04 scale limit and reveal-distance ceiling for whole-book presentation during native cover opening/closing. Center the complete closed cover including thickness and fit it to the viewport; retain readable interior sizing. A presentation wrapper may translate and scale in sync with native StPageFlip progress, including reversal/cancellation. The same engine still owns cover/page geometry and shadows; this is not permission for another turn engine, arbitrary interior scaling, springs or decorative motion. No animated layout properties. Reduced motion applies final geometry immediately and retains the approved 200ms page crossfade. Text zoom may use ordinary scrolling. No added session or deployment is authorized.

## Cover refinement — 24 October 2026

The user said the charcoal version “looks really good” and explicitly requested a slower opening, left-side portrait with “Portfolio · 2026” above it, and all remaining cover copy/action at right. They clarified that the phone cover was “too tall and narrow.” This is positive feedback on the prior direction plus a request for refinement, not final acceptance of the new composition or continuous motion.

This request amends section 5's standard 800ms page-turn target only for cover opening/closing: `--dur-cover: 1200ms` is the nominal native engine timing. Interior turns remain 800ms; reduced motion/reading mode retain the 200ms opacity crossfade. The engine can shorten actual duration with its native distance calculation. No parallel opening animation or vendor patch is approved.

Below 768px, use a page width/height ratio of 0.68 instead of the former 960px minimum height. Keep native page dimensions stable during a turn; permit vertical scrolling within longer interior page content at full text size. Desktop/tablet facing-page navigation remains. Keep the generated portrait unmirrored and the original photograph inside; this is a layout/crop change, not a replacement likeness. Palette, material, depth, asset budgets, five-surface scope, schedule and deployment limits remain.

# Seamless cover clarification — 24 October 2026

The user identified the hard central join caused by cropping the former right-composed artwork into a left panel. They explicitly requested a new left-composed illustration, preserving the half-drawn strokes on the viewer's left, deeper facial definition and clearly readable live typography.

Regenerate from the inspected original photograph and previous drawing as a style reference. Preserve identity and keep the original interior photograph. Use genuine transparent edges and fit the complete image without a rectangular crop, mirror or background panel. The cover remains one continuous surface using `--ink`; paper-colored text, the same two fonts and separate static grain remain. No CSS gradient, extra shadow effect, entrance animation, dependency or change to page-turn behavior is authorized or needed.

This refines the existing cover-only illustration amendment; it does not extend the illustration exception to interior photography, imply user acceptance, expand the five-surface sample, change the schedule or authorize deployment. Current artwork/prompt: `docs/artwork/CHARCOAL-LEFT.md`.

# Wrapped binding clarification — 24 October 2026

The user selected the narrow artwork wrap and wider right column, then explicitly requested implementation of the Day 02 wrapped-binding plan. This refines the approved cover-only illustration/material treatment.

The existing 16px binding strip may carry an aligned decorative continuation of the current responsive portrait, projected backward by 35° around the visible crease, with restrained ink shading and half the preceding crease-line opacity. Only this narrow strip receives the projection. Keep the main cover flat, white paper edges unprinted and actual native turning axis unchanged. The strip belongs inside the engine-owned cover; native turns, drag reversal and cancellation carry it. No independent turn animation, vendor patch, new library, image generation or extra asset is authorized or required.

The right copy spans seven grid columns with an 8px inset. Use the deliberate subtitle lines “An engineering” / “atlas” and unbroken role/technology/edition words. Presets follow the fitted closed cover's visible width: below 320px = 43/18/14px name/title/meta; 320–447px = 43/24/14px; 448px+ = 57/32/18px. Presets stay fixed through a turn to prevent reflow. Phone fitting uses actual depth and outer gutters; short windows may scroll to preserve readable width. Native page dimensions remain stable.

Retain the current portrait size/vertical centering, move its canvas from −8% to −12% left offset, and extend its loose marks into the binding. This is not permission to alter the original interior photograph, ordinary reveal limits, page registry/navigation, five-surface scope, schedule, turn timing or deployment status. User visual and continuous-motion acceptance remain pending.


## Portrait balance clarification — 24 October 2026

The user requested a more central visual balance without an abrupt left artwork edge. Refine the existing artwork canvas from 96% width / -12% offset to 80% width / -4% offset. This eases the face inward while preserving centered vertical placement, natural image proportions, clear space for lettering and the shared binding artwork coordinates. This supersedes only the preceding exact portrait size/offset; typography, native turn geometry, assets and acceptance limits remain unchanged.




## Right-aligned cover correction — 24 October 2026

The user explicitly requested a larger portrait, flex-end alignment and text-align right, including React, Node.js and TypeScript. Enlarge the shared artwork canvas to 96% with -12% left offset, retaining the aligned illustrated binding. Right-align the cover copy, technology flex rows and edition rows; keep the Portfolio 2026 kicker at left. This supersedes the immediately preceding 80% / -4% portrait balance adjustment. It does not change typography sizes, native opening, assets, original interior photograph or acceptance limits.



## Reference-matched interior portrait and materials — 24 October 2026

The user explicitly approved the reference-matched portrait and materials plan. Generate a photographic seated portrait using the original photograph for identity and docs/artwork/editorial-spread-reference.png only for pose, framing, clothing and lighting. This supersedes the original-interior-photograph display requirement for the introduction page only; retain the original source separately. Keep all text as semantic HTML and factual copy/current year. Dark book surfaces use the reference-derived #282624 charcoal token; paper retains #efe9de with #e0d7cc fiber variation. A single seamless static texture may be shared across page faces with material-specific opacity. Preserve the accepted cover composition, native engine, dimensions/timing, five surfaces, asset budgets, schedule and deployment limits. Generated likeness, visual composition and continuous motion remain pending user acceptance. Source and prompt: docs/artwork/EDITORIAL-PORTRAIT.md.


## Premium monograph materials — 24 October 2026

The user explicitly authorized a focused reference-derived physical-quality correction. Superseding only earlier material restrictions in sections 2 and 4 and the previous shared-dark-surface requirement, the outer hardcover now uses the existing near-black --ink, visibly darker than the #282624 interior charcoal. Permit static, token-driven tonal shading, gutter relief, neutral contact shadows, fine edge highlights and finer paper-stack layering to represent physical construction. These are material/lighting treatments, not decorative gradients or animated shadows. Keep paper #efe9de with restrained #e0d7cc/gray-beige depth, original assets, live HTML text, cover composition, factual copy and five surfaces. Resting contour is optical shading attached to the native sheet; no new mesh, second hinge, rendering library or vendor change. Preserve native timing, responsive readability, accessibility, asset/performance budgets, existing schedule and no deployment. Visual likeness/reference fidelity and continuous motion remain pending human review. Evidence: docs/MONOGRAPH-MATERIALS-REVIEW.md.


## Reference-led redesign — 24 October 2026

The user explicitly requested a comprehensive redesign to resemble `docs/artwork/editorial-spread-reference.png` as closely as possible and approved implementation of the reference-led plan. This supersedes earlier requirements to preserve the existing composition and page dimensions; those requirements remain historical records. The reference guides material, proportion and editorial composition, while all lettering stays semantic HTML and project claims remain factual.

Desktop pages use a width/height ratio of 0.88 with a maximum open spread width of 1536px. At 768–1023px, the facing spread uses the actual height required by its readable content rather than an arbitrary tall minimum or reduced text size. Keep phone single-page behavior and its approved 0.68 ratio. Native page dimensions remain stable during each turn; preserve visible controls, scrolling and at least 16px outer gutters.

Use the near-black `--ink` hardcover, reference charcoal introduction stock and warm paper. The material defaults are 16px of visible fore-edge, 12px of bottom paper depth and 8px board overhang, with fine static grain opacity 0.10 on dark stock and 0.035 on paper. Keep irregular fine paper layers, restrained neutral contact shadows, attached gutter shading and subtle material lighting within the existing palette and asset budgets.

A `.sheet-surface` child inside each engine-owned page may carry a static mask/silhouette and optical sheet contour together with its material and live content. StPageFlip continues to own the page roots, turn geometry and turn shadows. This permits a restrained resting-page impression without a new mesh, second hinge, vendor change, rendering library or independent page animation.

Use a compact outside-book toolbar and reference-led editorial hierarchy: a restrained Selected work heading, four factual project rows and an original interconnected monochrome diagram. The diagram describes the evidenced Vault browser/API upload-signing, direct browser-to-B2 upload and Cloudflare signed-delivery flow; GitHub and Google Drive remain separately identified integrations. Keep labels as live HTML and connector/object geometry as SVG. The current cover portrait/composition and identity-based generated introduction portrait remain; preserve the original identity source and factual course attribution/independent contributions.

The five-surface sample, native cover/interior timings, accessibility and reduced-motion behavior, performance/asset budgets, seven-session/21-hour schedule and October 30 off remain unchanged. This approval authorizes the redesign; it does not establish visual likeness or continuous-motion acceptance, authorize a deployment, or expand the schedule.


## Explicit final-update amendment — 27 October 2026
The user approved pure black ink (#000000), the existing editorial portrait as the sole cover, a cream atlas map replacing the duplicate introduction, purposeful reading-mode motion independent of reduced motion, desktop sticky Vault evidence, and two-author manual testimonial crossfades on each reference face in both presentations. Thirteen surfaces, durable IDs, native engine/timing, authentic content and reduced-motion support remain. This supersedes earlier near-black, illustrated-cover and static-reading requirements. Full scope/checkpoint: docs/FINAL-INTERACTION-UPDATE.md. No publication or schedule extension.

## Approved restoration amendment — 28 October 2026
The user approved the book-focused restoration plan: preserve the portrait composition using the clean transparent editorial portrait on pure-black ink and live HTML copy; use one restrained material stack with 8px fore-edge, 4px bottom depth and 4px board overhang. Remove the trailer, stock-photo carousel, magnetic footer and word-by-word effects. Keep native StPageFlip geometry, immediate readable text, 13 surfaces and factual evidence. Supporting Motion routes/rules and complete testimonial crossfades are allowed; printed text remains anchored. Recorded licensed physical foley and rare synthesized resonance require explicit visitor opt-in, remembered preference, cancellation, hidden/reduced suppression and no hover/scroll audio. No deployment or automatic schedule extension. Implementation and measured results: docs/RESTORATION-UPDATE.md.

## Story-only amendment — 30 October 2026
The user explicitly approved the Stage 3 story plan: illustration plus authentic-colour archive media, native scroll-led scenes, larger purposeful illustrated-object travel and transitions, captions-first narration, and five optional interactions. This overrides sections 2/4/5 only for the isolated story experience where required by that plan; the main book remains unchanged. Keep semantic text, keyboard/touch equivalents, reduced motion, no scroll trapping, no autoplay audio, no mandatory task gates and Motion as the sole story animation library. Implementation: docs/story/STAGE-3.md. No deployment or automatic schedule extension.


## Rooftop Observatory story-only amendment — user approved
The separate /story documentary uses its own dark night-sky design, warm archival materials, handwritten notes, full-colour real archives and Motion-driven 2D narrative. A manually controlled memory carousel may have brief bounded swing after user action; no auto-loop, and reduced motion is still. Original alien-inspired silhouettes and custom opt-in click sound are permitted for the optional watch. Native scrolling, immediate readable semantic text, keyboard/touch, contrast, reduced-motion and performance requirements remain. The book's palette, typography, thirteen surfaces, page-turn, audio and design are unchanged; short route crossfade and entry/return link are allowed. No deployment.


## Reference-led story rebuild — 30 October 2026
The user explicitly approved a close composition match to the Rooftop Observatory reference: layered warm paper, overlapping authentic archives, large illustrated physics and watch scenes, compact editorial controls, native-scroll cinematic progression and a manually controlled hanging-photo gallery. The watch uses newly drawn recognisable fan silhouettes of the original ten Ben 10 aliens, selectable dial, repeatable activation, non-strobing transformation wash and optional custom click sound. This supersedes the earlier four invented symbols only in /story. Static material textures and bounded scene movement remain story-only; keep semantic text, native scroll, reduced motion, keyboard/touch and unchanged book identity. Retrieve 21st source before claiming integration; catalogue denial is a limitation, not permission to bypass retrieval controls. Review the representative sequence before applying its treatment to all remaining chapters. No deployment.


## Stage 5 carousel amendment — 31 October 2026
Adarsh explicitly accepted the story’s current general design and requested the fluid, interactive hanging-photo mechanics of kedhareswer’s 21st carousel. Permit velocity-coupled pendulum swing, critically damped translation, release momentum and small reversible physical settlement only within the story’s manually operated memory carousel. The thread and peg positions must agree; active-print clicks may trigger a short tactile response. Stop scheduling at rest, offscreen, on hide and under reduced motion. No autoplay, idle breeze, mandatory dragging or changes to book motion. This supersedes only the earlier canned/bounded no-spring interpretation for the story carousel. Stage 5 also authorizes critique and polish of the story’s current design, not replacement with another direction.


## Chapter organization and type roles — 31 October 2026
The user explicitly approved the full17-chapter composition/typography plan. Tighten cinematic narration while preserving all original reading text and archive IDs. The isolated story may use three families: EB Garamond400/600 for body/headings, IBM Plex Sans500 for labels/controls, Nothing You Could Do400 for restrained notes. This supersedes the story's former two-serif-plus-system-handwriting treatment and its two-family default only for this approved story system. Self-host Latin WOFF2 with licences. All17 chapters receive explicit, related compositions; automatic alternating columns and indiscriminate paper wrappers are removed. Keep native scroll, semantic text, stable chapter IDs, all70 distinct images/ten local recordings, existing interactions, reduced motion, and the book's identity/return state. User explicitly authorized expansion beyond the earlier representative-sequence gate. Video hosting remains a separate pending decision; no uploads, storage migration or deployment.


## Physics landing sound — 31 October 2026
The user explicitly requests a default-on short thud when the brick and pebble land, without a separate sound toggle. This story-only exception applies to user-triggered predictions and Replay; no sound on load or scroll. Synchronize with actual animation completion, or immediate static outcome under reduced motion. Cancel stale/repeated runs and stop on scene exit, hiding, other media or unmount. Watch opt-in and book audio rules stay unchanged.


## Story section-label emphasis — 31 October 2026
The user explicitly requests accent green for chapter period labels and numbered From the archive labels, with more separation around the archive labels. Permit these selective orientation labels to use the existing story green; this is scoped to /story and does not recolour serif headings, body copy, handwritten chapter numerals or book labels. Reuse existing spacing tokens.


31 October 2026 follow-up: user explicitly requested fixing the missed Omnitrix interaction label. Apply the same existing green to equivalent night-surface interaction, films and recollection section labels. Keep hero/footer labels, watch counters, main headings and paper-stage captions in their established roles.


## Vault recording delivery — 31 October2026
The user supplied the published public-folder manifest and authorized integrating its original filenames/API metadata. This is the previously separate video-delivery follow-up, now approved for playback integration. Resolve signed streams at runtime; preserve stable archive IDs, captions, poster layout, explicit Play, native controls and cleanup. Nine hosted recordings verified; missing unboxing remains local. Retain all local copies as fallback in this task; no uploads, deletion, Vault policy/code changes or portfolio deployment. Book and story visual identity remain unchanged.


31 October2026 hosted-film follow-up: user explicitly replaces YouTube playback with the3 uploaded Vault films in the published subfolder, plus adds laptop unboxing. Permit native Vault film players and Vault playlist links in both story views, preserving exact source-film association, explicit Play, controls, failure/retry handling and media cleanup. All13 videos verified hosted. Original YouTube IDs may remain as provenance/matching identifiers; no YouTube embed fallback required. No book change or deployment.


## Vault custom iframe player — 31 October2026
The user explicitly replaces native browser controls with Vault's own iframe player for all13 recordings/films in both story views. Use the manifest's per-file embed URL, securely normalized to HTTPS on the known Vault host. Retain explicit Play, controls, fullscreen/PiP and a titled responsive frame. Lazy click-to-load presentation and one mounted iframe at a time keep the story usable. Without a documented cross-origin pause API, scene exit/hiding/other media/unmount removes the frame; reopening restarts playback. This supersedes the prior native-player choice only for story video presentation. Book identity unchanged; no deployment.


## Direct Vault controls — 31 October2026 follow-up
User explicitly removes the extra parent Play-to-load gate. Automatically mount near-viewport titled Vault iframes so the provider's own Play control is directly available; keep autoplay disabled. Multiple visible ready frames are permitted, with focus-based reset of other audio frames. Unload on scene exit/hide/unmount and remount paused on return; no fabricated cross-origin pause API. Minimum320px embed control area is a story media sizing token, preserving content aspect within the provider's player. This supersedes the previous click-to-load/one-mounted-frame presentation. All8 responsive/motion states and actual central Play verified; Vault root-height conflict fixed by user. No book change or deployment.


## Reference withdrawal and diagram repair — 31 October2026
The user explicitly requests removing Gautham Chengappa from the public portfolio. Remove his runtime quote, name, role, author control and two public portrait derivatives. Preserve the other3 quotations verbatim and keep historical source/provenance outside shipped presentation; no Git history rewrite. Preserve reference page IDs/folio count; a single remaining author is a direct figure without a redundant tab selector, with appropriate grouped panel semantics and focus recovery. Restore existing book SVG diagrams by restricting generic icon sizing to actual icon SVGs, keep labelled geometry full size, preserve the approved Atlas tokens and responsive diagram-only scrolling. No story redesign or deployment.


## Approved amendment — 3 November 2026, modernization pass

Adarsh approved the complete premium-book implementation plan. Supersede section 2 desk-only palette restrictions: Light stone #d8d6d0 / Dark graphite #343635, Light default with remembered manual choice, one static desk light falloff. Ivory #efe9de and black cover remain. Require fine static grain on all black/charcoal book/story surfaces. Supersede section 4 and prior material geometry with 12px board overhang, 4px board-only radius, 3px board band, 16px maximum fore-edge and 12px bottom page depth. Permit static cloth, page curvature, top-left lighting, neutral contact/ambient shadows; pages stay square. Restore approved portrait at introduction ID in place of cream atlas map, preserve navigation in Contents. Match generated previews using existing portrait assets, live HTML and factual SVG; preserve 13 IDs and content. Compact shell: Contents, Reading view, Light/Dark and bottom arrows; viewport-fit complete object without shrinking readable body text, accessible scroll fallback.

Supersede gesture-dependent density: native hard cover and soft interior pages for all inputs; remove independent perspective spine projection; native progress owns presentation. Retain 1200ms cover, 800ms interior, 180/420ms support, 70ms stagger, 200ms reduced crossfade and prior cover-fit scale exception. /story retains night identity, imagery and interactions, adding static grain and overflow correction. No deployment, new engine/dependency or schedule extension. Accessibility, texture <=30KB, portrait <=200KB, CLS <0.05 and other budgets remain. Approval is implementation authorization, not final visual/live-motion acceptance. Active record docs/MODERNIZATION-IMPLEMENTATION.md.


## Circular page-scroll control — 6 November2026
The user explicitly replaces More below text with a downward arrow inside a paper-coloured circle, attached to its own book page and pinned while content scrolls. Clicking performs a small downward scroll. This is a narrow shape exception to section4’s square/small-radius rule, only for this44px scroll control. Use existing paper/ink/graphite and tokenized geometry, no decorative shadow or animation. Keep it clear of the bounded hover-curl zone, native page ownership, keyboard/touch/focus, bottom hiding and unchanged Reading view. No new engine or deployment.


## Corner placement and smooth native scrolling — 6 November2026
The user explicitly requests a smaller circle in the outer page corner and smooth scroll steps. Supersede the previous curl-safe large right inset: use32px visible paper circle within44px hit area, inset8px from outer/bottom edges. Controls remain part of engine-owned sheets; suppress during native folds/curls/turns to prevent split graphics and restore on read. User-triggered native smooth scrolling is permitted; reduced motion stays immediate. Existing palette/engine/keyboard/touch/Reading behavior and no-deployment boundary remain.


## Professional story closing — 7 November 2026
The user explicitly expands the story from seventeen to twenty chapters, adding professional work, authentic feedback and a final Octoworlds chapter. Preserve all existing chapter IDs and original archive media while renumbering navigation consistently. Approximate EazyGrad freelance start is January 2022; the user clarified Harigurus was about eight months in 2022 (approximately February to late 2022), superseding older 2022–2023 story labels. Learning practice may overlap paid work. Reuse the three remaining authentic testimonials verbatim; no withdrawn author. Feature actual project links and Vault live/source evidence without publishing demo credentials anywhere outside the authorized resume PDF. November 2026 Octoworlds uses Blender; describe the next job as career growth with responsibility and compensation aligned to skills, preserving the affordable-education motivation for ProCodrr. Keep existing story tokens, semantics, reduced motion and book identity. No deployment.



## Framed inspection and story detail — 10 November 2026
The user explicitly requests fullscreen framed inspection and zoom for every story image, plus a main-portfolio inline resume preview with an optional corner download. This authorizes user-controlled inspection scaling/panning beyond reveal limits only inside the modal viewer; use existing story/Atlas tokens and native accessible dialogs. Preserve gallery dragging, keyboard access, focus restoration, reduced motion, original photographs and lazy loading of higher-resolution files. Resume PDF contents remain unchanged and demo credentials remain confined to the authorized PDF. Explicitly restore 2G, the heavier-brick prediction and the imagined last-carriage train prediction and explanation; Faiz supersedes Faz. No new page engine or deployment.
