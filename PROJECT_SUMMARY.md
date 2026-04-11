# PROJECT_SUMMARY.md — KiddoAI
> Root: `/home/kirlewubuntu/Downloads/forthechild`
> Pagination rules: see SUMMARY_RULES.md
> **Current file** — newest entries first

---

## File Index

| File | Entries | Date Range |
|------|---------|------------|
| PROJECT_SUMMARY.md | 22 | 2025-04-07 – present |

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
