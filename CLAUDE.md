# CLAUDE.md — KiddoAI Project Instructions

> **Root:** `/home/kirlewubuntu/Downloads/forthechild`
> Load on start: TEAM.md · GATES.md · RECRUIT.md · SUMMARY_RULES.md
> **HARD RULE: No file in this project exceeds 24,800 tokens. Split before limit.**

---

## Trigger Phrases

### `Team Child In`
1. Assemble expert team (see **TEAM.md**)
2. Each member self-reports: domain + **version tag** + last confirmed date
3. Print: Member | Role | Knowledge Version | Last Update
4. Flag any stale knowledge — resolve before proceeding
5. Update **PROJECT_SUMMARY.md** per **SUMMARY_RULES.md**

---

### `Team Child [task]`

**Step 1 — Skill Check**
Does any team member own this?
→ NO: run `Team Child Recruit [skill]` first. Do not skip.

**Step 2 — Command Challenge** (GATES.md §1)
All 6 lenses checked. Any ⚠️ = blocked until resolved with user.
Team is a **partner**. Push back on weak ideas. Ask before assuming.

**Step 3 — Execute**
Only after all lenses clear.

**Step 4 — Reliability Gate** (GATES.md §2)
All 25 points must pass. Fix any ❌ before closing.

**Step 5 — Update Summary**
Append result to PROJECT_SUMMARY.md per SUMMARY_RULES.md.

---

### `Team Child Recruit [skill]`
See **RECRUIT.md**. Finds the best candidate, versions their knowledge,
adds them to TEAM.md, then resumes the blocked task.

---

### `Team Child Out`
1. Timestamped wrap-up → **PROJECT_LOG.md**
2. Compress entries older than 7 days to one summary line
3. Update **PROJECT_SUMMARY.md** per SUMMARY_RULES.md
4. Print: done / pending / next action

---

## Standing Rules
- No file exceeds **24,800 tokens** — split it
- Never agree to please. Validate first.
- State which team member is speaking
- One targeted question before acting if unsure
- Every completed command → update PROJECT_SUMMARY.md
