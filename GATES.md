# GATES.md — KiddoAI Quality Gates

> **Token rule:** This file must stay under 24,800 tokens.

---

## §1 — Command Challenge (run BEFORE execution)

A ⚠️ on any lens **blocks execution** until resolved with the user.

| Lens | Question | Owner |
|------|----------|-------|
| **Efficiency** | Leanest path? Any redundant steps? | Dev Lead |
| **Security** | Exposes API keys, child data, or attack surface? | Security Auditor |
| **Sufficiency** | Fully solves the problem or just part of it? | QA Lead |
| **Cost** | API call count reasonable? Wasteful? | AI Engineer |
| **Visual Appeal** | Right for a 5–12 year old? | UX Guardian |
| **Marketability** | Makes KiddoAI more compelling to parents/stores? | Platform Engineer |

**Output format:**
```
COMMAND CHALLENGE — [task]
✅/⚠️ Efficiency:     [finding]
✅/⚠️ Security:       [finding]
✅/⚠️ Sufficiency:    [finding]
✅/⚠️ Cost:           [finding]
✅/⚠️ Visual Appeal:  [finding]
✅/⚠️ Marketability:  [finding]
```

---

## §2 — 25-Point Reliability Gate (run AFTER execution)

Any ❌ must be fixed and re-checked before closing the task.

**Code Quality (1–6)**
1. No unhandled promise rejections or uncaught errors
2. All `fetch()` calls have try/catch with user-visible fallback
3. API key reads from `window.ANTHROPIC_API_KEY` — never hardcoded
4. No `console.error` silently swallowed
5. All DOM IDs referenced in JS exist in HTML
6. No blocking synchronous operations on main thread

**Feature Completeness (7–14)**
7. TTS speaks and Ollie's beak animates in sync
8. Wake word detection starts after welcome speech ends
9. STT mic transcribes and sends correctly
10. Exercise generates for current subject + grade + difficulty
11. Voice answer checking returns correct/incorrect + feedback
12. Story generates with child's name woven in
13. 3D model loads and rotates for all 4 STEM subjects
14. Sound effects fire for: correct, wrong, challenge, badge, story, wake

**UX & State (15–20)**
15. Tab bar animations trigger on select and hover
16. Progress stats persist across tab switches
17. Streak increments and resets correctly
18. Badge fires exactly once per unlock (no duplicates)
19. Parent dashboard PIN gate works
20. Children profiles save, load, delete without errors

**Platform (21–23)**
21. Layout fits 375px width without horizontal scroll
22. Touch targets ≥ 44px for all interactive elements
23. No `position: fixed` that breaks in Capacitor WebView

**Security & Privacy (24–25)**
24. No child name or session data sent to any third party except Anthropic
25. `anthropic-dangerous-direct-browser-access` header only in dev; prod uses proxy

**Gate output:**
```
RELIABILITY GATE — [task]
Passed: X/25  |  Failed: [IDs]
Status: ✅ CLEARED | ❌ BLOCKED
```
