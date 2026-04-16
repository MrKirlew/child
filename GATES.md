# GATES.md — KiddoAI Quality Gates

> Owned by: **QA Lead** — changes require Dev Lead approval + full team vote
> Referenced by: CLAUDE.md `Team Child [task]` Steps 2 and 4
> **Token rule:** Under 24,800 tokens. Last reviewed: 2026-04-16

---

## §1 — Command Challenge (run BEFORE execution)

A ⚠️ on any lens **blocks execution** until resolved with the user.

| Lens | Question | Owner | Block condition |
|------|----------|-------|-----------------|
| **Efficiency** | Leanest path? Any redundant steps? | Dev Lead | ⚠️ if a simpler approach exists — state it and let user choose |
| **Security** | Exposes API keys, child data, or new attack surface? | Security Auditor | ❌ hard block — must be resolved before any code is written |
| **Sufficiency** | Fully solves the problem, or just part of it? | QA Lead | ⚠️ if partial — scope gap must be acknowledged by user |
| **Cost** | API call count reasonable? Token budget respected? | AI Engineer | ⚠️ if call count or token usage increases — state the delta |
| **Visual Appeal** | Output appropriate and engaging for ages 5–12? | UX Guardian | ❌ hard block if content is age-inappropriate or touch targets shrink below 44px |
| **Marketability** | Makes KiddoAI more compelling to parents/stores? | Platform Engineer | ⚠️ if it regresses a store-facing feature — flag before proceeding |

**Output format (print for every task):**
```
COMMAND CHALLENGE — [task]
✅/⚠️/❌ Efficiency:     [finding]
✅/⚠️/❌ Security:       [finding]
✅/⚠️/❌ Sufficiency:    [finding]
✅/⚠️/❌ Cost:           [finding]
✅/⚠️/❌ Visual Appeal:  [finding]
✅/⚠️/❌ Marketability:  [finding]
```

---

## §2 — 25-Point Reliability Gate (run AFTER execution)

Any ❌ must be fixed and re-checked before closing the task.
Do **not** log a task as complete while any point is open.

---

### Code Quality (1–5)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 1 | No unhandled promise rejections or uncaught errors | Dev Lead | Zero unhandled rejections in browser console during a full app flow test |
| 2 | All `fetch()` calls have try/catch with user-visible fallback | Dev Lead | No `catch {}` block is empty or logs-only. User always sees a message, never a blank screen |
| 3 | API key server-side only | Security Auditor | `npm run secret:scan` returns nothing. `GOOGLE_AI_KEY` exists only in Vercel env vars |
| 4 | All DOM IDs referenced in JS exist in HTML | Dev Lead | No `document.getElementById()` call targets an ID absent from `www/index.html` |
| 5 | No blocking synchronous operations on main thread | Dev Lead | No `while` loops, synchronous XHR, or heavy computation blocking UI interaction |

---

### Feature Completeness (6–13)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 6 | Gemini TTS audio plays and visualizer animates in sync | AI Engineer | Kore voice audio starts and rainbow visualizer responds within 300ms of each other |
| 7 | Conversation mode auto-listens after TTS finishes | AI Engineer | After Ollie finishes speaking, STT activates automatically without a second tap |
| 8 | STT mic transcribes and sends correctly | Platform Engineer | Mic tap → permission granted → speech recognized → transcript sent to AI — no silent failures |
| 9 | Exercise generates for current subject + grade + difficulty | AI Engineer | Generated exercise JSON matches the requested subject, grade level, and difficulty. Reading level prompt is injected. |
| 10 | Voice answer checking returns correct/incorrect + feedback | AI Engineer | Spoken answer is evaluated and Ollie responds with explicit correct/incorrect + explanation |
| 11 | Comprehension passages generate with reading questions | AI Engineer | Passage appears, followed by ≥ 1 comprehension question. Passage is grade-appropriate. |
| 12 | Exercise types (MC, fill-blank, voice) render correctly for all subjects | QA Lead | Each of the 3 exercise types renders without layout breakage across all available subjects |
| 13 | Visual feedback fires correctly | UX Guardian | Correct answer → green bounce ✅ · Wrong answer → red shake ❌ · Badge unlock → glow 🏆 · Streak → fire emoji 🔥 |

---

### UX & State (14–19)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 14 | Tab bar animations and state transitions work | UX Guardian | Tab select + hover animations trigger. Active tab is visually distinct. |
| 15 | Progress stats persist across tab switches | Dev Lead | Correct count, accuracy %, and streak survive switching from Exercises → Progress → Learn and back |
| 16 | Streak increments and resets correctly | Dev Lead | Consecutive correct answers increment streak. First wrong answer resets streak to 0. Best streak is preserved. |
| 17 | Badge fires exactly once per unlock (no duplicates) | Dev Lead | Each of the 12 badges triggers its unlock animation exactly once. Re-opening the app does not re-fire. |
| 18 | Parent dashboard PIN gate works | Security Auditor | Correct PIN (SHA-256 matched) grants access. Wrong PIN is rejected. PIN is never stored or logged as plain text. |
| 19 | COPPA consent gate is present and unskippable | Security Auditor | On first launch (fresh `localStorage`), consent UI appears before any app feature. Cannot be dismissed without affirmative action. Links to `privacy.html`. |

---

### Platform (20–22)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 20 | Layout fits 375px width without horizontal scroll | UX Guardian | No horizontal scrollbar at 375px viewport. All content visible without pinching. |
| 21 | Touch targets and Capacitor compatibility | UX Guardian + Platform Engineer | All interactive elements ≥ 44px tap area. No `position: fixed` elements that misrender in Capacitor WebView. |
| 22 | Android build targets and permissions | Platform Engineer | `targetSdkVersion = 35` in `android/variables.gradle` (Capacitor 7 requirement; also satisfies Play Store 2025 minimum of 34). `minSdkVersion = 26`. Runtime `RECORD_AUDIO` permission is requested before use — never assumed. App launches on API 26 emulator. |

---

### AI & API Standards (23–24)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 23 | Fallback chain, token budgets, and retry | AI Engineer + Gemini API Specialist | Fallback chain intact: `gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite`. Token budgets enforced: ≤ 300 chat, ≤ 150 TTS. On 429/503: exponential backoff (1s → 2s) before retry. |
| 24 | Proxy routing and log hygiene | Security Auditor | Zero direct client-to-API calls (`git grep "generativelanguage.googleapis.com" www/` returns nothing). Vercel function logs contain only: model, status, response time, token count. No prompt text or AI response text in logs. |

---

### CI & Testing (25)

| # | Check | Owner | Pass condition |
|---|-------|-------|----------------|
| 25 | Full CI pipeline green | QA Lead | All 5 steps pass on latest commit: `npm run lint` → `npm test` → `./gradlew assembleDebug` → `vercel --prod` → `curl -f https://forthechild.vercel.app/api/health`. No skipped tests. New feature has ≥ 2 new tests. |

---

**Gate output (print after every task):**
```
RELIABILITY GATE — [task]
Passed: X/25  |  Failed: [IDs]
Status: ✅ CLEARED | ❌ BLOCKED — [fix required]
```

---

## Gate Failure Protocol

1. Owning member states: `❌ [#] — [what failed] — [fix needed]`
2. Fix applied in the same session if possible
3. Re-check failed point only — do not re-run the full 25
4. If fix requires a new session: log `BLOCKED: [#] [reason] [owner]` in PROJECT_LOG.md. Task is not marked complete.
5. Next session opens by resolving all blocks before new work begins

---

## Gate History

| Date | Session | Task | Result | Failed # |
|------|---------|------|--------|----------|
| 2026-04-09 | S2 | Reliability Gate audit + modernization | 25/25 ✅ | — (3 fixed in-session: #21 touch targets, #2 silent catches, #3 secret scan) |
| 2026-04-16 | S1 | A8/A9 + gate re-run | 25/25 ✅ | — (#22 text refreshed: targetSdk 34→35 to match Capacitor 7 stack) |
