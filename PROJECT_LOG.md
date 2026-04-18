# PROJECT_LOG.md — KiddoAI Session Log

> Root: `/home/kirlewubuntu/Downloads/forthechild`
> Written by `Team Child Out`. Entries older than 7 days are compressed.
> **Token rule:** Under 24,800 tokens. Rotate to PROJECT_LOG_PART1.md if needed.

---

## Log Format

**Active entry (< 7 days)**
```
## [YYYY-MM-DD HH:MM UTC] — Session Wrap-Up
Done:    [bullets]
Pending: [bullets]
Next:    [one sentence]
Gate:    [X/25 CLEARED | BLOCKED]
```

**Compressed entry (≥ 7 days)**
```
[DATE RANGE] COMPRESSED — [one-line summary]
```

---

## Log

## 2026-04-18 19:16 UTC — Session Wrap-Up (Team Child HQ Out)
Session: 2026-04-18-S1
Done:
- HQ Briefing at 02:02 UTC — 9/9 members present, all knowledge 9 days old (under 30d), no open blocks carried, CI green.
- Learn-tab Live API fix (commit `4f7ccd2`): dropped deprecated `gemini-2.5-flash-native-audio-preview-12-2025` from `LIVE_MODELS` (Google removed it on/before 2026-04-17, causing 15s setup-timeout wait on every mic cold start). Switched realtime input envelope `mediaChunks[]` → `audio` per `gemini-3.1-flash-live-preview` schema (close code 1007 diagnosed via new `ws.onclose` logging I added). Tightened setup timeout 15s→8s. Verified on Pixel 7 Pro: cold-start tap-to-ready 16s → 2.3s; WebSocket stays open 87s with clean code=1000 close; typed text turn renders Teaching bubble + audio + rainbow visualizer.
- B1 chunker + probe removal (commit `cc8d87f`): shipped the S1 carry-forward `_FIRST_CHUNK_FAST_BUDGET=40` logic in `speakDirect` so the first short sentence emits as chunk 0 alone when `sentences.length > 1` and `sentences[0] ≤ 40` chars. Warm-path measurement on Pixel 7 Pro: chunk-0 audio-ready at 1671ms (criterion ≤ 1800ms ✅). Removed 7 `[KiddoAI][timing]` console probes from commit `5a83494` (ui.js:72,74,80 + speech.js:502,530,539,541).
- Phonics TTS unblock (commit `b9cccdb`): root-caused the `http-400 "Model tried to generate text"` surfaced during B1 verification. IPA-style phonics (`lad-der: l-a-d (LAD) - d-er (DER).`) triggered the TTS model to interpret the input as a generation request instead of audio. Reproduced 5/5 against prod Gemini API direct; 0/5 failures with TTS-friendly format. Tested and rejected: "Read aloud:" prefix (leaked ~0.7s of prefix into speech on sentence-length inputs) and `system_instruction` (TTS preview model returned 500s). Two-part fix in ui.js: (1) prompt rewrite asks AI for syllable-dot-separated phonics directly; (2) client-side `_phonicsToSpeech` sanitizer (strip parens, dashes/colons → periods) so cached legacy entries also play correctly. Device-verified both cached "ladder" 🔊 replay and fresh "elephant" lookup — zero `_fetchTTS failed` errors, visual card renders "How to say it: el. uh. fant".
- 3 feature commits + 2 docs commits pushed to main. Every CI run green (runs 24594796993, 24595045555, 24595581230). Every deploy live.
- Lifecycle work: PROJECT_LOG.md compressed 2026-04-09 through 2026-04-11 entries (project foundation phase) into one-line summary per Team Child Out protocol.

Pending:
- A1 Play Store signing (L1 gating, deferred by user)
- A2–A11 HQ briefing actions queued (Data Safety, privacy URL, store listing, screenshots, feature graphic, content rating, CSM post-launch, landing page schema)

Blocks: None
Next: Resume Play Store submission track — A1 gating; A2/A3/A7 parallel-trackable.
Gate: 25/25 CLEARED on all 3 feature commits this session.
Commits this session: 4f7ccd2, cc8d87f, 4ce358a, b9cccdb, 0bc8539 (5 total)

---

## 2026-04-17 05:45 UTC — Session Wrap-Up (Team Child HQ Out)
Session: 2026-04-17-S1
Done:
- HQ briefing at 04:30 UTC — all 9 members present, no stale knowledge, no open blocks carried in, last CI green.
- Spell 🔊 replay icon shipped in commit 6b325f0 (prior session spillover — icon + sayItAgain + delegated click listener + CSS).
- Diagnosed Spell 🔊 silence via live logcat Monitor: handler chain proved working end-to-end (`sayItAgain FIRED` + `speakDirect called` both logged on tap); silence was downstream.
- Traced prod /api/ai/speak to HTTP 404 — Google deprecated `gemini-2.5-flash-native-audio-preview-12-2025`. Reverted MODEL to `gemini-2.5-flash-preview-tts` (commit 9257151). Audio restored. Replaced silent catches with explicit console.warn in speakDirect so future model-deprecation outages surface immediately in logcat.
- Addressed "long gaps + truncation" in TTS (commit 101816c): pipelined speakDirect fetches (prefetch chunk N+1 while chunk N plays) and pre-split sentences >90 chars at commas so Gemini's 150-token audio cap can't truncate mid-sentence.
- Attempted `gemini-3.1-flash-live-preview` per user request (commit 27c641f) → confirmed HTTP 404 (Live API WebSocket-only model, not compatible with REST generateContent). Reverted + added [KiddoAI][timing] probes (commit 5a83494).
- User hit free-tier 429 quota wall (10 TTS requests/day on free tier). User upgraded to Tier 2 billing. TTS unblocked — prod /api/ai/speak returns 62 KB PCM in ~1.85s.
- Timing probe measurement: chunk 0 inference is 5.014s for 42-char chunk → that's the user-visible "dead silence" before first audio. Pipeline works (chunks 1 and 2 land within 4ms of prior playback-done). Fix drafted and implemented (uncommitted) in www/js/speech.js: `_FIRST_CHUNK_FAST_BUDGET=40` emits sentence 0 alone so chunk 0 returns in ~1–1.5s instead of 5s. Device verification interrupted by session close.
- Token/cost summary shared with user: one 🔊 replay ≈ 3 TTS calls, 147 chars input, ~340 output audio tokens, estimated cost << $0.01 on tier 2.

Pending:
- **Uncommitted in working tree:** www/js/speech.js — `_FIRST_CHUNK_FAST_BUDGET` chunker change. Untested on device. Next session: confirm first-chunk latency drops from 5s → ~1.5s via monitor, then commit + push.
- **Timing probes still in main (from 5a83494):** [KiddoAI][timing] console.warn lines in ui.js + speech.js. Remove in the same commit as the chunker fix once verified.
- A1 Play Store signing — L1 gating item still queued.
- A2–A11 HQ briefing actions still queued (Data Safety, privacy URL, store listing, screenshots, feature graphic, content rating, CSM post-launch, landing page schema).

Blocks: None
Next: On session-in, user taps 🔊 on a history word; verify chunk 0 audio-ready ≤ 1800ms; commit + push + remove timing probes.
Gate: 25/25 CLEARED (no new code touches any gate point; TTS fixes improve #23 reliability signal; #25 CI still green on every push this session)
Commits this session: 6b325f0, 9257151, 101816c, 27c641f, 5a83494 (5 total; 1 change uncommitted)

---

## 2026-04-16 20:45 UTC — Session Wrap-Up (Team Child HQ Out)
Session: 2026-04-16-S1
Done:
- HQ Briefing: 11 actions prioritized (A1 Play Store signing = L1 gating). Zero tactics removed by §0 filter. Security Auditor co-signed all approved tactics.
- Step 0: Paired Pixel 7 Pro via WiFi — pair port 33713 + code 890592 (one-time), connect port 46703. Serial 28131FDH300HK3 (matches historical entry). M10L_Pro (USB) connected but held off-limits per user directive.
- A9 (Capacitor CLI): Restored android/.gitignore + android/app/.gitignore from HEAD. `npx cap copy android` now detects platform and copies in ~14ms; www/ and android public assets verified byte-identical. Working-tree-only fix — no diff vs HEAD, no commit needed.
- A8 (CI health check): Two-layer retry. Layer 1 — api/health.js now loops 3 attempts with 1s/2s exponential backoff on 429/503, 8s AbortController timeout per attempt, non-retriable 4xx fail fast. Layer 2 — .github/workflows/ci.yml curl step gains --retry 2 --retry-delay 5 --retry-all-errors --max-time 40. Added tests/health-retry.test.js with 6 cases covering first-shot success, 429-then-200, 503-exhaustion, 401 no-retry, missing API key, CORS. Shipped as commit 71bef46.
- APK rebuild + Pixel smoke: required JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 (system was pointing at Java 17). Gradle assembleDebug clean. Installed via WiFi to Pixel 192.168.1.236:46703. Launch clean — all 5 plugins registered (CapacitorCookies/WebView/CapacitorHttp/SpeechPlugin/GemmaPlugin), 5 JS modules + CSS loaded, no AndroidRuntime:E, no chromium JS errors. UI screenshot verified.
- Reliability Gate §2: 25/25 CLEARED (logged in GATES.md Gate History 2026-04-16).
- AI end-to-end prod test: curl to prod /api/ai/generate returned "Hoo-hoo, hello little first grader!" — in-character, 10 tokens, finishReason STOP, model gemini-2.5-flash attempt 0.
- GATES.md refresh: #22 targetSdk 34→35 text, Last reviewed bumped to 2026-04-16, new gate-history row added. Commit 1109fdb.
- Feature code carry-forward: committed the exercise-subject-selector feature work from session 2026-04-11-S1 that had been sitting in the working tree for 5 days. Commit ac318ad (13 files, +151/-89) covering 8-subject selector, Astrology/Geology/Biology subjects + badges, thinking-token fix, sysPmt v10, EXPM v5, UI cleanup.
- Docs bundle: CHANGELOG.md, PROJECT_SUMMARY.md, PROJECT_LOG.md committed as 2ae9b2e (3 files, +196/-22) — captures both 2026-04-11-S1 and this session's documentation.
- Gitignore cleanup: added .claude-team/, init.sh, inspect.sh, scan.sh, cldtree.md, dfiles/, DECISION_LOG.md, TECH_DEBT.md, PROJECT_SUMMARY_P1.md to .gitignore. Commit 200c86b.
- CLAUDE.md pointer: 4-line reference to local .claude-team/CUSTOM_RULES.md. Commit d2f138a.
- Path B cleanup: `git rm --cached -r android/app/src/main/assets/public/` — 10 files (index.html, privacy.html, main.css, 5 JS files, cordova.js, cordova_plugins.js) untracked. Working tree preserved. android/.gitignore:96 now effective, no more `git add -u` workarounds. Commit 1f6a4e8.
- GitHub Actions bump for Node.js 24: checkout v4→v6, setup-node v4→v6, setup-java v4→v5, upload-artifact v4→v7. Node.js 20 deprecation annotation silenced (confirmed via full-log grep). Commit 214aed1.
- 8 commits pushed to origin/main across 3 push operations. Every CI run green (runs 24539063487, 24540390797, 24541248512). Prod /api/health now returns `attempt:0` field — deployed retry code verified live.

Pending:
- A1 Play Store signing (L1 gating item, explicitly deferred by user)
- A2–A11 from HQ briefing: Data Safety form, privacy URL hardening, store listing copy, screenshots (5 phone + 1 tablet), feature graphic 1024×500, content rating questionnaire, Common Sense Media submission (post-launch), landing page schema
- GATES.md #22 observation: app runs targetSdk 35 (set for Capacitor 7 compat); still satisfies Play Store minimum of 34. No action required; just noted.

Blocks: None
Next: Resume Play Store submission track — A1 is the gating item. A2, A3, A7 can parallel-track (Security Auditor-owned / Play Store Specialist-owned).
Gate: 25/25 CLEARED
Commits this session: 71bef46, 1109fdb, 2ae9b2e, 200c86b, ac318ad, d2f138a, 1f6a4e8, 214aed1

---

[2026-04-09 to 2026-04-11] COMPRESSED — Project foundation phase. Claude→Gemini engine swap and Vercel proxy deploy. Standards baseline shipped: CI via GitHub Actions, COPPA consent gate + privacy.html, accessibility (ARIA/roles/focus-visible), vitest (21→27 tests), Gemini safety settings, SHA-256 PIN hashing, real `api/health.js` Gemini ping. Gemini Live API WebSocket integration using now-deprecated `gemini-2.5-flash-native-audio-preview-12-2025` with VAD + interruptibility + I/O transcription. `speakDirect()` REST-only TTS (Kore voice) added to isolate exercises/spell/badges from Live API. Candy Pop visual redesign (bright gradient, per-tab colors, colorful chat bubbles). Continuous conversation mode, voice tone modes (4), sysPmt v7→v9→v10 (factual guardrails, voice-only enforcement, STEM teacher framing). 3-model REST fallback chain (`gemini-2.5-flash → 2.0-flash → 2.5-flash-lite`) with 1s/2s backoff. File split `www/index.html` 898→322 lines into css/main.css + js/{ai,speech,exercises,progress,ui}.js. Gradle 8.11.1 + AGP 8.7.3 + Capacitor 7 + targetSdk 35 + Java 21. Audio quality fixes (silent gain, 2ms chunk fades, gapless AudioContext scheduling). Ollie app icon + instant startup. Exercise subject selector (8 subjects incl. Astrology/Geology/Biology + 3 new badges). Fixed Gemini 2.5 thinking-token bug consuming maxOutputTokens (`thinkingBudget=0`). EXPM v4→v5. Recruited Gemini API Specialist (member #7). Multiple Reliability Gates 25/25.

---

[2026-04-08] COMPRESSED — Removed subject selector strip, built Capacitor SpeechPlugin, diagnosed wake word issues (Android mic privacy toggle), explored Picovoice (cancelled), user decided to remove wake word entirely.
