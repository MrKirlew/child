# Follow-up: Child-safe input/output filtering + `blockReason` handling

**Type:** Safety hardening · **Severity:** High (child-facing, K–6 audience, COPPA context) · **Status:** Open
**Suggested labels:** `safety`, `child-safety`, `backend`, `frontend`, `priority:high`
**Related artifact:** `docs/diagrams/ollie-safety-pipeline.png` (the dashed-red "recommended / not implemented" nodes are exactly this work).

---

## Problem

`CLAUDE.md` and `PROJECT_SUMMARY_PART_1.MD` describe **"strict child-safe content filtering — no words inappropriate for children."** In the current code, that guarantee is **not implemented**. All real protection rests on Google Gemini's built-in safety settings plus a *soft* prompt instruction. There is:

1. **No input filtering.** What the child says/types is sent to the model verbatim.
2. **No output moderation.** The model's reply is rendered + spoken with only HTML-escaping/markdown formatting.
3. **No `blockReason` handling.** When Gemini *does* block content, the app neither detects it, logs it, nor shows the child a safe, kind message — it silently degrades into a generic error.
4. **STEAM-topic restriction is soft only.** A prompt line asks the model to stay on educational topics; nothing enforces it.

For a Kindergarten–6th-grade product this is the single most important correctness/safety gap.

## Evidence (verified against current code)

- **Backend forwards raw model output, never checks block signals** — `api/ai/generate.js`
  - Safety settings injected: `SAFETY` (lines 10–15), applied at line 38 (`{ ...req.body, safetySettings: SAFETY }`).
  - Handler returns the **entire** Gemini response (`return res.json(result.data)`, lines 46 & 63). It never inspects `result.data.promptFeedback.blockReason` or `candidates[0].finishReason === 'SAFETY'`. A safety block comes back as **HTTP 200 with empty/var `candidates`**, so it slips straight through.
- **Frontend swallows blocks as a generic hiccup** — `www/js/ai.js`
  - `aiGenerate()` extracts `data.candidates[0].content.parts[0].text` with a long optional chain that defaults to `''` (line 71). Only `data.error` (HTTP-level) is handled (line 66) — not `promptFeedback`. A blocked reply → empty string → caller shows the generic "Hmm, I had a hiccup! Tap the mic and try again!" fallback. No signal that it was a *safety* block, and **nothing is logged**.
  - Input `prompt` is sent verbatim (lines 59–63) — no validation.
  - Note: there is an on-device Gemma tier (lines 47–53, currently a disabled stub) that would **bypass backend `SAFETY` entirely** if ever enabled — any filtering must live where both tiers funnel, or be duplicated.
- **TTS speaks whatever it's given** — `api/ai/speak.js`
  - Only strips IPA/markup chars to avoid classifier misfires (line 67) and retries on classifier miss. **No content moderation** (lines 71–82).
- **Output render is escape-only** — `www/index.html` `addBub()` / `esc()` / `fmt()`: HTML-escape + markdown only, no moderation.
- **Soft topic rule** — `www/js/ai.js` system prompt (~lines 113–122): "Stay on educational topics… gently redirect." Guidance, not a gate. `_detectSubject()` (`www/js/speech.js` ~177–189) is **passive — for progress tracking only**, not a safety check.

## Why it matters

- Target users are 5–12 years old; a single inappropriate input echoed back, or an unhandled safety block that confuses/frustrates a child mid-lesson, undermines trust and the COPPA-conscious positioning.
- The voice (Gemini Live WebSocket) path is **direct from client to Gemini** — backend changes alone won't cover it. Input/output handling for the Live transcript path must be addressed too (see `www/js/speech.js` `_handleServerMsg`).

---

## Proposed implementation (phased)

### Phase 1 — Handle `blockReason` gracefully (smallest, highest-value)
- **Backend** (`api/ai/generate.js`): after a successful fetch, if `data.promptFeedback?.blockReason` is set **or** `candidates[0]?.finishReason === 'SAFETY'` **or** no usable text, return a typed payload, e.g. `{ blocked: true, reason }` (HTTP 200), and emit a **structured Sentry/log event** (`safety.block`, no child text/PII) via the existing `withSentry`/logger.
- **Frontend** (`www/js/ai.js` + caller): when `blocked`, speak/show a kind, child-appropriate redirect (e.g. *"Let's talk about something else — want to try a science question?"*) instead of the generic hiccup. Distinguish *blocked* from *service error*.
- **Live path** (`www/js/speech.js`): handle the Live API's block/`turnComplete`-without-content case with the same friendly redirect.

### Phase 2 — Input filtering (pre-model)
- Add a shared, testable module (e.g. `www/js/safety.js` + a server mirror, or one module imported by both) with an age-appropriate blocklist/allowlist + light normalization (leet/spacing). Apply to **typed input** (`sendTyped`) and **Live transcripts** before they reach the model.
- On a blocked word: don't send; show a gentle "Let's keep it kind — try asking about…" nudge. Never echo the blocked word back.
- Keep the list data-driven (JSON) so it's reviewable/updatable without code changes. Bias toward **allowlist-leaning** for the youngest grades if feasible.

### Phase 3 — Output moderation (pre-render / pre-TTS)
- Run the model's reply through the same shared filter before `addBub()` and before `/api/ai/speak`. On a hit, suppress + substitute a safe line and log `safety.output_filtered`.

### Phase 4 (optional) — Harder STEAM-topic gate
- Lightweight classifier or keyword gate to redirect clearly off-topic requests deterministically, complementing the soft prompt. Lower priority than 1–3.

---

## Acceptance criteria (UAT — write tests before implementing, per `production-quality-gates`)

- [ ] When Gemini returns a `blockReason`/`SAFETY` finish, the child sees a **kind, on-brand redirect** (not a generic error, not a blank bubble), and a `safety.block` event is logged (no child text/PII).
- [ ] A known inappropriate **typed** word is **not sent to the model**, is **not echoed**, and the child gets a gentle nudge. (Repeat for a **Live-transcript** input.)
- [ ] A simulated inappropriate **model output** is **never rendered or spoken**; a safe substitute appears and `safety.output_filtered` is logged.
- [ ] Normal STEAM content is unaffected — no false positives on common K–6 science/math/reading words (regression set).
- [ ] Both the **backend proxy path** and the **Live WebSocket path** are covered (and the on-device Gemma tier, if enabled, routes through the same filter).
- [ ] Works across surfaces: web (≥320px), Android WebView, iOS stub config — no layout/safe-area regressions for the nudge UI.

## Test plan (behavior coverage ≥ the UAT set)
- Vitest: unit tests for the shared filter (blocklist hits, allowlist passes, normalization, false-positive regression corpus), `generate.js` block-detection branch, and the frontend block→redirect mapping.
- Drive both paths (REST + Live) with stubbed Gemini responses (blocked / clean / empty) and assert UI + logging.

## Observability
- Structured events through the existing centralized logger / Sentry (`api/_observability.js`, `www/js/observability.js`): `safety.block`, `safety.input_filtered`, `safety.output_filtered` — counts/categories only, **no child content**, consistent with the current PII/replay-disabled stance.

## Out of scope / notes
- Not changing the Gemini `SAFETY` thresholds (already `BLOCK_LOW_AND_ABOVE` ×4) — this adds app-level defense in depth around them.
- Avoid logging raw child utterances anywhere (COPPA).
- Keep the blocklist content itself out of git history if it contains explicit terms — consider a generated/encoded list or a private source.

---

_Generated as a follow-up from the safety-pipeline diagram work (`docs/diagrams/ollie-safety-pipeline.*`). To file on GitHub:_
```bash
gh issue create \
  --title "Child-safe input/output filtering + blockReason handling" \
  --body-file docs/followups/child-safety-input-output-filtering.md \
  --label safety --label priority:high
```
