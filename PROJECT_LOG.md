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

## 2026-04-08 01:15 UTC — Session Wrap-Up
Done:
- Removed subject selector strip (7 subjects) — app is now natural conversation, AI detects subject via `detectedSubject` field
- Difficulty selector moved to parent dashboard (PIN-protected)
- Updated all AI prompts (sysPmt, EXPM, CHKPM, callAI, renderEx, finishEx) for subject-free flow
- Built Capacitor SpeechPlugin (Java) for native Android TTS + STT
- Replaced broken `addJavascriptInterface` approach with proper Capacitor Plugin pattern
- Deployed 6+ debug APK iterations to Pixel 7 Pro, diagnosed wake word issues via logcat
- Identified root cause: Android system mic privacy toggle was blocking audio (raw mic test = 0 amplitude)
- SpeechRecognizer beep caused by destroy/recreate cycle — tried muting streams, audio focus, recognizer reuse
- Explored Picovoice Porcupine — cancelled by user
- **User decision: Remove wake word feature entirely** — plan approved, pending implementation

Pending:
- Execute wake word removal plan (approved): delete WWD module, wake word UI, wake word badge, SpeechPlugin wake methods
- Build + deploy clean APK after removal
- Verify mic button works for speech input (STT via SpeechPlugin.startListening)
- Verify native TTS (SpeechPlugin.speak) works

Next: Implement wake word removal plan, then build/deploy/test mic-button-only interaction.
Gate: N/A — session wrap-up, no gate required
