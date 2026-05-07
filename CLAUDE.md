# Project Rules

These rules apply to Claude Code CLI in **all permission modes** — default, accept-edits, plan, and auto / bypass-permissions. Plan mode is not exempt; planning is work. Auto mode silences per-tool permission prompts but does **not** silence content questions (clarifications, "this would exceed limits, confirm?", post-delivery user checks, **UAT walkthroughs**).

## Project context

> **Fill this in for each project.** Ollie, an app to help children help with reading, they can talk to Ollie, who speaks like like a well renowed teacher who knows how to handle a child with severe ADHD. Any discussion the child will have will be about something related to SCIENCE, TECHNOLOGY, ENGINEERING, ARTS, MATHEMATICS. TARGET AUDIENCE IS KINDERGARTEN TO SIXTH GRADE. IT WILL NOT ACCEPT ANY WORDS THAT ARE NOT MEANT FOR CHILDREN. IT HAS SEVERAL SECTIONS FOR THE CHILDREN AND HAS A SETTINGS SECTION FOR THE PARENTS.

*Example:* "Lumen — an AI tutoring app for learners with severe ADHD. PWA + Capacitor mobile (iOS/Android) + Tauri desktop (Linux/Mac/Windows). Currently in private beta with ~5 active users. Solo developer. Not yet monetized."

## Production quality bar

This is a **scalable, sellable product** standard, not a UI mockup standard. Every implementation task is bound by:

- **UAT-gated done.** Every feature has acceptance criteria written *before* implementation. Tasks are not "done" until the human (you) walks through the criteria and confirms ✅. The `production-quality-gates` skill enforces this.
- **Behavior coverage.** Every UAT criterion has at least one automated test that would catch its regression. Line/branch coverage is a sanity floor (≥70%), not the target.
- **Cross-platform safe areas.** Every UI change addresses safe areas for each surface in scope: iOS (notch / Dynamic Island / home indicator), Android (status bar variants / gesture nav vs 3-button / foldables), web (responsive ≥320px, dark mode, prefers-reduced-motion), desktop (system theme, native window chrome).
- **Platform conventions respected (not full native rewrite).** Material 3 on Android, Apple HIG on iOS, Fluent on Windows, semantic HTML + ARIA on web. Brand identity stays consistent across surfaces; conventions stay native to each.
- **99% uptime SLO.** Every production path has health checks, structured logs, error tracking, synthetic monitoring, and tested rollback. The `setup-observability` and `setup-cicd` skills bootstrap this.
- **Centralized observability mandatory.** Production code paths log structured JSON through the centralized logger module. Errors flow to Sentry (or equivalent). Request IDs correlate end-to-end.
- **Reversible deploys.** No deploy ships without a tested rollback path. Forward-fixes are how SLOs slip.

When the user asks to *build / implement / add / ship / finish* anything, the `production-quality-gates` skill auto-loads and walks through these gates. It triages scope first — quick experiments and refactors can opt out, but the opt-out is logged.

## Before any non-trivial task

1. **Restate the task** in one line so the user can correct misunderstanding.
2. **95% confidence is a hard gate before implementation.** Below 95% is a stop. Resolve by:
   - inspecting local files when the gap might be in the repo or the project summaries already loaded into context;
   - web-searching when the gap is current/external (2026 model/runtime/dependency/pricing/availability/standards/market data);
   - asking one concise clarifying question when neither covers it.
   - Re-evaluate confidence after each step. Do not begin implementation while below 95%.
3. **State search results in one line per source:** what was searched, what was found, how it changed the plan.
4. **Pushback is expected behavior, not the exception.** When you have a candidate alternative to the user's wording, invoke the `better-idea-comparison` skill before implementing. Don't soften, bury, or skip. Don't fabricate alternatives — when the user's approach is already best, say so plainly.

## Cross-platform thinking

Many projects target multiple surfaces. When the user names one (e.g. "on PC", "in the iOS app"), treat it as the *reported symptom* and check whether the same decision affects the project's other surfaces.

Default surfaces to consider for a typical full-stack consumer app: **web** (desktop browser, mobile browser, PWA installed), **iOS**, **Android**, **desktop apps** (where applicable), **server/backend** (affects all clients), **database/schema** (affects any client reading or writing that data).

Customize the surface list per-project in the **Project context** section above.

If a change can affect user-facing behavior across surfaces, include a brief impact note. Mark surfaces *n/a* with a one-line reason rather than inventing concerns.

## 2026 standards

Use current-as-of-2026 practices for frontend, backend, mobile, AI/LLM, and marketing/SEO/GEO work where practical.

## Marketing as a first-class concern

The `marketing-strategy` skill is auto-loaded for any prompt about competitors, positioning, pricing, SEO, GEO, ads, audience, growth, launch, or visibility. It uses the `competitor-analyst` and `growth-strategist` subagents to research the current landscape. **Treat marketing analysis as a normal part of building the product**, not a phase that comes later.

## Activity Log — every completed task

Append a pipe-delimited entry to the highest-numbered `PROJECT_SUMMARY_PART_*.MD`:

```text
[YYYY-MM-DD HH:MM:SS TZ] | Task | What / How / Why | Verification
```

For production work, the verification field includes UAT signoff, CI status, observability wiring, and SLO impact (per the production-quality-gates skill). For skipped-gates work (spike/refactor/tooling), the entry says so explicitly.

The current timestamp is provided in the **SESSION CONTEXT INJECTED BY HOOK** block at the top of this conversation — use that value verbatim. In plan mode, include the proposed entry verbatim in the plan rather than writing it.

## File size limit — 24,000 tokens (enforced by hook)

No `PROJECT_SUMMARY_PART_*.MD` may exceed 24,000 tokens. The `check_part_files` hook blocks edits that push a file over the limit. Split or run `HALF5IME` before adding substantial content when a file is near the limit.

## MCP servers (configured in `.mcp.json`)

Two MCP servers are pre-configured for debugging:

- **`playwright`** — Microsoft's official Playwright MCP. Drives a real browser for self-QA, responsive verification, network inspection, console debugging, screenshots at multiple viewports. Used by the `web-debug` skill. **Say "use playwright mcp" explicitly the first time** to make sure Claude routes through MCP rather than running Playwright via Bash.
- **`mobile`** — Mobile MCP (`@mobilenext/mobile-mcp`). Drives Android (via ADB on Linux/Mac/Windows) or iOS Simulator (macOS only). Used by the `mobile-debug` skill. Requires Android Platform Tools or Xcode depending on target.

Claude Code prompts to approve project-scope MCPs the first time the user starts a session in this project. Both auto-install via `npx` so no separate install step is needed beyond the framework install.

## Skills available (auto-loaded by description match)

**Engineering quality:**
- **`production-quality-gates`** — auto-loads on implementation prompts; enforces UAT, tests, cross-platform, observability, SLO gates
- **`setup-cicd`** — bootstrap CI/CD pipeline (`/setup-cicd`)
- **`setup-observability`** — bootstrap centralized logging + error tracking (`/setup-observability`)

**Debugging:**
- **`web-debug`** — drive a browser via Playwright MCP for self-QA, responsive checks, network/console inspection, screenshots
- **`mobile-debug`** — drive Android/iOS via Mobile MCP for on-device verification, screenshots, accessibility-tree inspection

**Workflow:**
- **`teachm5`** — ADHD-aware teaching mode (`/teachm5` or "TEACHM5 …")
- **`update-tech`** — refresh Tech Stack & Architecture in PROJECT_SUMMARY_PART_1.MD (`/update-tech` or "UPDATE TECH")
- **`half5ime`** — compact and delete activity log entries (`/half5ime` or "HALF5IME")
- **`better-idea-comparison`** — research user's idea vs alternative, take a clear position (auto-loads when Claude has a candidate alternative)

**Marketing:**
- **`marketing-strategy`** — competitive, audience, pricing, SEO/GEO, ads, analytics analysis (`/marketing` or any marketing-related prompt)

## Subagents available

- **`tech-stack-scanner`** — read-only, project-type-aware scanner used by `update-tech` and `setup-cicd`
- **`idea-researcher`** — read-only with web access, used by `better-idea-comparison`; can also be briefed for platform-convention research (Material 3, Apple HIG, etc.)
- **`competitor-analyst`** — read-only with web access, researches competitive landscape (national, global, local)
- **`growth-strategist`** — read-only with web access, researches audience, SEO/GEO, paid acquisition, analytics, pricing; can also be briefed for observability stack research

For ad-hoc codebase exploration, lean on the built-in `Explore` subagent — Claude delegates to it automatically.
