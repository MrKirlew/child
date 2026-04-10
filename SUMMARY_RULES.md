# SUMMARY_RULES.md — Project Summary Pagination Rules

> Every completed command writes here. No exceptions.
> **Hard limit: 24,800 tokens per file.**
> Updated: 2026-04-09 — session numbering, Blocks field, HQ briefing entry added

---

## File Chain

```
PROJECT_SUMMARY.md        ← always the CURRENT file (most recent entries)
PROJECT_SUMMARY_PART1.md  ← overflow from PROJECT_SUMMARY.md
PROJECT_SUMMARY_PART2.md  ← overflow from PART1
... and so on
```

**Reading order is newest-first.**
`PROJECT_SUMMARY.md` always contains the latest entries.
Older entries paginate outward into PART1, PART2, etc.

---

## Update Protocol (run after EVERY completed command)

### 1 — Check current file size
Estimate token count of `PROJECT_SUMMARY.md`.

- **Under 22,000 tokens** → append new entry, done.
- **22,000–24,800 tokens** → append new entry + add pagination footer + rotate.
- **Over 24,800 tokens** → STOP. Rotate first, then append. Never exceed the limit.

### 2 — Entry formats by command type

**`Team Child [task]` entry:**
```markdown
## [YYYY-MM-DD-SN HH:MM UTC] — [Task Name]
**Session:** [YYYY-MM-DD-S1]
**Member:** [who executed — state role]
**Task:** [what was done — 1 sentence]
**Gate:** [X/25 CLEARED | BLOCKED — list failed point IDs]
**Changed files:** [list]
**Blocks:** [open BLOCKED items with owner, or "None"]
**Pending:** [anything left open]
---
```

**`Team Child HQ` entry:**
```markdown
## [YYYY-MM-DD-SN HH:MM UTC] — HQ Briefing
**Session:** [YYYY-MM-DD-S1]
**Member:** Growth & Marketing Strategist (full team)
**Market Pulse:** [1 sentence — what's trending]
**Competitor Scan:** [1 sentence — any rank changes]
**ASO Status:** [keyword rank snapshot]
**Retention:** [D1/D7/D30 if available, or "No data yet"]
**Top 3 Growth Levers:** [bullets]
**Child Safety Check:** [All tactics passed §0 filter | Tactics removed: list]
**Actions assigned:** [bullets with owner]
**Pending:** [anything deferred]
---
```

**`Team Child In` entry:**
```markdown
## [YYYY-MM-DD-SN HH:MM UTC] — Session Open
**Session:** [YYYY-MM-DD-S1]
**Member:** Dev Lead (full team)
**Knowledge status:** [All current | Stale: list members]
**Open blocks from last session:** [list | None]
**CI status:** [✅ green | ❌ failing — issue]
---
```

**`Team Child Out` entry:**
```markdown
## [YYYY-MM-DD-SN HH:MM UTC] — Session Wrap-Up
**Session:** [YYYY-MM-DD-S1]
**Member:** Dev Lead (full team)
**Done:** [bullets]
**Pending:** [bullets]
**Blocks:** [BLOCKED items with owner | None]
**Next:** [one sentence]
**Gate:** [X/25 CLEARED | BLOCKED — list failed IDs | N/A]
---
```

**`Team Child Recruit [skill]` entry:**
```markdown
## [YYYY-MM-DD-SN HH:MM UTC] — Recruit: [Member Name]
**Session:** [YYYY-MM-DD-S1]
**Member:** Dev Lead
**Recruited:** [Name] — [Role]
**Gap filled:** [1 sentence]
**Knowledge version:** [domain · version · date]
**Blocked task resumed:** [task name | N/A]
---
```

### 3 — Rotate when at limit
1. Rename current `PROJECT_SUMMARY.md` → `PROJECT_SUMMARY_PART[N].md`
   where N = next available number
2. Create fresh `PROJECT_SUMMARY.md` with header:
```markdown
# PROJECT_SUMMARY.md — KiddoAI
> Continued from PROJECT_SUMMARY_PART[N].md
> Root: /home/kirlewubuntu/Downloads/forthechild
---
```
3. Append the new entry to the fresh file
4. Add footer to the rotated PART file:
```markdown
---
*Continued in PROJECT_SUMMARY.md*
```

### 4 — Cross-file index (top of every SUMMARY file)
```markdown
| File | Entries | Date Range |
|------|---------|------------|
| PROJECT_SUMMARY.md | [N] | [start] – present |
| PROJECT_SUMMARY_PART1.md | [N] | [start] – [end] |
```
Update this table in `PROJECT_SUMMARY.md` after every rotation.

---

## Rules
- Never merge or delete PART files — they are the permanent record
- The index table lives only in `PROJECT_SUMMARY.md` (the current file)
- If a command is blocked by the Reliability Gate, still write an entry marked ❌
- If a `Team Child HQ` runs with no new actions, still write the briefing entry — it is a market snapshot
- Token estimate: 1 token ≈ 4 characters. When in doubt, rotate early.
- Session ID format: `[YYYY-MM-DD-S1]`, `[YYYY-MM-DD-S2]` — never omit it from any entry
