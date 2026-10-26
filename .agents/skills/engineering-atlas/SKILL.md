---
name: engineering-atlas
description: Apply Adarsh Singh's binding editorial-book design constraints when planning, building, animating, or reviewing the Engineering Atlas portfolio in this repository. Use for its page layouts, typography, tokens, diagrams, responsive navigation, accessibility, and motion acceptance. Do not impose this portfolio's palette, book layout, or motion choices on other projects.
---

# Engineering Atlas

Create a calm editorial hardcover portfolio: a dark portrait page facing cream paper, serif typography, tracked running heads, hairline rules, generous margins, and monochrome technical diagrams. Use Adarsh's original portrait and evidenced project content. The supplied generated spread guides composition; it is not a substitute for his face, live HTML text, or a working animation.

## Scope and source of truth

This is a repository-local skill. It does not install global design preferences or authorize implementing, publishing, spending, or changing unrelated projects.

Before planning or changing this portfolio's UI:

1. Read the repository's `AGENTS.md` and existing design tokens.
2. Read [the complete project constraints](references/design-constraints.md). This is the user's verbatim specification, preserved from the attached document.
3. Read [constraint reconciliation](references/constraint-reconciliation.md) before choosing fonts, motion, responsiveness, focus styling, or the page-turn engine. Unresolved entries are not approved exceptions.

Global design instructions are defaults. The project constraints override them where specific: use the project's exact palette, `180ms`/`420ms`/`800ms` durations, `70ms` stagger, book presentation, stricter `CLS < 0.05`, and project-specific animation limits. Where the project is silent, retain the global defaults. Latest explicit user amendments govern; update this skill's source and reconciliation record when the user changes a rule. Do not silently treat an ordinary conflicting feature request as a rule amendment. Explain the applicable rule and offer a compliant path.

The older roadmap and concept previews are historical planning aids. Where their fonts, micro-interactions, mobile presentation, timing, color, or performance targets conflict with the attached project rules, the attached rules take precedence.

## Apply the constraints

- Propose a token sheet before new UI work. Draw from the exact allowed palette, spacing scale, typography roles, motion durations, and easings in the specification. Read values from tokens in components; values stated in approved patterns also need named tokens before use. Calculated pointer positions and geometry are runtime measurements, not permission for arbitrary visual constants.
- Build semantic structure, page grid, whitespace, and typography first. Add only the approved animation patterns after the static composition is readable and accepted. Keep all book text as selectable HTML, including diagram labels where practical; render connector geometry as vectors.
- Apply the actual portrait using the prescribed monochrome treatment, with meaningful alt text. Use authentic project screenshots and original explanatory diagrams. Do not invent metrics, architecture, production maturity, or employment contributions.
- Keep each page's margins at least 8% of its width; use the approved spacing scale for layout spacing. Keep page hairlines at 1px and the book radius no greater than 2px. No cards, pill buttons, stock 3D artwork, colored icons, or default UI-kit appearance.
- Treat shadcn-compatible paths and TypeScript aliases as file organization only. They do not authorize using a UI kit or its visual defaults. The current UI-kit prohibition supersedes older generic instructions to install default shadcn styling.
- Use the specified two-page, proportionally scaled tablet, and single-page mobile presentations. Keep at least 16px side gutters, 44px touch targets, no horizontal document overflow, and a responsive diagram. The permitted diagram-only horizontal scroller must not create document-wide overflow.
- Use native buttons for page actions and anchors for destinations. Maintain headings, visible keyboard focus, arrow-key navigation, correct visible-page focus order, and an announcement after the completed page change. Do not intercept arrow keys inside editable controls or unrelated interactive widgets.
- Render essential text immediately. Do not hide body content or disable input to wait for an entrance. Respect the 300ms reading-delay ceiling and the specified entrance-sequence budget together.

## Motion and feasibility

Use the specified 800ms page turn and approved easing as the target. A page-turn engine and a general animation library are separate responsibilities, but the specification's one-library/no-mixing language needs resolution before selecting both. Do not add GSAP and Motion together, or overlay a custom turn on a library-driven page.

Begin with a small representative interactive sample before expanding the book. Compare continuous live playback with the reference; inspect page faces, reversal/release, shadows, attached images, and readable type. A still image, successful build, or automated test cannot establish accepted motion quality.

Use only the approved properties and patterns. Avoid forbidden effects, competing hero animations, overshooting springs, persistent `will-change`, and indefinite loops except the explicitly permitted slow diagram dash drift. If using a motion library that defaults to springs, explicitly configure non-overshooting token-driven timing. Avoid decorative node labels or data flows not supported by the actual case study.

If two binding rules cannot be satisfied together, record their section numbers, the observed incompatibility, and the smallest proposed amendment. Continue unaffected preparation. Ask for the user's choice before implementing a deviation; do not repeatedly replace the whole architecture or expand the schedule to avoid an unresolved constraint.

## Review and handoff

Use the full definition of done in the source specification. At each UI handoff, check 375px, 768px, 1280px, and 1920px, plus reduced motion, touch targets, keyboard navigation, page announcements, focus visibility, overflow, console errors, and text/image stability.

Measure the declared budgets: LCP below 2.5s, CLS below 0.05, INP below 200ms, animation JavaScript at most 60KB gzipped, portrait at most 200KB, and texture at most 30KB. Record the browser, device, test conditions, and whether results are lab or field observations. Do not call a Lighthouse blocking-time metric INP or claim field INP from a single lab run. Treat 60fps, Lighthouse Performance at least 90, and Accessibility at least 95 as targets until measured; successful automated checks do not prove WCAG compliance or human-perceived smoothness.

Report changed behavior, evidence, remaining unverified checks, and any approved amendments. Keep acceptance of visual direction, acceptance of live motion, completion of implementation, and deployment status distinct in the project's status record.
