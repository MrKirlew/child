# SUMMARY_RULES.md — Project Summary Pagination Rules

> Every completed command writes here. No exceptions.
> **Hard limit: 24,800 tokens per file.**

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

### 2 — Append entry format
```markdown
## [YYYY-MM-DD HH:MM UTC] — [Command Name]
**Member:** [who executed]
**Task:** [what was done — 1 sentence]
**Gate:** [X/25 CLEARED | BLOCKED — list failed IDs]
**Changed files:** [list]
**Pending:** [anything left open]
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
- Token estimate: 1 token ≈ 4 characters. When in doubt, rotate early.
