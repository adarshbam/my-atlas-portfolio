# Day 1 — motion prototype proposal

Status: accepted. User explicitly selected "Apply the recommended package" on 23 October 2026. The resolutions and token proposal below are approved project amendments.

## Four major tasks

1. Constraint decisions, tokens and sample content — 30 minutes.
2. React foundation and four-page candidate — 60 minutes.
3. Desktop, drag/reversal, keyboard, phone and reduced-motion checks — 45 minutes.
4. Bounded corrections, live preview and review report — 45 minutes, including the daily correction allowance.

The sample has two spreads: original portrait + selected-work index; Vault Storage contribution summary + representative architecture diagram. It is a motion feasibility sample, not the completed 12-surface portfolio. No publication in this milestone.

## Proposed constraint resolutions

- Two font families: Cormorant Garamond and EB Garamond. Use EB Garamond for diagram captions at 14px, replacing the conflicting Inter/11–12px requirement.
- Type scale: 18px base, ratio 1.333, rounded to whole CSS pixels: 10, 14, 18, 24, 32, 43, 57, 76. Keep the explicitly requested display clamp of 48–96px as a fluid optical exception.
- StPageFlip owns page geometry, clipping and curl shadows, with 800ms as its completion duration. Accept its native fold trajectory/easing and internally calculated styles in place of the exact rigid CSS-hinge recipe. Motion is permitted only for separate UI micro-interactions, never the same page frame. No GSAP or parallel custom turn implementation.
- Essential text is readable immediately. Heading reveal distance is capped at 24px; staged body-text entrances are omitted. Initial portrait settle may last 1.2s without delaying copy or controls. No decorative motion competes with turning.
- Reduced motion removes movement and shows content immediately; a narrowly scoped 200ms page crossfade is the explicit exception to the universal duration reset.
- Use the existing paper token for focus outlines on dark pages, ink on light pages. Keep 1px outline and 3px offset.
- At tablet widths retain facing pages but permit content reflow/page height adaptation to preserve readable text and 44px controls instead of scaling all text and targets down.

## Token proposal

Palette remains exactly the supplied ink, ink-soft, paper, paper-deep, graphite, rule, rule-dark, desk and accent tokens. Accent is unused in the first prototype. Spacing remains 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128px; page margins are at least 8%. Borders remain 1px and book radius at most 2px.

Motion timings: 180ms hover/focus, 420ms small reveals, 800ms page turn, 70ms stagger. Easing remains the supplied cubic-bezier definitions. Additional named tokens encode only explicitly prescribed values: 200ms crossfade, 1.2s portrait settle, 24px reveal ceiling, 6px hover nudge, 44px controls and 2000px perspective.

## Verification evidence

Record actual behavior at 375, 768, 1280 and 1920px; normal and reduced motion; pointer drag and reversals; touch swipe; buttons; keyboard and visible focus; hidden-page tab order; page announcements; navigation boundaries; resize/recovery; and console errors. Report measured sizes and loading observations separately from unverified Lighthouse/field INP/60fps targets. User motion acceptance remains pending until live review.

21st catalog search was attempted and returned "Not signed in". The user-supplied component is sufficient to proceed without hosted generation or another paid service.
