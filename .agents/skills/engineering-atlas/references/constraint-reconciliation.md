> Approved amendment — 23 October 2026: the user explicitly selected "Apply the recommended package". The accepted resolutions are recorded in `docs/DAY-01-PROPOSAL.md` at the repository root. They supersede the pending proposals below: Cormorant Garamond + EB Garamond with 14px captions; rounded 1.333 type scale with the specified fluid display exception; StPageFlip native fold trajectory/easing and internal geometry styles plus Motion only for separate UI; immediate readable text and maximum 24px heading travel; 200ms reduced-motion crossfade exception; contrasting focus outlines and readable tablet reflow. The original attached specification remains preserved verbatim.

# Constraint reconciliation

25 October 2026 — Task 5.0 reference-section amendment: user explicitly requests authentic colour portraits, complementary tricolour styling, stronger premium editorial emphasis and 21st.dev animation inspiration. Remove visitor-facing previous-portfolio links/mentions; retain source provenance only in repository evidence. This overrides the earlier reference brief's monochrome portraits and source links, scoped to references only. Canonical details are at the top of design-constraints.md. Task 5.0 implementation and automated verification are complete; final evidence/limits: docs/TASK-5.0-REVIEW.md. Native engine, immediate readability, approved motion/reduced-motion rules, schedule and no-deployment boundary remain. Human visual/live-motion acceptance remains separate. Do not treat requested adjectives as permission for forbidden motion or a second page engine.

25 October 2026 — explicit connected-evidence amendment: user approved authentic full-color product screenshots, no grading/overlays, and one muted-gold active-chapter underline (`--accent: #765818`, ink text retained). Product imagery may contain its native colors/appearance; this does not import those styles into the book. Portraits, typography, materials, native engine and seven surfaces stay fixed. User also approved 60 additional minutes for the Day 3 evidence revision; total allowance 22 hours, unchanged later dates/October 30 off, no deployment. Track separately in `docs/DAY-03-REVISION.md`; retain original Day 3 24/24 as historical implementation, not full Vault feature-testing coverage.

This document identifies implementation decisions in the user's specification. It does not amend the verbatim rules in `design-constraints.md`. The amendment above records the user-approved exceptions; the original analysis below is retained for provenance. Resolve only the affected item when needed; these notes do not prevent completing the skill or doing unaffected preparation.

## Scope and known precedence

- The global rules already exist at `C:/Users/Dell/.codex/AGENTS.md`; they apply to other projects as defaults. This repository's `AGENTS.md` and local skill carry the Engineering Atlas overrides. Do not copy this skill to personal skill directories or change global rules as part of this task.
- Project motion timing is 180ms / 420ms / 800ms with 70ms stagger; it overrides the global 150ms / 300ms / 600ms with 60ms stagger. Project scale is at most 1.04, entrance budget at most 1.6s, and CLS below 0.05.
- The project permits gradients only for page-curl shadow and paper-edge shading. The slow diagram dash drift is the explicit exception to the looping prohibition. Neither exception permits other gradients, glows, or loops.
- The new project rules supersede the earlier suggestion of image tilt and the earlier mobile linear-only default. Single-page mobile navigation must now be considered against the requested swipe behavior. An optional accessible reading mode can supplement, but cannot silently replace, required behavior.
- StPageFlip is explicitly permitted in the project document. This does not automatically waive the separate wording about animation-library count, exact hinge behavior, easing, or animated properties.

## Decisions requiring clarification before affected implementation

### C1 - font-family count and type scale (project section 3)

The document names Cormorant Garamond for titles, EB Garamond for body, and Inter for diagram captions while limiting the design to two font families. Choosing EB Garamond for running heads avoids one optional Inter use but does not resolve the caption role. Do not install three families or silently replace the caption font.

Proposed question: choose Cormorant Garamond + EB Garamond, permitting EB Garamond captions, or explicitly allow Inter as a third family. The former is the recommendation, not an adopted decision.

The exact modular ratio 1.333 and the listed role ranges/fluid clamp endpoints also need one reconciled token sheet. Do not assume that arbitrary values inside the ranges satisfy the modular-scale rule. Confirm the complete scale and any role-specific optical exceptions before styling text.

### C2 - entrance motion and immediate reading (sections 1, 5 and 10)

The line reveal specifies `translateY(100%)`, but headings can have line heights greater than the 24px reveal-distance ceiling. Portrait settle lasts 1.2s, while supporting motion follows the sole hero, the sequence must finish within 1.6s, and readable content cannot be delayed more than 300ms. Long list staggers can exceed the same ceiling.

Safe proposal for review: keep essential copy visible immediately, play portrait settle only on the initial opening, keep heading movement within 24px, and limit any remaining reveal delay to 300ms. The original full-line mask distance is not silently replaced by that proposal. Hover color changes can be immediate or achieved with opacity layers, but do not animate `color` or `border-color` in violation of the property restriction. The specified 6px hover nudge is a motion distance, not an additional layout-spacing token.

### C3 - page-turn engine and allowed properties (sections 5 and 9)

The specification allows StPageFlip, describes a precise 2000px CSS perspective and 0-to-minus-180-degree hinge/easing, and limits the project to one animation library. The existing proposal used react-pageflip/StPageFlip for turning plus Motion for micro-interactions. Do not assume that combination, or a library's internal easing and style writes, has an exception.

Before implementing the motion sample, verify the candidate's actual trajectory, easing controls, animated properties, responsive behavior, and compressed runtime size. Ask whether the explicit StPageFlip allowance permits its built-in turn geometry plus one separate general UI animation library. Alternatively choose a single-engine custom hinge, after explaining that a rigid hinge and a soft folding page need not look equivalent. Do not combine both page-turn approaches or claim one guarantees the reference's perceived realism.

### C4 - reduced motion (section 5)

The universal reduced-motion CSS sets all animation/transition durations to 0.01ms with `!important`, while the page change is explicitly a 200ms crossfade. Those declarations cannot both govern the same transition. Propose a narrowly scoped navigation crossfade exception after the reset; all reveals remain immediate. Record user approval before altering the supplied reset behavior.

### C5 - focus visibility and compact layouts (sections 3, 6 and 7)

A 1px `--ink` outline on the `--ink` portrait page is invisible. Propose the existing `--paper` token for focus on dark surfaces while preserving the 1px width and 3px offset. Do not claim the unchanged dark-on-dark outline meets the visible-focus requirement.

Scaling an entire two-page tablet spread proportionally can reduce body text and touch targets below the independent typography/accessibility requirements. Test the actual 768px layout and choose a readable composition without silently shrinking text or targets. If the composition cannot satisfy both proportional spread and minimum legibility, request an explicit responsive exception.

## Measurement notes

The performance values are required targets, not results of creating this skill. Validate on a named device/browser, and document the test profile. INP needs interaction measurements; Lighthouse alone does not establish field INP. Keep third-party turn code within the budget calculation when counting animation JavaScript. Lazy-loading later page contents must not leave the page-turn engine without stable page shells.

The reference diagram's Client/CDN/API/Core/Auth/Queue/Cache/Storage/Runner/Scan order is an approved visual pattern, not evidence that every project actually implements every subsystem. Include only nodes supported by the relevant case study.

## Amendment record

At creation no amendments were approved. The user subsequently accepted the package recorded above. Add the user's explicit decision and the affected rule here when clarified, and update the canonical constraints deliberately rather than introducing an undocumented implementation exception.

23 October 2026 — corner interaction refinement (section 5): user accepted the corrected arrow fold’s appearance and explicitly requested restoration of the corner raise, bounded so hover cannot open/turn a page. Native hover lifts now act only as an affordance; leaving returns the corner, and deliberate click/drag retains native corner-origin turning. The same engine owns all geometry. The canonical source’s appended interaction amendment records this addition. Arrow motion acceptance does not imply acceptance of the subsequent hover refinement or final visual composition.

23 October 2026 — opacity/lift clarification: user supplied screenshots and requested fully opaque paper and a more obvious corner lift on both sides. Keep page faces opaque and isolated, prevent the fixed gutter overlay from painting over a moving sheet, and use a token-driven 96px fixed native hover target over the existing 180ms fast duration. The 48px corner hit area remains independent. Native StPageFlip owns preview frames, turns and drag geometry; the hover target cannot commit a turn. This refines the approved corner affordance and does not relax content-reveal movement limits.

23 October 2026 — responsive input clarification: user accepted the laptop result and requested consistent corner clicks on phone/tablet, alongside the already working arrows. Support corner taps/clicks in single-page and facing-page layouts, retaining the selected top/bottom origin and valid forward/back boundaries. Touch has a direct tap equivalent; hover remains a pointer affordance, not a required touch gesture. Keep native vertical scrolling, diagram scrolling and reduced-motion crossfades. Fix SVG-only favicon delivery with same-mark PNG/ICO/Apple icon fallbacks. Responsive user acceptance remains separate from the recorded laptop acceptance.

23 October 2026 — expanded edges and straight middle turns: user explicitly confirmed “Middle of the outer edge.” Full-height outer strips replace corner-only tap eligibility, with widths derived from 96px/128px tokens and page width; top/bottom corner regions extend 128px vertically. Bounded hover remains fixed at its accepted 96px lift. Middle clicks/taps temporarily select StPageFlip’s native hard-page drawing mode for a straight hinge; read-state completion restores each page’s original soft density. Corners/arrows keep native soft folding. Both modes are public APIs of the same engine; no vendor source, custom turn overlay or second engine is introduced. Project links take priority where their actual targets occupy an edge strip. Interior text selection and native scrolling remain available. Human acceptance of this refinement remains pending.

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

28 October 2026 — approved restoration: the replacement plan supersedes rejected tunnel/carousel/magnetic-footer/word-bloom suggestions. Native StPageFlip plus supporting Motion only, clean portrait composition, explicit sound opt-in, licensed recorded foley, stable printed text, and thinner 8/4/4 material depths. See canonical amendment and docs/RESTORATION-UPDATE.md; automated checks do not establish human audio/motion acceptance.

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
