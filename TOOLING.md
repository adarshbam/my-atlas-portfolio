# Portfolio tooling setup

Installed on 23 October 2026 at the user's request. The four-page Day 1 prototype is now implemented; see `README.md` for commands and `docs/DAY-01-REVIEW.md` for actual verification.

## Installed skills

| Skill | Source | Installed location |
|---|---|---|
| Vercel React Best Practices | `vercel-labs/agent-skills`, `skills/react-best-practices` | `C:/Users/Dell/.codex/skills/react-best-practices` |
| Frontend Design | `anthropics/skills`, `skills/frontend-design` | `C:/Users/Dell/.codex/skills/frontend-design` |
| Chrome DevTools | `ChromeDevTools/chrome-devtools-mcp`, `skills/chrome-devtools` | `C:/Users/Dell/.codex/skills/chrome-devtools` |
| Motion | Official `motion-ai@14.2.0` installer, global Codex target | `C:/Users/Dell/.agents/skills/motion` |
| Web Design Guidelines | `vercel-labs/agent-skills`, `skills/web-design-guidelines` | `C:/Users/Dell/.codex/skills/web-design-guidelines` |
| Engineering Atlas (project only) | User-supplied portfolio constraints | `.agents/skills/engineering-atlas` in this repository |

Web Design Guidelines was installed following the user's additional explicit request. The custom Engineering Atlas skill is now installed in this repository only, with automatic discovery enabled. Its full source constraints are preserved verbatim; unresolved implementation decisions are documented alongside them. The root `AGENTS.md` instructs portfolio work to use it. The global design defaults already existed in the user's personal `AGENTS.md` and were not modified.

## MCP configuration

Existing Codex servers were preserved. New server definitions are in the user's `C:/Users/Dell/.codex/config.toml`; do not copy that file into this repository because unrelated server configurations can contain credentials.

- `chrome-devtools`: `chrome-devtools-mcp@1.12.0`, launched through Windows `cmd /c npx`. Headless, isolated Chrome profile, 60-second startup allowance. Usage-statistics and CrUX URL submission disabled.
- `motion`: `https://mcp.motion.dev`, configured by the official installer. Free documentation access.
- `motion-plus`: `https://mcp.motion.dev/plus`, also added by this version of the official installer. Optional authenticated paid capabilities; no sign-in or purchase performed.
- Context7 is already connected through the app and was verified in the preceding setup turn.

## Verification

- All five installed `SKILL.md` files exist and are nonempty.
- The additional project-local Engineering Atlas skill passed the bundled validator; its references and UI metadata were verified, and the copied source document matches the attachment byte for byte (SHA-256 `483caaef9443394540aea8e97ea8dc6743a17a4bf47d0a3cf2554e2b981c9d4b`). These checks establish packaging and source preservation, not compliance of a future UI.
- Chrome DevTools MCP initialized as version 1.12.0, listed 32 tools including performance tracing, and opened `about:blank` in isolated headless Chrome. The verification client was then closed.
- Motion's free MCP initialization and tool listing succeeded over Node's HTTP transport, exposing `search-motion-docs`. Python urllib received HTTP 403; Node returned HTTP 200 and valid server information.
- The new skills should become available on the next turn. If skills or MCP tools do not appear, reload/restart Codex to refresh discovery.

These setup checks verify installation/connectivity, not the future portfolio's visual quality or animation performance.
