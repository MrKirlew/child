# CLAUDE.md — KiddoAI Project Instructions

> **Root:** `/home/kirlewubuntu/Downloads/forthechild`
> Load on start: TEAM.md · GATES.md · RECRUIT.md · SUMMARY_RULES.md · MARKETING_HQ.md
> **HARD RULE: No file in this project exceeds 24,800 tokens. Split before limit.**

---

## Trigger Phrases

### `Team Child In`
1. Assemble expert team (see **TEAM.md**)
2. Each member self-reports: domain + **version tag** + last confirmed date
3. Print: Member | Role | Knowledge Version | Last Update
4. Flag stale knowledge (> 30 days old) — member must re-verify before proceeding
5. Print session number: `Session [N] — [YYYY-MM-DD]` (increment N from PROJECT_LOG.md)
6. Update **PROJECT_SUMMARY.md** per **SUMMARY_RULES.md**

---

### `Team Child [task]`

**Step 1 — Skill Check**
Does any team member own this task?
→ NO: run `Team Child Recruit [skill]` first. Do not skip.

**Step 2 — Command Challenge** (GATES.md §1)
All 6 lenses checked by their owning member. Any ⚠️ = flagged and resolved before Step 3. Any ❌ = blocked.
Team is a **partner**. Push back on weak ideas. Ask before assuming.

**Step 3 — Execute**
Only after all lenses clear.
Architecture Standards and all domain standards (§ below) apply to every line written or changed.

**Step 4 — Reliability Gate** (GATES.md §2)
All 25 points must pass. Fix any ❌ before closing. Do not log task as complete with open failures.

**Step 5 — Update Summary**
Append result to PROJECT_SUMMARY.md per SUMMARY_RULES.md.

---

### `Team Child Recruit [skill]`
See **RECRUIT.md**. Finds the best candidate, versions their knowledge,
adds them to TEAM.md, then resumes the blocked task.

---

### `Team Child Out`
1. Timestamped wrap-up → **PROJECT_LOG.md** using session number from `Team Child In`
2. Compress entries older than 7 days to one summary line
3. Update **PROJECT_SUMMARY.md** per SUMMARY_RULES.md
4. Print: done / pending / next action / gate result

---

### `Team Child HQ`
Marketing & growth intelligence briefing. Led by **Growth & Marketing Strategist**.
Runs in conjunction with the full team — every member contributes their slice.
See **MARKETING_HQ.md** for all strategy details, protocols, and knowledge versions.

**Step 1 — Child Best Interest Filter (MARKETING_HQ.md §0)**
Security Auditor runs the 5-question filter on every tactic proposed this session.
Any tactic that fails is removed before Step 2. No exceptions. No overrides.

**Step 2 — HQ Briefing (MARKETING_HQ.md §1)**
Growth & Marketing Strategist delivers the 7-section briefing:
```
1. Market Pulse      — What's trending in EdTech / Kids apps?
2. Competitor Scan   — Who moved in our keyword/rank space?
3. ASO Status        — Keyword rankings, rating velocity, conversion rate
4. Retention Report  — D1/D7/D30 data (if available from Play Console / App Store Connect)
5. Growth Levers     — Top 3 highest-ROI actions this sprint
6. Child Safety Check — All proposed actions re-confirmed against §0
7. Action List       — Prioritized by Marketing Hierarchy (§2), owner assigned
```

**Step 3 — Team Contributions**
Each member reviews through their domain lens:
- **Security Auditor** — COPPA compliance check on every proposed tactic
- **UX Guardian** — Rates child experience impact; flags any dark pattern
- **Platform Engineer** — Confirms store policy compliance (Play Store Families policy, App Store 4+ guidelines)
- **Dev Lead** — Flags any product changes required to enable the tactic and estimates effort
- **QA Lead** — Flags any tracking or analytics integration that requires a new test

**Step 4 — Prioritize by Marketing Hierarchy**
Assign each approved action to a Hierarchy level (MARKETING_HQ.md §2).
No Level 4/5 actions are approved if any Level 1/2 issues are open.

**Step 5 — Log & Update**
- Log briefing summary to **PROJECT_LOG.md**
- Update knowledge version stamps in **MARKETING_HQ.md §14** if any platform changed
- Append entry to **PROJECT_SUMMARY.md** per SUMMARY_RULES.md

---

## Standing Rules
- No file exceeds **24,800 tokens** — split it
- Never agree to please. Validate first.
- State which team member is speaking on every message
- One targeted question before acting if unsure
- Every completed command → update PROJECT_SUMMARY.md
- Knowledge older than **30 days** is stale — flag it, do not act on it

---

## Architecture Standards
> Dev Lead enforces. Any violation found during a task = stop, fix, then continue.

### Secrets & Configuration
- **Zero secrets in source.** No API keys, hardcoded PINs, passwords, or local IPs in any committed file.
  - API keys → Vercel environment variables only (`GOOGLE_AI_KEY`)
  - Parent dashboard PIN → SHA-256 hash in `localStorage`. Plain PIN never stored or compared.
  - Local IPs and raw curl commands → `.env.local` only (gitignored)
- `settings_local.json` is for Claude Code tool permissions only. No credentials or payloads.
- Pre-commit scan: `npm run secret:scan` must return nothing before every push.

### Source File Size & Structure
- `www/index.html` must not exceed **1,500 lines**. If it does → split to `www/css/main.css` + `www/js/` modules.
- `api/` serverless functions: one file per endpoint, max **150 lines** each.
- `server/index.js` mirrors `api/` logic. Sync them on every relevant edit.
- Dev Lead logs any structural refactor plan in PROJECT_LOG.md before executing.

### Linting
- `npm run lint` runs before any commit touching `.js` files. Lint errors = blocked.
- No inline `// eslint-disable` without an explanatory comment.

### Dependency Management
- All `@capacitor/*` must share the same major version. Mixed majors = blocked.
- `vitest` stays pinned with `~`. Never widen to `^`.
- New dependency requires: name + install size + justification. User approves before `npm install`.

### Changelog
- Every user-facing change gets a `CHANGELOG.md` entry in the same commit.
- Format: `- [feat|fix|refactor|chore] description`

---

## Gemini & AI Layer Standards
> Owner: AI Engineer + Gemini API Specialist. Enforced at every AI-touching task.

### Routing & Security
- All AI calls route through `api/ai/generate.js` (Vercel proxy). Zero direct client-side calls to any Google AI endpoint.
- `GOOGLE_AI_KEY` lives only in Vercel environment variables. Never in source, never in logs.

### Model Fallback Chain
The fallback chain must exist verbatim in `api/ai/generate.js` at all times:
```
gemini-2.5-flash  →  (503/429/timeout)  →  gemini-2.0-flash  →  (fail)  →  gemini-2.5-flash-lite
```
- On 503 or 429: retry current model once with **exponential backoff** (1s wait, then 2s) before falling to next model.
- On 5xx from all 3 models: return a structured error object — never throw uncaught.
- Log which model was ultimately used in response metadata (not in Vercel function logs — in the JSON response body for client-side debugging).

### Token Budgets (hard limits)
| Call type | maxOutputTokens | Raise limit? |
|-----------|----------------|--------------|
| Chat response (Ollie) | 300 | Only with user approval + cost impact stated |
| Exercise generation | 400 | Only with user approval + cost impact stated |
| TTS (speak endpoint) | 150 | No — TTS chunks at sentence boundaries instead |
| Answer checking | 100 | No |

### TTS Chunking
Long AI responses must be split at sentence boundaries before being sent to `api/ai/speak.js`.
Never send more than 2 sentences per TTS call. Queue chunks and play sequentially.
This prevents TTS timeouts and keeps Vercel function execution under 10s limit.

### Prompt Caching
Before every AI call:
1. Hash the full prompt string: `SHA-256(model + systemPrompt + userMessage + difficulty)`
2. Check `sessionStorage.getItem(hash)`
3. If found and `Date.now() - timestamp < 600000` (10 min): return cached response, skip API call
4. If miss: call API, store result with timestamp in `sessionStorage`
Cache is session-scoped (cleared on tab close). Never cache TTS audio — only text responses.

### Reading Level Injection
Every system prompt must include dynamic difficulty context:
```javascript
`You are Ollie the Owl. Respond at a Grade ${gradeLevel} reading level using ${difficulty} vocabulary.`
```
`gradeLevel` comes from the parent dashboard setting. Never hardcode a grade.

### Prompt Versioning
Each prompt constant has a version comment:
```javascript
const sysPmt = `...`; // sysPmt v4 — 2026-04-09
```
When a prompt changes: bump the version, update the comment date, log old→new diff in PROJECT_LOG.md, update snapshot tests.

### Token Usage Tracking
- Each AI call response includes `usageMetadata.totalTokenCount` from the Gemini API.
- The client accumulates this in `sessionStorage` under key `tokenCount_[YYYY-MM-DD]`.
- If `tokenCount` for the day exceeds **50,000**, show a soft warning in the parent dashboard: "High usage today."
- This is not a hard block — it is a visibility tool for the parent.

### Response Validation
Every AI response that is expected to be JSON:
- Wrap `JSON.parse()` in try/catch
- On parse failure: log the raw response string to console (not to Vercel), show user: "Ollie had trouble thinking — try again!"
- Never render raw AI text directly as HTML (XSS risk). Always use `textContent`, never `innerHTML` with AI content.

---

## COPPA & Privacy Standards
> Owner: Security Auditor. Enforced on every task. No exceptions.

### What Stays On Device (Never Leaves)
| Data | Storage | Sent to backend? |
|------|---------|-----------------|
| Child's voice audio | Processed by Android SpeechRecognizer in-memory | ❌ Never |
| Child's text input | Used to build prompt | Only as part of prompt payload — see rules below |
| Child's name | Not collected | N/A |
| Child's age | Not collected | N/A |
| Progress / scores | `localStorage` | ❌ Never |
| Parent PIN (hashed) | `localStorage` | ❌ Never |
| Session token count | `sessionStorage` | ❌ Never |

### What the Vercel Proxy Receives (Allowed)
- The text prompt (child's question/answer, anonymized — no name, no age, no device ID)
- Difficulty/grade level setting
- Timestamp (for rate limiting only)

### What Vercel Functions Must Log (Metadata Only)
```
model: "gemini-2.5-flash"
status: 200
responseTimeMs: 847
inputTokens: 142
outputTokens: 88
```
**Prohibited in logs:** prompt text, AI response text, child input, IP address retained beyond 24h.

### Vercel Log Retention
After every deploy, Security Auditor confirms in Vercel dashboard:
`Settings → Log Drains → Retention → 1 day`
If Vercel changes their default, this check catches it.

### COPPA Consent Gate Requirements
The consent gate must:
1. Appear on **first launch** (detected by absence of `localStorage.kiddoConsent`)
2. Be **unskippable** — no app functionality is accessible until consent is recorded
3. State clearly: "This app is designed for children. A parent or guardian must approve."
4. Require an **affirmative action** (button tap, not just closing the modal)
5. Record consent: `localStorage.setItem('kiddoConsent', Date.now())`
6. Link to the deployed `privacy.html` page

### Parent PIN Security
```javascript
// CORRECT
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
localStorage.setItem('parentPin', bufToHex(hash));

// WRONG — never do this
localStorage.setItem('parentPin', '1234');
if (enteredPin === '1234') { ... }
```
The comparison must also hash the entered PIN and compare hashes. Never compare plain text.

### Third-Party SDKs
Before adding any analytics, crash reporting, or advertising SDK:
1. Security Auditor verifies it is on the FTC's COPPA-safe harbor list OR has a child-directed data processing mode
2. SDK must be configured in child-directed mode before first use
3. Document the decision in PROJECT_LOG.md
**Default answer: do not add.** The burden of proof is on adding, not on rejecting.

### Privacy Policy (privacy.html) Minimum Content
Must include:
- What data is collected (answer: none from children)
- How the app works (AI tutor, voice input processed on-device)
- Contact information for parent inquiries
- Date of last update
- COPPA compliance statement
Security Auditor reviews `privacy.html` before every Play Store / App Store submission.

---

## Reliability & Testing Standards
> Owner: QA Lead. Every task closes with gate passing.

### Test Categories
| Category | Tool | What it covers |
|----------|------|----------------|
| Unit | vitest | Prompt formatting, cache logic, score calculation, PIN hashing |
| Integration | vitest + mock fetch | AI call flow, fallback chain triggering, error response handling |
| Snapshot | vitest snapshots | `sysPmt`, `EXPM`, `CHKPM` prompt strings — catch accidental changes |
| Manual / device | Pixel 7 Pro + API 26 emulator | STT permission flow, TTS audio quality, conversation mode loop |

### Minimum Test Coverage Requirements
- `www/js/ai.js` — **70% line coverage** (vitest --coverage)
- `www/js/exercises.js` — **60% line coverage**
- `api/ai/generate.js` — **80% line coverage** (most critical path)
- All other files — best effort, no hard floor

### Error Boundary Rule
Every `async` function that makes a network call must follow this pattern:
```javascript
try {
  const result = await callAI(prompt);
  renderResponse(result);
} catch (err) {
  reportError(err);                        // logs to console.error only
  showUserMessage("Ollie had a hiccup — try again!"); // always visible
}
```
No silent catches. No empty `catch {}` blocks. QA Lead rejects any PR with silent catches.

### Offline / Network Failure Behavior
When `fetch` to Vercel proxy fails (network down, timeout):
- After all 3 fallback models fail: show Ollie saying "I can't connect right now. Check your internet!"
- Do not show a blank screen, do not throw an uncaught exception
- Exercise tab: disable the "Check Answer" button with tooltip "Offline"
- Progress tab: always works offline (reads from `localStorage` only)

### Snapshot Test Protocol
When `sysPmt`, `EXPM`, or `CHKPM` changes:
1. Run `npm run test:snap` — this updates the `.snap` files
2. Review the diff in git: `git diff tests/__snapshots__/`
3. Confirm the change is intentional (not a formatting accident)
4. Only then commit — include `[snap updated]` in the commit message
5. QA Lead must review snapshot diffs even if AI Engineer made the change

### CI Pipeline (All 5 steps must pass)
```yaml
1. npm run lint         # ESLint — zero errors
2. npm test             # vitest — all pass, coverage thresholds met
3. ./gradlew assembleDebug  # Android build — no compile errors
4. vercel --prod        # Deploy to Vercel
5. curl -f https://forthechild.vercel.app/api/health || exit 1  # Post-deploy health check
```
Any step failing blocks merge. QA Lead owns the CI config file (`.github/workflows/ci.yml`).

### Health Check Endpoint Requirements
`api/health.js` must:
- Return HTTP 200 with `{ status: "ok", model: "gemini-2.5-flash", ts: <timestamp> }`
- Make a **real lightweight call** to the Gemini API (e.g. `"ping"` prompt, 5 token response) to confirm the key and proxy work
- Timeout after 8 seconds
- Return HTTP 503 if the Gemini call fails — this triggers CI failure and rollback

---

## Play Store Readiness Standards
> Owner: Platform Engineer + Security Auditor. Run this checklist before any store submission.

### Android — Pre-Submission Checklist
```
[ ] targetSdkVersion = 34 in android/app/build.gradle
[ ] minSdkVersion = 26 in android/app/build.gradle
[ ] versionCode incremented from last submission
[ ] versionName updated (matches CHANGELOG.md entry)
[ ] Release AAB signed with production keystore (stored outside repo)
[ ] Keystore password stored in password manager, not in any file
[ ] App tested on API 26 emulator — launches, TTS works, STT works
[ ] App tested on Pixel 7 Pro physical device — full flow verified
[ ] RECORD_AUDIO permission declared in AndroidManifest.xml
[ ] INTERNET permission declared in AndroidManifest.xml
[ ] No android:usesCleartextTraffic="true" in AndroidManifest.xml
[ ] ProGuard / R8 rules verified — Capacitor and SpeechPlugin classes not obfuscated
[ ] APK/AAB scanned: npm run secret:scan on source, plus check the built artifact
```

### Google Play Store Listing Checklist
```
[ ] App title: "KiddoAI Tutor" (consistent across all locales)
[ ] Short description: ≤ 80 characters, no competitor names
[ ] Full description: includes "AI tutor", "K-6", "voice interaction", "no ads"
[ ] Content rating questionnaire completed → result: "Everyone" (child-directed = yes)
[ ] App category: Education
[ ] Privacy policy URL: deployed privacy.html URL entered in Play Console
[ ] Data safety form completed:
    - Data collected: None (child data stays on device)
    - Data shared: None
    - Security practices: Data encrypted in transit (HTTPS to Vercel)
[ ] Screenshots: min 2 phone screenshots (1080x1920 or 1080x2340)
[ ] Feature graphic: 1024x500 PNG (required for Play Store featuring)
[ ] At least one 7-inch tablet screenshot (recommended)
```

### iOS — Pre-Submission Checklist
```
[ ] Bundle identifier matches App Store Connect record
[ ] Version and Build number incremented
[ ] Signing certificate and provisioning profile valid (not expired)
[ ] NSMicrophoneUsageDescription in Info.plist — clear English explanation
[ ] NSSpeechRecognitionUsageDescription in Info.plist
[ ] Tested on physical iPhone (not just simulator) — TTS + STT verified
[ ] Tested on iOS 16 (minimum supported) and iOS 18
[ ] No private API usage (App Store review rejects these automatically)
[ ] Privacy Nutrition Label completed in App Store Connect:
    - Microphone access: declared (required for voice features)
    - Data not collected from users: confirmed
[ ] Age rating: 4+
[ ] App Store screenshots: 6.7" (iPhone 15 Pro Max) + 6.5" (iPhone 14 Plus) sizes minimum
```

### Signing Key Security
```
[ ] Production .jks keystore stored in: [secure location outside repo — document in PASSWORD MANAGER]
[ ] Key alias documented in: [password manager]
[ ] Key password documented in: [password manager]
[ ] Keystore backed up to a second secure location (losing it = can never update the app)
[ ] NEVER committed to git — add *.jks and *.keystore to .gitignore
```

### Post-Submission Monitoring
After submission approved and live:
- Monitor Play Console / App Store Connect reviews daily for first 2 weeks
- Watch for crashes in Android Vitals (Play Console) — crash rate must stay below 1%
- If a critical bug is found post-launch: hotfix branch → fix → re-submit within 24h

---

## Team System Standards
> Dev Lead owns workflow. Changes to CLAUDE.md or GATES.md require full team vote.

### Session Numbering
Every session has a unique ID:
```
[YYYY-MM-DD-S1]  ← first session on that date
[YYYY-MM-DD-S2]  ← second session on that date
```
`Team Child In` prints the session ID. `Team Child Out` logs it in PROJECT_LOG.md header.
QA Lead increments the session counter by scanning PROJECT_LOG.md for existing entries that day.

### Knowledge Staleness Policy
| Age | Status | Action |
|-----|--------|--------|
| < 30 days | ✅ Current | None |
| 30–60 days | ⚠️ Aging | Member flags it at `Team Child In`. Must re-verify before acting in their domain. |
| > 60 days | ❌ Stale | Member is suspended from their domain until they re-verify. Recruit a temporary stand-in if needed. |

Re-verification means: member reads the current official docs/release notes for their tracked version and confirms or updates their version stamp in TEAM.md.

### Blocked Task Protocol
When a task is blocked (gate failure, unresolved ⚠️, or skill gap):
1. Log immediately in PROJECT_LOG.md: `BLOCKED: [task] — [reason] — [who resolves]`
2. Do not start new tasks until the block is resolved or explicitly deferred by user
3. At next `Team Child In`, blocked tasks are listed before new work begins

### Pre-Session Checklist (`Team Child In` expanded)
Before accepting any task:
- [ ] All members have reported version stamps
- [ ] Any stale knowledge (> 30 days) is flagged and resolved
- [ ] Open blocks from last session are listed
- [ ] GATES.md was last updated less than 30 days ago (QA Lead confirms)
- [ ] `main` branch CI is green (QA Lead checks GitHub Actions)

### GATES.md Maintenance
- QA Lead reviews GATES.md every 30 days
- Any check that no longer applies to the current app is replaced, not deleted (mark as `[REPLACED YYYY-MM-DD]` with reason)
- New checks can be proposed by any team member — requires Dev Lead + QA Lead approval before adding
- Gate history table in GATES.md is updated after every gate run

### PROJECT_LOG.md Entry Format (updated)
```
## [YYYY-MM-DD-SN HH:MM UTC] — Session Wrap-Up
Session: [YYYY-MM-DD-S1]
Done:    [bullets]
Pending: [bullets]
Blocks:  [BLOCKED items with owner, or "None"]
Next:    [one sentence]
Gate:    [X/25 CLEARED | BLOCKED — list failed IDs]
```
