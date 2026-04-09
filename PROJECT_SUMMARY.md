# PROJECT_SUMMARY.md — KiddoAI
> Root: `/home/kirlewubuntu/Downloads/forthechild`
> Pagination rules: see SUMMARY_RULES.md
> **Current file** — newest entries first

---

## File Index

| File | Entries | Date Range |
|------|---------|------------|
| PROJECT_SUMMARY.md | 14 | 2025-04-07 – present |

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
