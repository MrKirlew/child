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
