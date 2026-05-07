# Claude Code Project Framework

A drop-in `.claude/` configuration that turns any project into a production-grade build. Three layers:

- **Engineering quality** — UAT-gated done, behavior coverage, cross-platform safe areas, platform-convention parity, centralized observability, 99% uptime SLO, reversible deploys
- **Marketing** — competitive analysis, audience research, pricing, SEO + GEO (Generative Engine Optimization), paid acquisition, analytics
- **Workflow** — ADHD-aware teaching, tech-stack maintenance, activity log compaction, idea comparison

Designed for solo developers and small teams who want every project to inherit the same quality bars and workflows without rewriting CLAUDE.md each time.

## What's in this folder

```
.claude/
├── CLAUDE.md                                  # Slim ground-rules with Project context section to fill in per project
├── settings.json                              # Hook configuration
├── skills/
│   ├── production-quality-gates/SKILL.md      # UAT + tests + cross-platform + observability + SLO enforcement (auto-triggered on every implementation task)
│   ├── setup-cicd/SKILL.md                    # Bootstrap CI/CD (lint + test + build + deploy + rollback)
│   ├── setup-observability/SKILL.md           # Bootstrap centralized logging + error tracking
│   ├── teachm5/SKILL.md                       # ADHD-aware teaching mode
│   ├── update-tech/SKILL.md                   # Refresh tech stack in PART_1
│   ├── half5ime/SKILL.md                      # Compact activity log
│   ├── better-idea-comparison/SKILL.md        # Research alternative, take a position
│   └── marketing-strategy/SKILL.md            # Competitive / audience / pricing / SEO / GEO / ads / analytics
├── agents/
│   ├── tech-stack-scanner.md                  # Read-only, project-type-aware repo scanner
│   ├── idea-researcher.md                     # Read-only, web-enabled, per-candidate research
│   ├── competitor-analyst.md                  # Read-only, web-enabled, competitive landscape (national / global / local)
│   └── growth-strategist.md                   # Read-only, web-enabled, audience + SEO/GEO + paid + analytics + pricing
└── hooks/
    ├── session_start.sh                       # Inject date + summary file contents at session start
    └── check_part_files.sh                    # Enforce 24k token limit + flag append-instead-of-replace
```

## The production quality bar

This framework treats every project as a *scalable, sellable product* by default. The `production-quality-gates` skill auto-loads on any implementation prompt and enforces:

| Gate | What it checks |
|---|---|
| **UAT criteria written first** | Before any code: numbered list of observable behaviors that prove the feature works. User reviews and approves before implementation begins. |
| **Cross-platform safe areas** | Each surface from Project context gets explicit handling: iOS (notch/Dynamic Island/home indicator), Android (status bar/gesture nav/foldables), web (≥320px, dark mode, prefers-reduced-motion), desktop (system theme, native chrome). |
| **Platform conventions** | Material 3 on Android, Apple HIG on iOS, Fluent on Windows, semantic HTML+ARIA on web. Brand consistent, conventions native. |
| **Observability hooks** | Structured logs at named points, errors captured to Sentry/equivalent, request IDs propagated. Without observability the SLO is unmeasurable. |
| **Behavior-coverage tests** | Every UAT criterion has at least one automated test that would catch its regression. 70% line coverage as sanity floor, not the target. |
| **Pre-merge verification** | CI green, lint passes, types pass, no regressions, accessibility checked, docs updated. |
| **UAT walkthrough with the user** | Human walks through every criterion, ✅/❌ each. Task is not "done" until every ✅. **No mode bypasses this.** |
| **Post-deploy SLO check** | Health check returns 200, synthetic monitor green, no error spike, rollback plan tested. |

The skill triages scope first — quick experiments and refactors can opt out, but the opt-out is logged in the activity log so there's an audit trail.

### What 99% uptime actually means

99% uptime allows ~3.65 days of downtime per year (≈14 minutes/day, ≈7 hours/month). Achievable with: health checks + auto-restart, synthetic monitoring (UptimeRobot / BetterUptime / Pingdom), alerting on health check failure, documented manual rollback. Stricter SLOs (99.9% / 99.95% / 99.99%) require redundancy, blue/green deploys, and multiple regions — out of scope for "loose 99%" but the same scaffolding scales up.

## Installing for a new project

1. **Copy the `.claude/` folder into your project root:**
   ```bash
   cp -r path/to/claude-project-framework/.claude /path/to/your/new-project/
   ```

2. **Make hooks executable:**
   ```bash
   chmod +x /path/to/your/new-project/.claude/hooks/*.sh
   ```

3. **Move CLAUDE.md to project root** (Claude Code reads `CLAUDE.md` from the project root, not from inside `.claude/`):
   ```bash
   mv /path/to/your/new-project/.claude/CLAUDE.md /path/to/your/new-project/CLAUDE.md
   ```

4. **Fill in the Project context section** in the project-root `CLAUDE.md`. Without it, the marketing skill, cross-platform thinking, and production-quality-gates can't do their jobs. Example:

   ```markdown
   ## Project context
   FocusFlow — Pomodoro-and-tasks app for ADHD adults. PWA + iOS + Android. Pre-launch (alpha with ~10 users). Solo developer based in Houston, TX. Plan to monetize with $5/mo subscription after public launch.
   ```

5. **Bootstrap infrastructure** the first time you start working on a serious project:
   ```
   /setup-observability    # Pick a stack and wire it up
   /setup-cicd             # Generate workflows + health check + rollback
   ```
   These can also be invoked by their natural-language equivalents ("set up observability", "add CI"). Run them in either order, but observability before CI is slightly better since CI deploys can then verify observability is wired.

6. **(Optional) Create your first PROJECT_SUMMARY_PART_1.MD** with these sections so the SessionStart hook has something to load:
   ```markdown
   # FocusFlow — Project Summary Part 1

   ## Project description
   [paste from CLAUDE.md Project context]

   ## Tech Stack & Architecture
   [empty — UPDATE TECH will populate this]

   ## Activity Log
   [empty — post-task entries land here]
   ```

7. **Restart Claude Code** if it was running. Hooks, agents, and skills are picked up at session start.

## Using the skills

### Engineering quality

| Trigger | Skill | What it does |
|---|---|---|
| "build / implement / add / ship X" (or any feature work) | `production-quality-gates` | Auto-loads. Triages scope, enforces UAT + tests + cross-platform + observability + SLO gates. |
| `/setup-cicd` | `setup-cicd` | Auto-detects platform/stack, generates lint/test/build/deploy workflows, adds health check + rollback. |
| `/setup-observability` | `setup-observability` | Recommends stack per project, generates SDK config, central logger module, "what to log" guide. |

### Workflow

| Trigger | Skill | What it does |
|---|---|---|
| `TEACHM5 explain X` | `teachm5` | ADHD-aware lesson with delivery + visuals + interaction planning + post-delivery confirmation |
| `UPDATE TECH` | `update-tech` | Scans repo via `tech-stack-scanner` subagent, replaces stale Tech Stack section in PART_1 |
| `UPDATE TECH with staleness check` | `update-tech` | Same + dependency staleness audit (web-checks each pinned version) |
| `HALF5IME` | `half5ime` | Compacts and **deletes** old Activity Log entries in the highest-numbered PART file |
| Proposing a candidate alternative | `better-idea-comparison` | Auto-loads — runs two `idea-researcher` subagents in parallel, takes a position |

### Marketing

| Trigger | What happens |
|---|---|
| `MARKET CHECK` or `/marketing` | Full audit — both subagents in parallel, synthesized into a Marketing Brief |
| "Who are my competitors?" | `competitor-analyst` only — landscape across national, global, local |
| "How should I price this?" | `growth-strategist` focused on pricing benchmarks |
| "SEO audit" / "GEO audit" | `growth-strategist` focused on SEO + GEO (target prompts, citation gaps, AI crawler accessibility) |
| "Should we run ads?" | `growth-strategist` focused on paid acquisition fit |
| "Who's my audience?" | `growth-strategist` focused on audience research |
| "How do we measure user behavior?" | `growth-strategist` focused on analytics + heat maps (Clarity vs Hotjar recommendations) |

## Testing each piece

### Hooks

```bash
cd /path/to/your/project
bash .claude/hooks/session_start.sh
```
Should output the current date/time and the contents of every `PROJECT_SUMMARY_PART_*.MD`.

```bash
yes "test " | head -c 100000 > PROJECT_SUMMARY_PART_99.MD
echo '{"tool_name":"Edit","tool_input":{"file_path":"'$PWD'/PROJECT_SUMMARY_PART_99.MD"}}' | bash .claude/hooks/check_part_files.sh
echo "Exit code: $?"
rm PROJECT_SUMMARY_PART_99.MD
```
Should print "BLOCKED" and exit 2.

### Skills

Inside Claude Code: `What skills do you have for this project?` It should list all eight: production-quality-gates, setup-cicd, setup-observability, teachm5, update-tech, half5ime, better-idea-comparison, marketing-strategy.

To force-trigger the production gates: `Implement a feature where users can export their data as CSV.` You should see Claude triage scope, then walk through Gate A (UAT criteria), Gate B (cross-platform), Gate C (conventions), Gate D (observability), Gate E (tests) **before** writing any code.

### Subagents

`/agents` should list `tech-stack-scanner`, `idea-researcher`, `competitor-analyst`, `growth-strategist` alongside the built-ins.

## Customizing per project

The customization point is the **Project context** section at the top of CLAUDE.md. Everything else stays the same across projects. Examples:

**Solo Python CLI:**
```markdown
## Project context
csvwizard — Python CLI for cleaning messy CSVs. Single surface (terminal). Open-source, MIT license. Distributed via PyPI. Pre-1.0. Considering paid hosted API tier later.
```
Cross-platform thinking is mostly n/a. Production-quality-gates still applies — UAT is "command behaves correctly," safe areas n/a, platform conventions = follow CLI conventions (proper exit codes, Unix piping, --help text). Observability is structured logs + error tracking. SLO is "doesn't crash on common inputs."

**B2B SaaS:**
```markdown
## Project context
SignalDesk — B2B SaaS for support teams to triage Slack-based support requests. Web app (React + FastAPI) + Slack integration. Beta with 3 design partners. Plan to launch at $99/seat/mo after 10 partners onboarded. Target: US tech companies, 50-500 employees.
```
Cross-platform = web + Slack. Production-quality-gates: full set, with extra weight on multi-tenant isolation. Marketing: LinkedIn ads, B2B GEO target prompts, G2/Capterra presence.

## Customizing the framework itself

**Tighten/loosen the SLO target.** The 99% standard lives in `production-quality-gates/SKILL.md` and is referenced by `setup-cicd`. Edit if you want to start at 99.9%.

**Change the coverage floor.** The 70% sanity floor is in `setup-cicd/SKILL.md`. Edit `--cov-fail-under=70` to your taste.

**Replace the recommended observability stack.** Edit the recommendation matrix in `setup-observability/SKILL.md`. The skill is opinionated by default but the matrix is editable.

**Add a new skill / subagent.** Drop a folder/file into `.claude/skills/<name>/` or `.claude/agents/`. Claude auto-discovers on next session start.

## Mode behavior summary

| Mode | What happens |
|---|---|
| **default** | Hooks fire normally; per-tool permission prompts gate edits; skills auto-load. |
| **accept-edits** | Hooks fire; edits proceed without per-tool prompts; skills auto-load. |
| **plan** | Hooks fire (SessionStart loads context); skills produce plans instead of executing; PostToolUse won't trigger because no edits happen. **The production-quality-gates skill produces the full pre-implementation gate output as the plan**, which the user reviews before execution. |
| **auto / bypass-permissions** | Hooks fire; edits proceed without prompts; skills auto-load; **content questions still pause for user input** — including the UAT walkthrough at the end of every implementation task. Auto mode does NOT skip UAT. |

## Troubleshooting

**Skills don't appear to load.** Check `.claude/skills/<name>/SKILL.md` exists with valid YAML frontmatter. Restart Claude Code. Run `claude --debug`.

**Hooks don't fire.** `chmod +x .claude/hooks/*.sh`. Validate `.claude/settings.json` with `jq`.

**SessionStart output is too long.** Symptom of summary files near the 24k limit. Run HALF5IME, or edit `session_start.sh` to be selective.

**Production-quality-gates feels too heavy for small changes.** That's the design. Either:
- Tell Claude explicitly "this is a spike, skip gates" — it'll log the opt-out
- Tell Claude "this is a refactor, no behavior change" — lighter gates apply
If you find yourself opting out frequently, the project might be in a stage where you want to disable the skill temporarily; remove or rename `production-quality-gates/SKILL.md` and add it back when production work resumes.

**Subagent doesn't get invoked.** Description field is the trigger. Make it more specific or invoke explicitly: `Use the competitor-analyst subagent to map competitors.`

**Marketing skill returns generic advice.** Project context is empty or vague. Fill it in with specifics.

**The 24k limit hook seems off.** Estimator is `chars / 4`. Tune `HARD_LIMIT` if needed.

## Token budget

| | Without framework | With framework |
|---|---|---|
| Always-loaded CLAUDE.md tokens | 2-4k for a serious project | ~1,200 |
| Skills (lazy-loaded) | n/a | 0 unless triggered |
| Subagents (separate context) | n/a | 0 main-context impact |
| Per-session hook injection | manual | automatic |

Skills add up to roughly 30k tokens of content total, but **none of it loads unless triggered.** That's the win — comprehensive depth without per-turn cost.

## Subagent count vs. recommended cap

This framework ships **four custom subagents** — exactly at the docs-recommended ceiling. The two new marketing concerns (competitor analysis, growth research) got dedicated subagents because they need different briefing patterns. The two production-infrastructure skills (`setup-cicd`, `setup-observability`) deliberately do *not* get dedicated subagents — they brief existing ones (`tech-stack-scanner` for repo context, `growth-strategist` for observability stack research) instead of adding agent #5.

If you find yourself wanting another subagent, first try briefing an existing one with a different focus. The cap is real.
