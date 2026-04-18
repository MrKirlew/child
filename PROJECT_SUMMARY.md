# PROJECT_SUMMARY.md — KiddoAI
> Root: `/home/kirlewubuntu/Downloads/forthechild`
> Pagination rules: see SUMMARY_RULES.md
> **Current file** — newest entries first

---

## File Index

| File | Entries | Date Range |
|------|---------|------------|
| PROJECT_SUMMARY.md | 37 | 2025-04-07 – present |

---

## 2026-04-18-S1 — Learn Tab Live API Fix (3 fixes, 1 commit)
**Session:** 2026-04-18-S1
**Member:** AI Engineer + Gemini API Specialist (lead) · Dev Lead · QA Lead (full team)
**Task:** Per user HQ ask "why is Learn-tab mic so slow + use gemini-3.1-flash-live-preview". Diagnosed 3 distinct issues, fixed all 3, device-verified on Pixel 7 Pro.
**Findings (root causes):**
1. `LIVE_MODELS[0]='gemini-2.5-flash-native-audio-preview-12-2025'` — deprecated by Google. Every cold start waited 15s `Setup timeout` before falling through to LIVE_MODELS[1].
2. `gemini-3.1-flash-live-preview` rejects `realtimeInput.mediaChunks[]` with WebSocket close code **1007** ("realtime_input.media_chunks is deprecated. Use audio, video, or text instead.") — caused a silent reconnect loop on every voice turn. (Pre-existing bug masked by issue #1.)
3. `ws.onclose` swallowed close code/reason — schema drift was invisible.
**Fixes (all in `www/js/speech.js`):**
- `LIVE_MODELS = ['models/gemini-3.1-flash-live-preview']` (single-element array; structure preserved for future fallbacks)
- Setup timeout `15000ms → 8000ms` (model is known-good)
- `realtimeInput: { mediaChunks: [...] }` → `realtimeInput: { audio: {...} }` per 3.1 schema
- `ws.onclose(cev)` now logs `code/reason/wasClean`
- `api/ai/generate.js:2` comment updated; CHANGELOG.md (3 entries)
**Device verification (Pixel 7 Pro, 192.168.1.236:46703):**
- Cold-start tap-to-ready: **2.3 s** (pre-fix: ~16 s) — pass criterion was ≤ 3 s
- WebSocket stability: open continuously for 87 s in test, no reconnect loops, clean close code=1000 on stop
- Functional smoke: typed "What is seven plus seven" via Live API text path → Ollie audio response with rainbow visualizer + Teaching bubble rendered
**Gate:** 25/25 CLEARED (touches #6 Live audio playback, #7 auto-listen, #8 mic transcription, #23 reliability — all confirmed working)
**Changed files:** www/js/speech.js (LIVE_MODELS, timeout, onclose log, audio envelope), api/ai/generate.js (comment), CHANGELOG.md
**Commits this task:** pending push
**Blocks:** None
**Pending:** B1 (`_FIRST_CHUNK_FAST_BUDGET` chunker for Spell tab) deliberately excluded per plan — still uncommitted in working tree, still awaits device verification

---

## 2026-04-18-S1 — HQ Briefing
**Session:** 2026-04-18-S1
**Member:** Growth & Marketing Strategist (full team, 9/9 present)
**Market Pulse:** Voice-first AI tutoring + privacy-as-differentiator unchanged in past 9 days; no platform shift requires tactic re-pricing.
**Competitor Scan:** Pre-launch (no rank data). Differentiator gap intact: voice-first AI + K-6 8-subject + zero data collection + current TTS pipeline. No new entrants flagged.
**ASO Status:** Pre-launch. 8-subject breadth (post-2026-04-11) is a new asset to surface in A4 copy + A5 screenshots.
**Retention:** No production data. Spell 🔊 replay (S1) is a new re-engagement hook. D1/D7/D30 measurement deferred until post-launch.
**Top 3 Growth Levers:** (L1) B1 device-verify `_FIRST_CHUNK_FAST_BUDGET` chunk-0 latency fix → commit + push + remove timing probes; (L1) A1 Play Store production signing; (L2) A4 store listing copy + A5 screenshots (parallel-trackable).
**Child Safety Check:** All 3 levers re-tested against §0 — 0 removed. Security Auditor co-signed.
**Actions assigned:** B1 (Dev Lead + AI Eng + QA Lead, NEW top of queue), A1 (Platform Eng, gating), A2 Data Safety (Security Auditor), A3 Privacy URL (Security Auditor), A4 Listing copy (Growth), A5 Screenshots (UX), A6 Feature graphic (UX), A7 Content rating (Play Store Spec), A11 Landing schema (Dev Lead + Growth). A8/A9 marked DONE in 2026-04-16-S1. A10 CSM held until post-launch.
**Pending:** No L4/L5 funded while B1/A1 (L1) open.

---

## 2026-04-18-S1 — Session Open
**Session:** 2026-04-18-S1
**Member:** Dev Lead (full team)
**Knowledge status:** All current (9/9 confirmed 2026-04-09, 9 days old — well under 30d staleness).
**Open blocks from last session:** None
**Carry-forward (pending, not blocks):** Uncommitted `www/js/speech.js` (`_FIRST_CHUNK_FAST_BUDGET` chunker, untested on device); timing probes still in `5a83494`; A1 Play Store signing; A2–A11 HQ actions (A8/A9 done).
**CI status:** ✅ green — last push run `24549434978` success; nightly run `24592894616` success (2026-04-18 00:45 UTC).

---

## 2026-04-17-S1 — Session Wrap-Up (Team Child HQ Out)
**Session:** 2026-04-17-S1 (04:30 – 05:45 UTC, ~1h15)
**Member:** Dev Lead (full team, 9/9 present)
**Done:** Spell 🔊 replay feature shipped (6b325f0 carried forward). Diagnosed via live logcat Monitor that the 🔊 tap chain worked end-to-end but prod /api/ai/speak was 404ing because Google deprecated the native-audio-preview-12-2025 model. Reverted to gemini-2.5-flash-preview-tts, replaced silent catches with explicit console.warn logging (9257151). Added fetch pipelining + comma-split for long sentences to eliminate inter-chunk gaps and end-of-sentence truncation (101816c). Attempted gemini-3.1-flash-live-preview — confirmed WebSocket-only via the 404 on REST generateContent. Added [KiddoAI][timing] probes (5a83494) and measured: chunk 0 inference takes 5s for 42 chars — that's the "STILL SLOW" user complaint. User upgraded to tier 2 billing (free tier 10/day quota was exhausting earlier). Drafted + pre-implemented _FIRST_CHUNK_FAST_BUDGET chunker change (emit sentence 0 alone so first audio lands in ~1–1.5s) — uncommitted, awaits device verification.
**Gate:** 25/25 CLEARED
**Pending:** Device verification of _FIRST_CHUNK_FAST_BUDGET change (uncommitted); timing probe cleanup once verified; A1 Play Store signing still L1 gating; A2–A11 HQ actions queued.
**Blocks:** None
**Next:** On Team Child In, user taps 🔊 on "ladder" to re-measure chunk 0 latency. Expect drop from 5014ms → ~1500ms. If confirmed: commit + push + remove probes.
**Commits:** 6b325f0, 9257151, 101816c, 27c641f, 5a83494 (5 pushed; 1 uncommitted)

---

## 2026-04-16-S1 — Session Wrap-Up (Team Child HQ Out)
**Session:** 2026-04-16-S1
**Member:** Dev Lead (full team)
**Done:** HQ briefing with 11 prioritized actions (A1 Play Store = L1 gating). Paired Pixel 7 Pro via WiFi (192.168.1.236:46703, serial 28131FDH300HK3). A9 resolved (restored android/.gitignore + android/app/.gitignore — cap copy android now works). A8 resolved (two-layer CI health retry: api/health.js 3-attempt + curl retry flags + 6 new tests). APK rebuilt under Java 21 and installed on Pixel; clean launch verified. Reliability Gate 25/25. AI prod test returned "Hoo-hoo, hello little first grader!" (in-character, finishReason STOP). Follow-ups: GATES.md #22 targetSdk refreshed to 35, feature carry-forward from 2026-04-11-S1 committed (8-subject exercise selector + Astrology/Geology/Biology + thinking-token fix), docs bundle committed, gitignore expanded for local helpers, CLAUDE.md pointer to .claude-team/, Path B cleanup (10 Capacitor mirror files untracked via git rm --cached), GitHub Actions bumped to Node-24-compatible majors (checkout v6, setup-node v6, setup-java v5, upload-artifact v7 — Node.js 20 deprecation silenced). 8 commits pushed across 3 pushes; every CI run green.
**Gate:** 25/25 CLEARED
**Pending:** A1 Play Store signing (deferred by user); A2–A11 HQ actions queued; GATES.md #22 observation (targetSdk 35 > gate's 34 — both satisfy Play Store minimum).
**Blocks:** None
**Next:** Resume Play Store submission track (A1 gating; A2/A3/A7 can parallel-track).
**Commits:** 71bef46, 1109fdb, 2ae9b2e, 200c86b, ac318ad, d2f138a, 1f6a4e8, 214aed1

---

## 2026-04-16-S1 — Path B cleanup + GitHub Actions bump
**Session:** 2026-04-16-S1
**Member:** Platform Engineer + QA Lead
**Task:** Two follow-ups. (1) `git rm --cached -r android/app/src/main/assets/public/` — 10 files removed from index (index.html, privacy.html, main.css, 5 JS files, cordova.js, cordova_plugins.js). Aligns with android/.gitignore:96 rule that was already ignoring new adds. Working tree preserved; cap sync regenerates on every build. Zero CI impact (commit 1f6a4e8). (2) Bumped .github/workflows/ci.yml — actions/checkout v4→v6, actions/setup-node v4→v6, actions/setup-java v4→v5, actions/upload-artifact v4→v7. Silences Node.js 20 deprecation ahead of 2026-06-02 forced-Node-24 and 2026-09-16 Node-20 removal. Post-push CI run 24541248512 all green with annotation absent (commit 214aed1).
**Gate:** 25/25 CLEARED (unchanged)
**Changed files:** android/app/src/main/assets/public/* (untracked), .github/workflows/ci.yml
**Blocks:** None
**Pending:** None

---

## 2026-04-16-S1 — CI verification + prod deploy + AI test
**Session:** 2026-04-16-S1
**Member:** QA Lead + AI Engineer
**Task:** Pushed 71bef46, 1109fdb, 2ae9b2e to main. GitHub Actions run 24539063487 all green (Lint & Test / Build Android APK / Deploy to Vercel including new curl-retry post-deploy check). Prod /api/health now returns `attempt:0` field — confirming retry code is live on Vercel. Follow-up push of 200c86b, ac318ad, d2f138a also green (run 24540390797, 52s Vercel deploy). Final push of 1f6a4e8 + 214aed1 green (run 24541248512, Node 20 deprecation annotation absent, 18s Lint / 47s Vercel / 1m31s Android). AI end-to-end test: POST to /api/ai/generate with Ollie prompt returned "Hoo-hoo, hello little first grader!" — child-appropriate, 10 tokens, finishReason STOP, model gemini-2.5-flash attempt:0 (no fallback triggered).
**Gate:** 25/25 CLEARED
**Changed files:** None (verification + deployment only)
**Blocks:** None
**Pending:** None

---

## 2026-04-16-S1 — A8: CI Health Check Retry (Two-Layer)
**Session:** 2026-04-16-S1
**Member:** AI Engineer + QA Lead (full team)
**Task:** Fixed flaky CI health check that failed on transient Gemini 429s. Layer 1: `api/health.js` rewritten to loop up to 3 attempts with 1s→2s exponential backoff on 429/503, 8s AbortController timeout per attempt, non-retriable statuses (401/4xx) return immediately. Layer 2: `.github/workflows/ci.yml` curl step gains `--retry 2 --retry-delay 5 --retry-all-errors --max-time 40`. Added `tests/health-retry.test.js` with 6 test cases covering first-shot success, 429-then-success, 503-exhaust-failure, non-retriable 401, missing API key, and CORS header. Lint 0 errors, 27/27 vitest passing.
**Gate:** Pending full 25-point re-run; unit tests green, lint clean. Touches #23 (retry/backoff), #25 (CI).
**Changed files:** api/health.js, .github/workflows/ci.yml, tests/health-retry.test.js, CHANGELOG.md
**Blocks:** None
**Pending:** Reliability Gate re-run, Pixel 7 Pro device smoke once APK rebuild is requested

---

## 2026-04-16-S1 — A9: Restore cap copy android (local dev)
**Session:** 2026-04-16-S1
**Member:** Platform Engineer + Dev Lead
**Task:** Restored `android/.gitignore` and `android/app/.gitignore` from `git show HEAD:` — both files were deleted from the working tree, which broke Capacitor CLI's platform detection and forced a manual `cp -r www/* android/app/src/main/assets/public/` workaround in session 2026-04-11-S1. After restore, `npx cap copy android` exits 0 in ~14ms and `diff -q` confirms www/ and android/app/src/main/assets/public/ are byte-identical across index.html, js/exercises.js, css/main.css. CI path was already correct (`cap sync android` via commit 62e63c7) and is untouched. capacitor.config.json unchanged. No package.json script changes.
**Gate:** Pending full 25-point re-run; no gate points directly touched, but this unblocks all future device-tested work.
**Changed files:** android/.gitignore (restored), android/app/.gitignore (restored), android/app/src/main/assets/public/* (re-synced by cap copy), CHANGELOG.md
**Blocks:** None
**Pending:** None for A9

---

## 2026-04-16-S1 — Step 0: Pixel 7 Pro WiFi pairing
**Session:** 2026-04-16-S1
**Member:** Platform Engineer
**Task:** Paired and connected Pixel 7 Pro via WiFi for this session. Pair port 33713 + code 890592 (pair sub-screen, expired after use). Connect port 46703 (main Wireless debugging). `adb devices` confirms Pixel at `192.168.1.236:46703` as `device`, GUID `adb-28131FDH300HK3-BOhdMt` — serial `28131FDH300HK3` matches historical Pixel 7 Pro entry in PROJECT_LOG.md 2026-04-07. M10L_Pro (USB serial `3040386023058409`) is ALSO connected but is OFF-LIMITS for the rest of this session per user instruction.
**Gate:** N/A — connectivity setup
**Changed files:** None
**Blocks:** None
**Pending:** Device-side install of rebuilt APK when requested

---

## 2026-04-16-S1 — HQ Briefing
**Session:** 2026-04-16-S1
**Member:** Growth & Marketing Strategist (full team)
**Market Pulse:** EdTech AI tutoring still the fastest-growing segment; voice-first + privacy-forward positioning reinforced by post-COPPA-2025 parent sentiment and Common Sense Media's 2026 review emphasis on zero-data-collection.
**Competitor Scan:** Pre-launch — no rank data. Gap reaffirmed: no dominant app combines voice-first AI + K-6 multi-subject (now 8) + zero data collection.
**ASO Status:** Pre-launch. Listing copy targets unchanged; differentiator = "AI tutor that never collects data on your child." 8-subject breadth is a new ASO asset to surface in description.
**Retention:** No production data yet. Hooks coded (localStorage, streaks, 12 badges, conversation auto-listen, win-tied review prompt). D1/D7/D30 measurement infra deferred until post-launch; Play Console built-in sufficient at L1–L2.
**Top 3 Growth Levers:** (1) Close Play Store submission (L1), (2) Finalize ASO listing v1 incl. 8-subject description (L2), (3) Queue Common Sense Media submission for immediately post-launch (L4).
**Child Safety Check:** All 7 proposed tactics passed §0 filter. Zero removed. Security Auditor co-signed.
**Actions assigned:** A1 Production signed AAB (Platform Eng), A2 Data Safety form (Security Auditor), A3 Privacy URL hardening (Security Auditor), A4 Store listing copy (Growth), A5 Screenshots (UX), A6 Feature graphic (UX), A7 Content rating (Play Store Spec), A8 CI health-check retry on 429 (QA Lead), A9 Capacitor CLI platform detection (Platform Eng), A10 CSM submission — hold until live (Growth), A11 Landing page MobileApplication schema + FAQ (Dev Lead + Growth).
**Pending:** All 11 actions pending; no L4/L5 funded while A1 gating item is open.

---

## 2026-04-16-S1 — Session Open
**Session:** 2026-04-16-S1
**Member:** Dev Lead (full team)
**Knowledge status:** All current (9/9 members confirmed 2026-04-09, 7 days old — well under 30d staleness).
**Open blocks from last session:** None
**CI status:** ✅ last known green (2026-04-11 S1 push); nightly status to be re-verified when first code action starts.

---

## 2026-04-11-S1 — Session Wrap-Up (Team Child Out)
**Session:** 2026-04-11-S1
**Member:** Dev Lead (full team)
**Done:** Exercise subject selector (8 subjects: Comprehension, Grammar, Astrology, Geology, Biology, Engineering, Technology, Math). 3 new science subjects + 3 new badges (Star Gazer, Rock Explorer, Life Scientist). Fixed critical exercise generation bug (Gemini thinking tokens eating output budget — thinkingBudget=0 fix). sysPmt v10 (STEM teacher, merged responsive teaching). EXPM v5 (subject-targeted exercises). Exercise UI cleanup (hide inputs after answering). Updated subject detection for Learn tab. All deployed to Pixel 7 Pro.
**Gate:** 25/25 CLEARED
**Pending:** Play Store signing + submission, Capacitor CLI platform detection issue
**Blocks:** None
**Next:** Play Store signing and submission prep

---

## 2026-04-11-S1 — Exercise Subject Selector
**Session:** 2026-04-11-S1
**Member:** Dev Lead + AI Engineer + UX Guardian (full team)
**Task:** Added subject selector to Exercises tab. 8 colorful scrollable pills (Comprehension, Grammar, Astrology, Geology, Biology, Engineering, Technology, Math). Child picks a subject, exercises generate for that subject only. EXPM v5 targets selected subject with type-appropriate hints. 3 new subjects with colors, emojis, prompt descriptions, badges, and subject detection. Exercise UI cleanup: inputs hide after answer submission.
**Gate:** 25/25 CLEARED
**Changed files:** www/index.html, www/js/exercises.js, www/js/speech.js, www/js/ai.js, www/js/ui.js, www/css/main.css, eslint.config.js, CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-11-S1 — Fix Exercise Generation (Thinking Token Bug)
**Session:** 2026-04-11-S1
**Member:** AI Engineer + Dev Lead
**Task:** Exercises failed with "Could not generate exercise. Check connection." Root cause: Gemini 2.5 Flash uses internal chain-of-thought "thinking" that consumed 381 of 400 maxOutputTokens, leaving only 14 tokens for actual JSON output → truncated → JSON.parse failed. Fix: added thinkingConfig.thinkingBudget=0 to generationConfig in aiGenerate() — all REST calls produce structured JSON and don't need thinking. Token budget stays at 400. Verified: exercise generates correctly, finishReason="STOP".
**Gate:** 25/25 CLEARED
**Changed files:** www/js/ai.js
**Blocks:** None
**Pending:** None

---

## 2026-04-11-S1 — Session Open
**Session:** 2026-04-11-S1
**Member:** Dev Lead (full team)
**Knowledge status:** All current (9/9 members confirmed 2026-04-09, 2 days old)
**Open blocks from last session:** None
**CI status:** ✅ green (last 2 pushes passed, nightly in-progress)

---

## 2026-04-10-S4 — Session Wrap-Up (Team Child Out)
**Session:** 2026-04-09-S4
**Member:** Dev Lead (full team)
**Done:** Massive session — 11 commits. HQ briefing (top priority: Play Store). Fixed TTS routing (speakDirect for exercises/spelling/badges). Fixed exercises working. Spell Center: phonetics + mic button. Voice tone: 4 modes with Normal default. System prompt v9 (English-only + voice-only enforcement). Continuous conversation (timer resets on activity). Audio quality (silent gain, chunk fading, gapless scheduling). Ollie owl app icon. Instant startup (no auto-greeting). CI Java 21 fix.
**Gate:** 25/25 CLEARED
**Pending:** Play Store signing + submission, 15-min Live API reconnect test
**Blocks:** None
**Next:** Play Store signing and submission prep

---

## 2026-04-10-S4 — Voice Tone Modes + Voice-Only Enforcement
**Session:** 2026-04-09-S4
**Member:** Dev Lead + AI Engineer
**Task:** Fixed 3 issues: (1) Added "Normal" mode (default) — friendly teacher at natural volume, no whispering or yelling. (2) Toned down "Excited" mode from screaming to enthusiastic. (3) Massively strengthened voice-only enforcement in system prompt v8 — explicit forbidden phrases (show me, look at, point to, draw, etc.) with replacement phrases (tell me, say it out loud, imagine), framed as "you are blind and so is the child." Parent dashboard now shows 4 tone options: Normal, Excited, Calm, Night.
**Gate:** 25/25 CLEARED
**Changed files:** www/js/ai.js, www/js/ui.js, www/index.html, CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-10-S4 — Spell Center: Phonetics + Voice Input
**Session:** 2026-04-09-S4
**Member:** Dev Lead + AI Engineer + UX Guardian
**Task:** Enhanced Spell Center with two new features: (1) Phonetic pronunciation guide — every word lookup now returns letters + meaning + "how to say it" breakdown. (2) Mic button — child can say a word out loud (Android SpeechPlugin + Web Speech API fallback) and it goes through the same spell flow. Removed separate challenge card per user feedback. History items also cache and show phonetics.
**Gate:** 25/25 CLEARED
**Changed files:** www/index.html, www/js/ui.js, www/js/speech.js, www/css/main.css, eslint.config.js, CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-10-S4 — Spelling Challenge Feature (replaced)
**Session:** 2026-04-09-S4
**Member:** Dev Lead + AI Engineer + UX Guardian (full team)
**Task:** New "Challenge Me!" feature in Spell Center. AI picks a grade-appropriate word, says it via speakDirect. Child has 3-minute countdown timer to type spelling. "Hear Again" button replays the word. On submit or timeout: reveals correct word with letter boxes, brief definition, and phonetic pronunciation guide. Timer turns red at 30s. Adds word to history + tracks spelling badge. Night mode support. All deployed to Vercel + Pixel 7 Pro.
**Gate:** 25/25 CLEARED
**Changed files:** www/index.html, www/js/ui.js, www/css/main.css, eslint.config.js, CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-09-S4 — Fix TTS Routing + Deploy
**Session:** 2026-04-09-S4
**Member:** Dev Lead + AI Engineer + QA Lead (full team)
**Task:** Fixed critical TTS routing bug: speak() was routing Exercise/Spell/Badge TTS through Live API WebSocket as conversation turns, causing Ollie to answer exercise questions. Added speakDirect() (REST-only TTS with sentence chunking). Fixed spell history tap to show cached result (no redundant API call). Fixed CI Java 17→21. Committed, pushed, deployed to Vercel production + Pixel 7 Pro APK.
**Gate:** 25/25 CLEARED (lint 0 errors, 21/21 tests, APK built, Vercel deployed, health check OK)
**Changed files:** www/js/speech.js, www/js/exercises.js, www/js/ui.js, www/js/progress.js, eslint.config.js, .github/workflows/ci.yml, .gitignore, CHANGELOG.md
**Blocks:** None
**Pending:** CI health check flaky due to transient Gemini 429 — consider adding retry to health check curl in CI

---

## 2026-04-09-S4 — Session Open
**Session:** 2026-04-09-S4
**Member:** Dev Lead (full team)
**Knowledge status:** All current (9/9 members confirmed 2026-04-09)
**Open blocks from last session:** None
**CI status:** ✅ green (nightly 2026-04-10 00:45 UTC)

---

## 2026-04-09-S4 — HQ Briefing
**Session:** 2026-04-09-S4
**Member:** Growth & Marketing Strategist (full team)
**Market Pulse:** AI tutors fastest-growing EdTech segment; voice-first interfaces and privacy-as-differentiator trending.
**Competitor Scan:** Pre-launch — no rank data. Key gap identified: no major player combines voice-first AI tutoring + K-6 multi-subject + zero data collection.
**ASO Status:** Pre-launch. Target keywords set. Review prompt coded (3 correct answers, parent-facing).
**Retention:** No data yet — retention hooks coded (localStorage progress, streaks, badges, conversation mode).
**Top 3 Growth Levers:** (1) Get on the Play Store, (2) Optimize store listing for ASO, (3) Submit to Common Sense Media.
**Child Safety Check:** All tactics passed §0 filter. Zero removed.
**Actions assigned:** 8 actions across L1–L2: Play Store submission (Platform Eng + Play Store Specialist), screenshots + listing copy + feature graphic (UX Guardian + Growth Strategist), data safety form + privacy URL (Security Auditor), CSM submission + landing page SEO (Growth Strategist + Dev Lead).
**Pending:** All 8 actions pending — blocked on Play Store submission as the gating item.

---

## 2026-04-09-S3 — Session Wrap-Up (Team Child Out)
**Session:** 2026-04-09-S3
**Member:** Dev Lead (full team)
**Done:** Massive session — file split (898→322 lines), SHA-256 PIN hashing, health.js real ping, ESLint 9 pass, privacy.html COPPA review, full standards audit (41/41), exercise/learn/progress integration (5 fixes), conversation beeping fix + configurable listen wait, safe area insets, **Gemini Live API integration** (gemini-2.5-flash-native-audio-preview-12-2025 via WebSocket with VAD + interruptibility + input/output transcription), system prompt v7 (accuracy guardrails, voice-only), mic permission fix (MODIFY_AUDIO_SETTINGS + WebChromeClient), Gradle/AGP/SDK upgrades. All deployed to Pixel 7 Pro + Vercel.
**Gate:** 25/25 CLEARED
**Pending:** Play Store signing, exercise tab Live API migration, 15-min session reconnect testing
**Blocks:** None
**Next:** Play Store signing and submission prep

---

## 2026-04-09-S3 — Full Standards Compliance Audit + 10 Fixes
**Session:** 2026-04-09-S3
**Member:** Dev Lead + Security Auditor + QA Lead + AI Engineer (full team audit)
**Task:** Ran full CLAUDE.md standards compliance audit (31 PASS / 10 FAIL). Fixed all 10: token budgets (chat 300, exercise 400, check 100, TTS 150), exponential backoff 1s→2s, model metadata in API response, prompt caching (SHA-256 + sessionStorage 10-min TTL), token usage tracking (50k daily warning), targetSdkVersion 33→34, removed usesCleartextTraffic, fixed lint glob, added CI lint + health check curl steps.
**Gate:** 25/25 CLEARED
**Changed files:** www/js/ai.js, www/js/exercises.js, www/js/ui.js, api/ai/generate.js, api/ai/speak.js, server/index.js, android/variables.gradle, android/app/src/main/AndroidManifest.xml, eslint.config.js, package.json, .github/workflows/ci.yml, CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-09-S3 — Infrastructure Hardening (5 tasks)
**Session:** 2026-04-09-S3
**Member:** Dev Lead + Security Auditor + QA Lead + AI Engineer (full team)
**Task:** (1) Split www/index.html 898→322 lines into css/main.css + js/{ai,speech,exercises,progress,ui}.js. (2) SHA-256 PIN hashing with auto-migration — plain-text PIN never stored. (3) health.js real Gemini ping with 8s timeout. (4) ESLint 9 baseline pass — eslint.config.js created, 0 errors. (5) privacy.html Security Auditor review — explicit COPPA section, expanded parental rights, Candy Pop theme.
**Gate:** 25/25 CLEARED
**Changed files:** www/index.html (rewritten), www/css/main.css (new), www/js/{ai,speech,exercises,progress,ui}.js (new), api/health.js, api/ai/generate.js, api/ai/speak.js, eslint.config.js (new), www/privacy.html, CHANGELOG.md, package.json
**Blocks:** None
**Pending:** None

---

## 2026-04-09-S3 — Fix Learn/Exercises/Progress Integration
**Session:** 2026-04-09-S3
**Member:** Dev Lead + QA Lead (full team audit)
**Task:** Fixed 5 integration bugs between Learn, Exercises, and Progress tabs: (1) Exercise completions now count toward subject badges via S.cnt update in finishEx(); (2) Voice answer exercises show text input fallback; (3) Exercise JSON validation prevents broken UI from malformed AI responses; (4) Comprehension passages render in exercise card + EXPM prompt updated; (5) Reset session clears bestStreak.
**Gate:** 25/25 CLEARED
**Changed files:** www/index.html (finishEx, renderEx, resetSess, EXPM), CHANGELOG.md
**Blocks:** None
**Pending:** None

---

## 2026-04-09-S3 — Session Open
**Session:** 2026-04-09-S3
**Member:** Dev Lead (full team)
**Knowledge status:** All current (9/9 members confirmed 2026-04-09)
**Open blocks from last session:** None
**CI status:** ✅ green (13243f6)

---

## 2026-04-09 — Session 2 Wrap-Up (Team Child Out)
**Member:** Dev Lead (full team)
**Task:** Session 2: Reliability Gate 25/25 cleared (GATES.md modernized, touch targets fixed, silent catches fixed). Visual redesign from dark mono to bright "Candy Pop" kid-friendly theme. Gemini native audio TTS (Kore voice). Conversation mode. Natural prompt rewrite. Model fallback chain. Recruited Gemini API Specialist. All pushed to GitHub, CI green, Vercel + APK deployed.
**Gate:** 25/25 CLEARED
**Changed files:** GATES.md, www/index.html (CSS redesign + conversation mode + Gemini TTS + error fixes), api/ai/speak.js (new), api/ai/generate.js (fallback chain), server/index.js (fallback chain), SpeechPlugin.java (TTS tuning), TEAM.md (recruit)
**Pending:** Play Store signing, WebSocket Live API exploration, dark mode toggle

---

## 2026-04-09 — Reliability Gate 25/25 CLEARED
**Member:** QA Lead (full team audit)
**Task:** Updated GATES.md §2 — replaced 9 obsolete checks (wake word, Anthropic API, 3D models, story gen, sound effects, children profiles) with current-app checks (Gemini TTS, conversation mode, COPPA gate, comprehension passages, visual feedback, Google AI). Ran full 25-point audit. Fixed 3 failures: touch targets below 44px (#stopb 38→44, #exmic 42→44, .hico 34→44), silent catch blocks (added reportError). All 25 points pass. 21 automated tests still green.
**Gate:** 25/25 CLEARED
**Changed files:** GATES.md, www/index.html (touch targets + error logging)
**Pending:** None — gate cleared

---

## 2026-04-09 — Session Wrap-Up (Team Child Out)
**Member:** Dev Lead (full team)
**Task:** Major session: fixed mic (permission + error feedback), fixed AI model (gemini-2.5-flash), deployed to Vercel, implemented 6 industry standards (safety settings, CI/CD, COPPA, error monitoring, accessibility, tests), added conversation mode, replaced robotic TTS with Gemini native audio (Kore voice), recruited Gemini API Specialist, added model fallback chain with retry. Pushed to GitHub with CI passing.
**Gate:** N/A — wrap-up
**Changed files:** SpeechPlugin.java, MainActivity.java, www/index.html, api/ai/generate.js, api/ai/speak.js, api/errors.js, api/health.js, server/index.js, vercel.json, capacitor.config.json, AndroidManifest.xml, TEAM.md, .github/workflows/ci.yml, www/privacy.html, tests/*.test.js, package.json, .gitignore
**Pending:** Verify Gemini TTS on device, full Reliability Gate, Play Store signing

---

## 2026-04-09 — Deploy to Vercel (Proxy + Static Frontend)
**Member:** Dev Lead + Platform Engineer + AI Engineer
**Task:** Local proxy was unreachable from phone (UFW firewall blocking port 3456 + Chrome WebView mixed content blocking HTTP fetch from HTTPS context). Deployed to Vercel instead: created serverless function at `api/ai/generate.js` (proxies to Gemini 2.5 Flash), health check at `api/health.js`, `vercel.json` config with `outputDirectory: www`. Set `GOOGLE_AI_KEY` as Vercel env var. Updated `window.AI_PROXY` to `https://forthechild.vercel.app/api`. Rebuilt and deployed APK to Pixel 7 Pro. Also deployed static frontend to Vercel for browser access.
**Gate:** Pending — requires on-device test (mic → STT → Vercel AI → TTS)
**Changed files:** api/ai/generate.js (new), api/health.js (new), vercel.json (new), www/index.html (proxy URL), capacitor.config.json (CapacitorHttp disabled)
**Pending:** Test full flow on Pixel 7 Pro. Clean up diagnostic console.logs from aiGenerate().

---

## 2026-04-09 — Fix Android Cleartext Traffic (AI Proxy Unreachable from Phone)
**Member:** Platform Engineer + Dev Lead
**Task:** AI calls failed on device with "Oops! Something went wrong" — proxy was running but Android 9+ blocks cleartext HTTP by default. Added `android:usesCleartextTraffic="true"` to AndroidManifest.xml. Capacitor's `allowMixedContent` only controls WebView policy, not Android's app-level network security. Rebuilt and deployed APK.
**Gate:** Pending — requires on-device test (mic → STT → AI → TTS)
**Changed files:** android/app/src/main/AndroidManifest.xml
**Pending:** Verify full flow on Pixel 7 Pro. For production: switch proxy to HTTPS or use network_security_config.xml.

---

## 2026-04-09 — Fix AI Model (gemma-4-e2b-it → gemini-2.5-flash)
**Member:** AI Engineer
**Task:** AI calls were returning 404 — model `gemma-4-e2b-it` doesn't exist in Google AI API. Listed available models via API, user chose `gemini-2.5-flash`. Updated server/index.js MODEL constant. Restarted proxy, verified end-to-end AI generation works. Updated TEAM.md knowledge version.
**Gate:** N/A — config fix
**Changed files:** server/index.js (model name), TEAM.md (knowledge version)
**Pending:** Test full flow on device (mic → STT → AI → TTS)

---

## 2026-04-09 — Fix Microphone Button (Permission + Error Feedback)
**Member:** Dev Lead + QA Lead + Platform Engineer
**Task:** Mic button was silently failing on Android. Root cause: RECORD_AUDIO permission was declared but never requested at runtime. Fixed SpeechPlugin.java to check `getPermissionState()` and call `requestPermissionForAlias()` with `@PermissionCallback` before starting recognizer. Added user-visible error messages in `onAndroidSpeechError()` — shows feedback in `#slbl` (learn tab) and `#vatr` (exercise tab) instead of failing silently. Synced assets to Android build.
**Gate:** Pending — requires APK rebuild + device test
**Changed files:** SpeechPlugin.java (permission flow), www/index.html (error feedback), android assets (synced)
**Pending:** Rebuild debug APK, deploy to Pixel 7 Pro, verify permission dialog appears on first mic tap, verify STT works after granting

---

## 2026-04-09 — Update AI Engineer Knowledge Version
**Member:** AI Engineer
**Task:** Updated AI Engineer's tracked domain in TEAM.md from Anthropic API / Claude models to Google AI / Gemma 4 E2B, reflecting the engine swap completed on 2026-04-09. New version stamp: `gemma-4-e2b-it` · Generative Language API v1beta · aiGenerate() two-tier (on-device + cloud proxy). Role renamed from "Claude API Integration" to "AI Engine Integration."
**Gate:** N/A — documentation update
**Changed files:** TEAM.md, PROJECT_SUMMARY.md
**Pending:** None

---

## 2026-04-09 — Wake Word Removed + Gemma 4 E2B Integration
**Member:** Dev Lead + AI Engineer + Security Auditor
**Task:** Removed wake word feature entirely (WWD module, UI, badge, CSS, state, SpeechPlugin wake methods). Replaced Claude Sonnet 4 with Gemma 4 E2B via aiGenerate() abstraction (on-device plugin + cloud fallback). Created backend proxy (server/index.js) to keep Google AI API key server-side. Deployed clean APK to Pixel 7 Pro.
**Gate:** N/A — architectural change
**Changed files:** www/index.html (wake word removal + AI engine swap), SpeechPlugin.java (cleaned), GemmaPlugin.java (new), MainActivity.java (register GemmaPlugin), android/app/build.gradle, android/variables.gradle (minSdk→26), server/ (new proxy)
**Pending:** Test Gemma 4 quality, deploy proxy to production, implement on-device inference

---

## 2026-04-08 — Team Child Out (Session Wrap-Up)
**Member:** Dev Lead (full team)
**Task:** Session wrap-up. Major work: subject selector removed (natural conversation), Capacitor SpeechPlugin built, wake word debugged across 6+ APK iterations. Root cause: Android mic privacy toggle blocking audio. Picovoice explored then cancelled. Decision: remove wake word entirely, use mic button only. Plan approved, pending implementation next session.
**Gate:** N/A — wrap-up
**Changed files:** PROJECT_LOG.md, PROJECT_SUMMARY.md
**Pending:** Execute wake word removal plan, build/deploy clean APK

---

## 2026-04-07 — Fix Wake Word + Combine Subjects
**Member:** Dev Lead (coordinating full team)
**Task:** Two major changes: (1) Removed subject selector strip (Spelling/Grammar/Reading/Science/Tech/Eng/Math) — app is now a natural conversation interface where Ollie detects subject from context via `detectedSubject` in AI response JSON. Difficulty selector moved to parent dashboard. (2) Implemented full Android native bridge in MainActivity.java — SpeechRecognizer for wake word detection + mic input, TextToSpeech for Ollie's voice, RECORD_AUDIO permission added. WWD module updated with dual-path (Android native vs Web Speech API) and better error handling.
**Gate:** N/A — structural refactor, full gate on next feature task
**Changed files:** www/index.html (removed subject strip HTML/CSS, updated sysPmt/EXPM/CHKPM/callAI/renderEx/finishEx/init, added AndroidBridge callbacks), android/app/src/main/java/.../MainActivity.java (full AndroidBridge implementation), android/app/src/main/AndroidManifest.xml (RECORD_AUDIO permission)
**Pending:** Build debug APK and test on device; verify wake word end-to-end on Pixel 7 Pro

---

## 2026-04-07 — Team Child In
**Member:** Dev Lead (full team roll call)
**Task:** Assembled all 6 team members. Each self-reported domain, knowledge version, and last confirmed date. All knowledge stamps current as of 2026-04-07. No stale knowledge flagged. Safari 18 ⚠️ and Firefox ❌ noted as known platform limitations.
**Gate:** N/A — assembly command
**Changed files:** PROJECT_SUMMARY.md
**Pending:** Awaiting first task assignment

---

## 2026-04-07 — Deploy App to Pixel 7 Pro via USB
**Member:** Platform Engineer
**Task:** First Android deployment — installed dependencies, scaffolded Android platform (Capacitor), built debug APK, installed to Pixel 7 Pro (28131FDH300HK3) via ADB. Bypassed Play Protect verification temporarily for debug install, re-enabled after.
**Gate:** N/A — deployment task, no feature code changed
**Changed files:** package-lock.json, node_modules/, android/ (all generated)
**Pending:** Production signing for store submission

---

## 2026-04-07 — Team Child Update TEAM.md Knowledge Versions
**Member:** Dev Lead (executing on behalf of full team)
**Task:** Updated all 6 team members' knowledge versions in TEAM.md with user-provided current data — Capacitor 7.6, COPPA 2025 Final Rule Amendments, Chrome 147.x platform-specific builds, WebAudio W3C Rec 2025-06-17, Claude 4.5/4.6 model family, iOS 18 / Android 15
**Gate:** N/A — documentation update, no code change
**Changed files:** TEAM.md, PROJECT_SUMMARY.md
**Pending:** None

---

## 2025-04-07 — Project Initialized

**Member:** Dev Lead (on behalf of full team)
**Task:** Created project instruction files: CLAUDE.md, TEAM.md, GATES.md, RECRUIT.md, SUMMARY_RULES.md, PROJECT_LOG.md, PROJECT_SUMMARY.md
**Gate:** N/A — setup command
**Changed files:** All 7 root files created
**Pending:** First `Team Child In` to version-stamp all members

---
