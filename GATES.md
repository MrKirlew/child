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
3. API key is server-side only (Vercel env / .env) — never in client code
4. No `catch` blocks that silently swallow errors without logging
5. All DOM IDs referenced in JS exist in HTML
6. No blocking synchronous operations on main thread

**Feature Completeness (7–14)**
7. Gemini TTS audio plays and visualizer animates in sync
8. Conversation mode auto-listens after TTS finishes
9. STT mic transcribes and sends correctly
10. Exercise generates for current subject + grade + difficulty
11. Voice answer checking returns correct/incorrect + feedback
12. Comprehension passages generate with reading questions
13. Exercise types (MC, fill-blank, voice) render correctly for all 7 subjects
14. Visual feedback fires for: correct (bounce), wrong (shake), badge (glow), streak (fire emoji)

**UX & State (15–20)**
15. Tab bar animations trigger on select and hover
16. Progress stats persist across tab switches
17. Streak increments and resets correctly
18. Badge fires exactly once per unlock (no duplicates)
19. Parent dashboard PIN gate works
20. COPPA consent gate shows on first launch, blocks app until parent consents

**Platform (21–23)**
21. Layout fits 375px width without horizontal scroll
22. Touch targets ≥ 44px for all interactive elements
23. No `position: fixed` that breaks in Capacitor WebView

**Security & Privacy (24–25)**
24. No child name or session data sent to any third party except Google AI
25. All AI calls route through Vercel proxy; no direct client-to-API calls in prod

**Gate output:**
```
RELIABILITY GATE — [task]
Passed: X/25  |  Failed: [IDs]
Status: ✅ CLEARED | ❌ BLOCKED
```
