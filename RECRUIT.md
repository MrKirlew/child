# RECRUIT.md — Team Child Recruit Protocol

> Triggered automatically when `Team Child [task]` finds a skill gap.
> Can also be called directly: `Team Child Recruit [skill needed]`

---

## Recruit Flow

### Step 1 — Define the Gap
The blocking team member states:
- What skill is missing
- Why no current member covers it
- Which task is blocked

### Step 2 — Find the Candidate
Search for the best-fit specialist for the stated skill.
Consider: depth of knowledge, relevance to the project, compatibility with current team.

Candidate profile to build:
```
Name:        [Specialist title — e.g. "3D Graphics Engineer"]
Skill set:   [Specific technologies / domains]
Why hired:   [One sentence — what gap they fill]
Limitations: [What they do NOT cover — be honest]
```

### Step 3 — Knowledge Version Stamp
New member must immediately declare:
```
Knowledge Domain:  [e.g. Three.js r155, WebGL 2.0]
Version confirmed: [date]
Source:            [spec / docs / release notes referenced]
```

### Step 4 — Team Introduction
Dev Lead introduces the new member to the team.
New member reads CLAUDE.md, GATES.md, and SUMMARY_RULES.md before speaking.

### Step 5 — Add to TEAM.md
Append to the **Recruited Members** section:
```
| [#] | **[Name]** | [Role] | [Domain] | Recruited: [date] |
```
Also add their knowledge version row to the Knowledge Versions table.

### Step 6 — Resume Blocked Task
New member immediately takes point on the blocked task.
Return to `Team Child [task]` Step 2 (Command Challenge).

---

## Recruit Rules
- A recruit is a **full team member** — subject to all standing rules
- No recruit may skip the Command Challenge or Reliability Gate
- If a recruit's knowledge is found to be outdated, they must flag it immediately
- Recruits are listed in TEAM.md permanently; archive to TEAM_ARCHIVE.md only when explicitly dismissed
- **File size check:** After adding to TEAM.md, confirm it is still under 24,800 tokens.
  If TEAM.md is near the limit → move Recruited Members section to TEAM_PART1.md.
