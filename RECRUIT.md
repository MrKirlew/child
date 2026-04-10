# RECRUIT.md — Team Child Recruit Protocol

> Triggered automatically when `Team Child [task]` finds a skill gap.
> Can also be called directly: `Team Child Recruit [skill needed]`
> Updated: 2026-04-09 — added MARKETING_HQ.md reading requirement, child safety filter for marketing roles

---

## Recruit Flow

### Step 1 — Define the Gap
The blocking team member states:
- What skill is missing
- Why no current member covers it (check TEAM.md Architecture Ownership Map first)
- Which task is blocked

### Step 2 — Find the Candidate
Search for the best-fit specialist for the stated skill.
Consider: depth of knowledge, relevance to the project, compatibility with current team.

Candidate profile to build:
```
Name:        [Specialist title — e.g. "Accessibility Engineer"]
Skill set:   [Specific technologies / domains]
Why hired:   [One sentence — what gap they fill]
Limitations: [What they do NOT cover — be honest]
```

### Step 3 — Knowledge Version Stamp
New member must immediately declare:
```
Knowledge Domain:  [e.g. WCAG 2.2, iOS VoiceOver, Android TalkBack]
Version confirmed: [date]
Source:            [spec / docs / release notes referenced]
Staleness date:    [date 30 days from now — flagged at Team Child In if exceeded]
```

### Step 4 — Team Introduction & Reading
Dev Lead introduces the new member to the team.
New member reads these files **before speaking on any task:**

| File | Required for |
|------|-------------|
| `CLAUDE.md` | All recruits — standing rules, architecture standards |
| `GATES.md` | All recruits — Command Challenge + Reliability Gate |
| `SUMMARY_RULES.md` | All recruits — how to log their work |
| `MARKETING_HQ.md` | Required for any marketing, growth, or distribution role |
| `TEAM.md` | All recruits — architecture ownership map, who to consult |

### Step 5 — Child Safety Filter (Marketing / Growth roles only)
If the recruited role involves any marketing, growth, advertising, analytics, or user acquisition:
- Security Auditor runs the Child Best Interest Filter (MARKETING_HQ.md §0) on the recruit's proposed domain
- Confirm the recruit understands: child data cannot be used for targeting, no dark patterns, no manipulative engagement mechanics
- If the recruit's knowledge base includes tactics that violate §0 (e.g. behavioral retargeting of children), those tactics are off-limits and must be stated explicitly
- Security Auditor co-signs the recruit's addition to TEAM.md for marketing roles

### Step 6 — Add to TEAM.md
Append to the **Recruited Members** section:
```
| [#] | **[Name]** | [Role] | [Domain] | Recruited: [date] |
```
Also add their knowledge version row to the Knowledge Versions table with Status ✅.
Check that TEAM.md remains under 24,800 tokens after adding.
If near the limit → move Recruited Members section to TEAM_PART1.md.

### Step 7 — Resume Blocked Task
New member immediately takes point on the blocked task.
Return to `Team Child [task]` Step 2 (Command Challenge).
New member runs their lens in the Command Challenge on their first task.

---

## Recruit Rules
- A recruit is a **full team member** — subject to all standing rules from the moment they join
- No recruit may skip the Command Challenge or Reliability Gate
- Knowledge older than 30 days is stale — recruit must flag it and re-verify before acting
- Recruits are listed in TEAM.md permanently; archive to TEAM_ARCHIVE.md only when explicitly dismissed by user
- Any recruit whose knowledge is found to be materially wrong (not just outdated) must be flagged to the user immediately — do not act on bad information
- **Marketing roles:** Security Auditor co-signs all additions. Child Best Interest Filter is non-negotiable.
