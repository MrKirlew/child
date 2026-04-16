# CHANGELOG.md — KiddoAI Tutor

All user-facing changes are documented here.
Format: `- [type] description` — types: `feat`, `fix`, `refactor`, `chore`

---

## [Unreleased]

- [fix] CI health check retries on transient Gemini 429/503 — `api/health.js` now loops up to 3 attempts with 1s/2s exponential backoff; CI curl step gains `--retry 2 --retry-delay 5 --retry-all-errors --max-time 40`
- [fix] Restore `android/.gitignore` and `android/app/.gitignore` so `npx cap copy android` detects the platform again in local dev — no more manual `cp` workaround
- [feat] Exercises: subject selector — child picks from 8 subjects (Comprehension, Grammar, Astrology, Geology, Biology, Engineering, Technology, Math) before exercising
- [feat] Exercises: 3 new science subjects (Astrology, Geology, Biology) with badges — Star Gazer, Rock Explorer, Life Scientist
- [feat] Learn: Ollie is now a STEM teacher — responds based on what the child says, diagnoses misunderstandings, builds on their words
- [feat] Exercises: system prompts for exercise generation and answer checking — better quality, voice-friendly exercises, generous phonetic answer checking
- [fix] Exercises: thinking tokens were eating output budget — disabled thinking for structured JSON calls
- [fix] Exercises: input areas (text field, mic, submit) now hide after answering — cleaner feedback-only view before next exercise
- [fix] Exercise TTS: questions and feedback now use REST TTS, preventing Ollie from answering its own questions via Live API
- [fix] Spell Center TTS: spelling pronunciation uses REST TTS instead of routing through Live API WebSocket
- [fix] Spell history: tapping a saved word shows cached result and speaks via REST — no duplicate API call or history entry
- [fix] Badge TTS: badge announcements use REST TTS instead of creating Learn tab conversation bubbles
- [feat] speakDirect() function: REST-only TTS with sentence-boundary chunking per CLAUDE.md standards
- [feat] Spell Center: phonetic pronunciation guide added to every word lookup (letters + meaning + "how to say it")
- [feat] Spell Center: mic button — say a word out loud and Ollie teaches it (Android native + Web Speech API)
- [feat] Voice Tone: new "Normal" mode (default) — friendly teacher, natural volume, no whispering or yelling
- [fix] Renamed "Exciting" to "Excited" and toned it down — enthusiastic but not screaming
- [fix] System prompt v8: much stronger voice-only enforcement — explicit forbidden phrases list + replacement phrases, "you are blind" framing
- [fix] Continuous conversation: listen timer now resets on every activity (child speaks, Ollie responds, audio plays) instead of firing once 30s after mic start
- [fix] Audio static: stopped mic audio from playing through speakers (ScriptProcessorNode was connected to destination — now routes through silent gain node)
- [fix] Audio clicks: added 2ms fade-in/fade-out at PCM chunk boundaries to eliminate pops between audio segments
- [fix] Mic capture: added autoGainControl to getUserMedia for cleaner input levels
- [fix] Audio choppiness: replaced callback-chain playback with gapless scheduled playback using AudioContext clock timing — chunks now play seamlessly with zero JS-callback gaps
- [fix] English-only guardrail: system prompt v9 — Ollie never responds in another language, never uses foreign characters
- [fix] Instant startup: removed Live API connection + auto-greeting on launch. App opens instantly with static welcome bubble. Live API connects on first mic tap.
- [refactor] Split www/index.html (898→322 lines) into www/css/main.css + www/js/{ai,speech,exercises,progress,ui}.js
- [fix] SHA-256 PIN hashing — parent PIN stored as hash, never plain text. Auto-migrates existing PINs.
- [fix] health.js makes real Gemini API ping with 8s timeout instead of static 200
- [fix] ESLint baseline pass — eslint.config.js for ESLint 9+, zero errors across all JS files
- [fix] privacy.html updated — explicit COPPA compliance section, SHA-256 PIN mention, Candy Pop theme, expanded parental rights
- [fix] Token budgets enforced: chat ≤300, exercise ≤400, answer check ≤100, TTS ≤150
- [fix] Exponential backoff: 1s→2s per CLAUDE.md (was 500ms fixed)
- [feat] Model metadata (_meta.model) included in API response for client-side debugging
- [feat] Prompt caching via SHA-256 hash + sessionStorage (10-min TTL)
- [feat] Token usage tracking in sessionStorage with 50k daily warning in parent dashboard
- [fix] targetSdkVersion 33→34, removed android:usesCleartextTraffic="true"
- [fix] npm run lint glob fixed (quoted to prevent node_modules expansion)
- [fix] CI pipeline: added lint step + post-deploy health check curl
- [fix] Conversation mode: replaced infinite beeping loop with 30s listen window (5s retry gap)
- [feat] Listen wait time: configurable in parent dashboard (10s/20s/30s/45s/60s), default 30s
- [fix] After listen window expires, shows "Tap 🎤 if you need anything!" instead of restarting
- [fix] Upgraded Gradle 8.0.2→8.11.1, AGP 8.0.0→8.7.3, compileSdk/targetSdk→35 for Capacitor 7 + Java 21 compatibility
- [fix] Safe area insets: app no longer overlaps system navigation bar (Android gesture bar, iPhone home indicator, notches, Dynamic Island)
- [fix] TTS consistency: Gemini Kore voice retries twice, never falls back to robotic Android TTS
- [fix] System prompt v6: factual accuracy guardrails (verified math), voice-only awareness (no "show me"), better teaching strategies, no personal info requests
- [fix] Model chain: gemini-2.5-flash retries 3x with exponential backoff (1s/2s/4s) before single fallback. No more frequent model switching on Wi-Fi.
- [fix] STT patience: SpeechRecognizer waits 3s after speech ends and 5s for possible completion — gives kids time to think
- [feat] Gemini Live API: replaced 3-hop STT→AI→TTS with single WebSocket to gemini-2.5-flash-native-audio-preview-12-2025
- [feat] Automatic VAD: model detects when child starts/stops speaking — no more SpeechRecognizer beeping
- [feat] Interruptibility: child can interrupt Ollie mid-sentence
- [feat] Ephemeral tokens: API key never exposed to client (api/ai/live-token.js)
- [fix] Startup voice: welcome message uses Gemini Kore voice via REST TTS, never robotic Android TTS
- [fix] System prompt v6: factual accuracy guardrails, voice-only awareness, better teaching strategies
- [fix] Exercise completions now count toward subject badges (Spelling Star, Grammar Guru, etc.)
- [fix] Voice answer exercises show text input fallback when speech recognition unavailable
- [fix] Exercise JSON validation prevents broken UI from malformed AI responses
- [fix] Comprehension passage now displays in exercise card when AI provides one
- [fix] Reset session now clears best streak along with other exercise stats

---

## [1.0.0] — 2026-04-09

- [feat] Gemini 2.5 Flash native TTS — Kore voice replaces robotic Android TTS
- [feat] Conversation mode — mic tap starts continuous loop, Ollie auto-listens after responding
- [feat] Candy Pop visual theme — bright kid-friendly colors, white cards, gradient buttons
- [feat] 3-model AI fallback chain — gemini-2.5-flash → gemini-2.0-flash → gemini-2.5-flash-lite
- [feat] Vercel serverless proxy — no API keys in client, eliminates mixed-content issues
- [feat] COPPA consent gate on first launch
- [feat] 21 automated vitest tests with CI pipeline (GitHub Actions)
- [feat] Accessibility improvements — ARIA roles, focus-visible, 44px minimum touch targets
- [fix] Mic button silent failure — added runtime RECORD_AUDIO permission request
- [fix] AI model 404 — replaced non-existent model with gemini-2.5-flash
- [fix] Android cleartext traffic — resolved via Vercel HTTPS proxy
- [refactor] Removed wake word feature — mic button only interaction
- [refactor] Removed subject selector — Ollie detects subject from conversation context
- [chore] Moved Google AI API key from client to Vercel environment variables
