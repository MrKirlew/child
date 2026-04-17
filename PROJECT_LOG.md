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

## 2026-04-11 21:15 UTC — Session Wrap-Up
Session: 2026-04-11-S1
Done:
- HQ Briefing: full team assembled (9/9 current), reviewed pending items from S4, Play Store still gating item
- Exercise subject selector: 8 subjects (Comprehension, Grammar, Astrology, Geology, Biology, Engineering, Technology, Math) — child picks a subject, exercises generate for it
- 3 new science subjects: Astrology (stars/planets), Geology (rocks/volcanoes), Biology (plants/animals/body)
- 3 new badges: Star Gazer, Rock Explorer, Life Scientist (5 exercises each)
- Fixed critical exercise generation bug: Gemini 2.5 Flash thinking tokens (381/400) were eating maxOutputTokens budget, truncating JSON → "Could not generate exercise". Fix: thinkingConfig.thinkingBudget=0 for all REST structured output
- sysPmt v9→v10: reframed Ollie as STEM teacher, merged responsive teaching into TEACHING APPROACH (no standalone section), added new subject descriptions (Astrology/Geology/Biology)
- EXPM v4→v5: exercises now target the selected subject, clearer per-type JSON templates
- System prompts added to exercise gen (EXSYS) and answer checking (CHKSYS) for better AI context
- Exercise UI cleanup: input areas hide after answering, show only feedback + Next
- Updated _detectSubject for new subjects (stars/planets → Astrology, rocks/volcano → Geology, plants/animals → Biology)
- All deployed to Pixel 7 Pro via ADB, verified all 4 tabs working on device

Pending:
- Play Store production signing + submission (still the #1 blocker)
- Exercise tab mic still uses SpeechRecognizer (could migrate to Live API later)
- 15-min Live API session reconnect not yet tested
- Capacitor CLI not detecting android platform (manual cp workaround used) — investigate

Next: Play Store signing and submission prep.
Gate: 25/25 CLEARED

---

## 2026-04-10 21:15 UTC — Session Wrap-Up
Session: 2026-04-09-S4
Done:
- HQ Briefing: full marketing review, all tactics passed §0, top priority = Play Store submission
- Fixed TTS routing: added speakDirect() (REST-only TTS) — exercises, spelling, badges no longer route through Live API WebSocket
- Fixed exercises: Ollie no longer answers exercise questions (was sending Q through Live API as conversation)
- Fixed spell history: tapping saved word shows cached result, no redundant API call
- Spell Center enhanced: phonetic pronunciation guide + mic button (say a word out loud)
- Voice tone modes: added "Normal" (default), toned down "Excited", 4 options in parent dashboard
- System prompt v8→v9: voice-only enforcement massively strengthened (forbidden phrases list), English-only guardrail
- Continuous conversation: listen timer resets on every activity (was one-shot 30s from mic start)
- Audio quality: stopped mic-to-speaker feedback (ScriptProcessorNode silent gain), 2ms fade at chunk edges, gapless scheduled playback via AudioContext clock
- Ollie the Owl app icon: replaced default Android robot with custom adaptive icon (vector + PNGs)
- Instant startup: removed auto-greeting API call, app opens instantly with static welcome bubble
- CI fix: Java 17→21 in GitHub Actions
- 11 commits, all pushed, CI all green, Vercel production deployed, Pixel 7 Pro updated

Pending:
- Play Store production signing + submission
- Exercise tab mic still uses SpeechRecognizer (could migrate to Live API later)
- Session reconnect after 15-min Live API limit not yet tested
- CI health check occasionally flaky due to transient Gemini 429

Next: Play Store signing and submission prep.
Gate: 25/25 CLEARED

---

## 2026-04-09 19:30 UTC — Session Wrap-Up
Session: 2026-04-09-S3
Done:
- File split: www/index.html 898→322 lines into css/main.css + js/{ai,speech,exercises,progress,ui}.js
- SHA-256 PIN hashing with auto-migration of plain-text PINs
- health.js real Gemini ping with 8s timeout
- ESLint 9 baseline pass — eslint.config.js created, 0 errors across all JS files
- privacy.html Security Auditor review — COPPA section, expanded parental rights, Candy Pop theme
- Full CLAUDE.md standards compliance audit — 41/41 items passing (token budgets, backoff, prompt caching, token tracking)
- Exercise/Learn/Progress integration fixes (badges, voice fallback, JSON validation, passage display, reset)
- Conversation mode beeping loop replaced with 30s listen window + parent-configurable wait time
- Safe area insets for Android gesture bar / iPhone home indicator / notches
- Gemini Live API integration: replaced 3-hop STT→AI→TTS with single WebSocket to gemini-2.5-flash-native-audio-preview-12-2025
- Automatic VAD, interruptibility, interruption handling via Live API
- System prompt v7: factual accuracy guardrails, voice-only awareness, no JSON for voice mode
- Child's speech now shows in chat (inputAudioTranscription), Ollie finishes full responses
- Fixed mic permission (MODIFY_AUDIO_SETTINGS + WebChromeClient onPermissionRequest grant)
- Gradle 8.11.1 / AGP 8.7.3 / compileSdk+targetSdk 35 for Capacitor 7 + Java 21
- All deployed to Pixel 7 Pro, Vercel production, verified on device

Pending:
- Play Store production signing + submission
- Exercise tab mic still uses SpeechRecognizer (could migrate to Live API later)
- Ollie sometimes says "have you seen X in a picture" — may need further prompt tuning
- Session reconnect after 15-min Live API limit not yet tested

Next: Play Store signing and submission prep.
Gate: 25/25 CLEARED

---

## 2026-04-09 16:30 UTC — Session Wrap-Up
Done:
- Reliability Gate: updated GATES.md (9 obsolete checks modernized), ran full 25-point audit, fixed 3 failures (touch targets, silent catches). 25/25 CLEARED.
- Visual redesign: replaced dark monochrome purple with bright "Candy Pop" theme — soft gradient background, white cards, gradient buttons, per-tab colors, colorful chat bubbles, warm amber accents. Kid-friendly and visually appealing.
- Gemini native audio: replaced robotic Android TTS with gemini-2.5-flash-preview-tts "Kore" voice via /api/ai/speak endpoint. PCM audio decoded + played via Web Audio API.
- Conversation mode: first mic tap starts continuous conversation loop, Ollie auto-listens after speaking, second tap stops. Auto-retry on speech errors.
- Natural prompt: updated system prompt for conversational tone (contractions, varied reactions, follow-up questions, 3-sentence max).
- Model resilience: added 3-model fallback chain (gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite) with retry on 503/429.
- Recruited Gemini API Specialist (member #7).
- All changes pushed to GitHub, CI green, Vercel deployed, APK on Pixel 7 Pro.

Pending:
- Play Store production signing + submission
- Consider WebSocket Live API (gemini-2.5-flash-native-audio-preview) for full duplex audio
- Add more visual polish: illustrations, character animations, particle effects
- Dark mode toggle option for evening use

Next: Play Store signing and submission prep.
Gate: 25/25 CLEARED

---

## 2026-04-09 14:30 UTC — Session Wrap-Up
Done:
- Fixed mic button: added runtime RECORD_AUDIO permission request in SpeechPlugin.java with @PermissionCallback
- Added user-visible error feedback in onAndroidSpeechError() instead of silent failure
- Fixed AI model: swapped non-existent gemma-4-e2b-it → gemini-2.5-flash
- Deployed proxy to Vercel (api/ai/generate.js) — eliminated firewall + mixed content issues
- Updated AI Engineer knowledge version in TEAM.md for Google AI / Gemini
- Implemented 6 industry standards: Gemini safety settings, CI/CD (GitHub Actions), COPPA consent gate + privacy policy, error monitoring, accessibility (ARIA/roles/focus-visible), 21 automated tests (vitest)
- Pushed to GitHub (https://github.com/MrKirlew/child) — CI pipeline passing (test → build APK → deploy Vercel)
- Added nightly CI schedule (daily midnight UTC)
- Natural voice: replaced robotic Android TTS with Gemini native audio (gemini-2.5-flash-preview-tts, "Kore" voice) via /api/ai/speak endpoint
- Continuous conversation mode: mic tap starts loop, Ollie auto-listens after speaking, second tap stops
- Updated system prompt for natural conversational tone (contractions, varied reactions, follow-up questions)
- Recruited Gemini API Specialist to team
- Added model fallback chain (gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite) with retry on 503/429

Pending:
- Verify Gemini native audio voice quality on Pixel 7 Pro
- Production app signing for Play Store submission
- Full Reliability Gate pass (25 points)
- Consider WebSocket Live API (gemini-2.5-flash-native-audio-preview) for full duplex audio in future

Next: Test Gemini TTS voice on device, then run full Reliability Gate.
Gate: N/A — session wrap-up

---

## 2026-04-09 00:30 UTC — Session Wrap-Up
Done:
- Removed wake word feature entirely: deleted WWD module, onWake(), wake word UI (indicator, chip, overlay), wake word badge, wake word CSS, wake word state (wakeWord, wkCnt), wake word settings in parent dashboard
- Cleaned SpeechPlugin.java — removed all wake mode logic, setWakeWord, startWakeWordListening, testRawMic
- Replaced Claude Sonnet 4 with Gemma 4 E2B: created aiGenerate() abstraction layer with on-device plugin + cloud fallback
- Created GemmaPlugin.java (placeholder for on-device, cloud fallback active)
- Created backend proxy server (server/index.js, Express + CORS) — API key stays server-side only
- Moved Google AI API key from client code to server/.env
- All 3 API calls (callAI, newEx, checkVoice) now route through aiGenerate() → proxy → Google AI
- Built and deployed clean APK to Pixel 7 Pro — no beeping, no wake word, Gemma 4 powered
- Updated minSdkVersion from 22 to 26

Pending:
- Verify Gemma 4 E2B response quality for K-6 tutoring (spelling, math, science)
- Test mic button STT end-to-end (requires mic privacy toggle enabled on device)
- Implement on-device Gemma 4 via ML Kit GenAI (requires Kotlin bridge)
- Production deployment of proxy server (currently localhost)

Next: Test Gemma 4 response quality with children's content, then deploy proxy to production hosting.
Gate: N/A — session wrap-up

---

[2026-04-08] COMPRESSED — Removed subject selector strip, built Capacitor SpeechPlugin, diagnosed wake word issues (Android mic privacy toggle), explored Picovoice (cancelled), user decided to remove wake word entirely.
