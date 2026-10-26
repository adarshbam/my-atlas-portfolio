# Engineering Atlas project instructions

These instructions apply to the Engineering Atlas portfolio in this repository only. The user's global design constraints remain defaults for other projects and for topics not overridden here.

## Binding design source

For portfolio planning, UI implementation, animation, or visual review, use the repository-local `engineering-atlas` skill at `.agents/skills/engineering-atlas/SKILL.md`.

Before any UI change, read the complete user specification at `.agents/skills/engineering-atlas/references/design-constraints.md` and the unresolved decisions at `.agents/skills/engineering-atlas/references/constraint-reconciliation.md`. The full specification is binding, not optional inspiration.

The project specification overrides global defaults where it is specific, including its exact palette, 180ms / 420ms / 800ms durations, 70ms stagger, 1.04 maximum scale, 1.6s entrance budget, and CLS below 0.05. Define tokens before building; components consume tokens. Keep the printed-book identity and only approved animation patterns. No default UI-kit styling.

Project rules also override older roadmap suggestions or previews that conflict with them. Preserve the original portrait and factual project contributions. Keep content as semantic HTML. The generated reference image establishes a visual direction, not a proven animation or approved substitute portrait.

When a request conflicts with a binding rule, explain the specific section and offer a compliant route. When the user explicitly amends a rule, update the project references accordingly. Do not silently relax an internal contradiction or infer permission to expand the schedule. Continue unaffected preparation while a specific decision awaits clarification.

## Work state

Read `HANDOFF.md` first for the current phase, user decisions, verification limits and exact next action. It is the cross-model continuation entry point, including for the user's manually selected Gemini Argan / Argan 2 backup. Then read the current day's plan linked there.

Read `PROJECT-STATUS.md` and `PORTFOLIO-ROADMAP.md` to resume the current work. Read `TOOLING.md` when tool availability matters. The seven planned sessions total 21 hours; October 30 is off. Creating this skill is preparation, not completed portfolio implementation.

The first implementation milestone is a small representative book sample reviewed in continuous live use before expanding all spreads. Keep motion acceptance distinct from static visual approval and automated check results. No deployment is authorized by loading this skill.

## Durable checkpoints and model changes

The user explicitly requested repository-backed handoffs on 25 October 2026. Keep `HANDOFF.md`, `PROJECT-STATUS.md` and the active day plan current after each meaningful completed step, user decision, failed verification or interruption, and before long-running operations. Record the in-progress operation before starting it, then replace that entry with its result. Save exact paths, commands, observed results, unfinished work and the next bounded action; do not rely on chat history or another model's memory.

When usage information is available, check it before substantial work and at major task boundaries. At 90% used in a reported applicable limit, prepare the handoff early. At about 95%, save a final checkpoint at a safe operation boundary and tell the user where to resume instead of starting another large task. Usage is a snapshot shared with other account work; no exact threshold notification or last-moment write is guaranteed. If usage data is unavailable, say so and continue checkpointing routinely. Do not conflate context-window usage with account quotas.

The user controls switching to Argan / Argan 2. Do not invoke a backup model, create a chat, send a handoff to another chat, or schedule a monitor without the user's explicit instruction. Keep handoff files free of credentials and private customer data. This policy applies to this repository; it is not a change to global settings.
