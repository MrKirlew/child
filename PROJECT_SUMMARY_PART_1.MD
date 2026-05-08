# PROJECT_SUMMARY — PART 1

## Project description

**Ollie** — an app that helps children learn to read and explore STEAM topics (Science, Technology, Engineering, Arts, Mathematics). Children talk to **Ollie**, an AI tutor that speaks like a renowned teacher trained to handle severe ADHD. Target audience is **Kindergarten through 6th grade**. Strict child-safe content filtering: no words inappropriate for children. Several sections for children (Learn, Exercise, Spell, Progress) plus a PIN-gated parent settings dashboard.

Surfaces in scope: web (mobile + desktop browsers via Vercel), Android (Capacitor 7), iOS (Capacitor — config stub only, native project not yet scaffolded), Vercel-hosted serverless backend.

Solo developer. Production-quality bar per `CLAUDE.md` (UAT-gated done, behavior coverage, cross-platform safe areas, 99% uptime SLO, centralized observability, reversible deploys).

---

## Tech Stack & Architecture — Updated: 2026-05-07 13:11:33 CDT

### Runtime / language versions

- **Node engine (root):** `>=18.0.0` (`package.json` engines).
- **Node in CI:** 20 (`actions/setup-node@v6`).
- **Java in CI:** Temurin 21 (`actions/setup-java@v5`).
- **Android SDK:** `minSdkVersion 26`, `compileSdkVersion 35`, `targetSdkVersion 35` (`android/variables.gradle`).
- **Android Gradle Plugin:** 8.7.3; **google-services:** 4.3.15.
- **Android `versionCode`:** 1, **`versionName`:** "1.0".
- **iOS:** not scaffolded (only `ios-info-plist-additions.xml` instructions stub).
- **Browser targets:** mobile-first viewport, `apple-mobile-web-app-capable`, `viewport-fit=cover`. No explicit browserslist.

### Backend dependencies

**Root `package.json`:**

```json
"dependencies": { "@capacitor/core": "^7.0.0" },
"devDependencies": {
  "@capacitor/android": "^7.0.0",
  "@capacitor/cli": "^7.0.0",
  "@capacitor/ios": "^7.0.0",
  "eslint": "^9.39.4",
  "globals": "^17.4.0",
  "vitest": "~4.1.4"
}
```

**`server/package.json` (local Express proxy):**

```json
"dependencies": { "express": "^4.21.0", "cors": "^2.8.5" }
```

**Vercel functions:** no dependencies — bare CommonJS handlers using only Node built-ins (`https`).

### Frontend dependencies

**None.** Vanilla HTML + CSS + script-tag-loaded JS modules. No bundler, no React/Vue/Svelte, no PWA (`manifest.json` and service worker absent despite Apple-mobile meta tags being declared).

### LLM / voice / AI models

| Surface | Model | Notes |
|---|---|---|
| Text generation (primary) | `gemini-2.5-flash` | 3 attempts × exponential backoff (1/2/4s) |
| Text generation (fallback) | `gemini-2.0-flash` | After primary exhausts retries |
| TTS | `gemini-2.5-flash-preview-tts`, voice **Kore** | `maxOutputTokens: 500` (raised from 150 because it truncated 7+ letter spellings) |
| Live (bidi voice) | `gemini-3.1-flash-live-preview` | WebSocket. Replaces `gemini-2.5-flash-native-audio-preview-12-2025` deprecated by Google 2026-04-17 |
| On-device tier (probe) | Capacitor `GemmaPlugin` | Gated check in `www/js/ai.js:48`. Plugin not present; ML Kit GenAI Gradle dep is commented out as TODO |
| In-browser STT | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) | Used for child voice input |

Safety on text generation: `BLOCK_LOW_AND_ABOVE` on all four Google harm categories.

### Env shape (secrets redacted)

Code-referenced env vars:

- `GOOGLE_AI_KEY` — read by `api/ai/speak.js`, `api/ai/generate.js`, `api/ai/live-token.js`, `api/health.js`, `server/index.js`.
- `PORT` — read by `server/index.js` (default `3456`).

CI secrets (`.github/workflows/ci.yml`): `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN`.

`vercel.json`:

```json
{ "outputDirectory": "www", "functions": { "api/**/*.js": { "memory": 256, "maxDuration": 30 } } }
```

`capacitor.config.json` (key fields):

```json
{
  "appId": "com.kiddoai.tutor",
  "appName": "KiddoAI Tutor",
  "webDir": "www",
  "server": { "androidScheme": "http" },
  "plugins": { "SplashScreen": { "launchShowDuration": 0 }, "CapacitorHttp": { "enabled": false } },
  "android": { "allowMixedContent": true },
  "ios": { "contentInset": "automatic" }
}
```

Hard-coded proxy URL in `www/index.html:261` — `window.AI_PROXY = 'https://forthechild.vercel.app/api'`.

### Storage

| Store | Path | Purpose |
|---|---|---|
| `localStorage` key `kai5` | client | Persisted state `S` minus `chatHist`/`busy` (grade, diff, PIN hash, mode, exSubject, mathSkill, counts, exercises, streak, badges, recentEx, recentQ) |
| `localStorage` key `kai5_spell` | client | Spell Center history (last 20 looked-up words) |
| `sessionStorage` (SHA-256 keyed) | client | Prompt cache, 10-min TTL per entry |
| `sessionStorage` `tokenCount_<YYYY-MM-DD>` | client | Daily Gemini token-usage counter (parent dashboard) |
| `memory.db` at repo root | filesystem | SQLite-shaped binary, gitignored, **no code references** — orphaned |
| Server-side DB | — | None. Vercel functions are stateless. No Postgres/Mongo/Redis/object-store. |

### Server modules

**Vercel serverless (`api/`, CommonJS):**

- `api/ai/generate.js` — POST. Gemini text-gen proxy. Primary `gemini-2.5-flash` ×3 with exp backoff, fallback `gemini-2.0-flash`. Injects `BLOCK_LOW_AND_ABOVE` safety on all 4 categories.
- `api/ai/speak.js` — POST. TTS via `gemini-2.5-flash-preview-tts`. Pre-rejects text containing `[`, `]`, `(`, `)`, `/` (model returns 400 "should only be used for TTS"). Returns `{ audio, mimeType }`.
- `api/ai/live-token.js` — POST. Builds Gemini Live WebSocket URL with the API key in the query string and returns it. **The client receives the key in the URL.**
- `api/health.js` — GET. Pings `gemini-2.5-flash` with a 5-token "ping". 8s abort timeout, 3 retries with backoff on 429/503.
- `api/errors.js` — POST. Client error sink → `console.error`, returns 204.

**Local Express proxy (`server/index.js`):** binds `0.0.0.0:3456`. Reads `.env` by hand (no dotenv). Implements **only** `GET /health` and `POST /ai/generate` — does not implement `/ai/speak` or `/ai/live-token`, so it is **not a drop-in replacement** for the Vercel deployment.

### API surface

**Vercel `/api/*`:**

- `POST /api/ai/generate` — Gemini text generation
- `POST /api/ai/speak` — Gemini TTS → `{ audio, mimeType }`
- `POST /api/ai/live-token` — returns Live WebSocket URL (with embedded key)
- `GET /api/health` — upstream Gemini reachability
- `POST /api/errors` — client error sink (204)

**Local Express (port 3456, dev only):** `GET /health`, `POST /ai/generate`.

### Frontend (`www/`, Capacitor `webDir` + Vercel `outputDirectory`)

- `www/index.html` — single-page shell. Inline `<script>` defines: `AI_PROXY`, `reportError()`, constants (`SUBS`, `EX_SUBS`, `EX_EMOJI`, `SCOL`, `GN`, `DN`, `SN`, `MATH_SKILLS`, `MATH_SKILL_HINT`, `BADGES`), state object `S`, SHA-256 PIN hashing + migration, `addBub`/`addTyp`/`fmt`/`esc` helpers, canvas audio visualizer (`VIZ`). Scripts loaded individually in dependency order.
- `www/privacy.html` — privacy policy.
- `www/css/main.css` — single stylesheet.
- `www/audio/letters/{a..z}.wav` — pre-recorded letter audio for spell ceremony (lowercase only).
- `www/js/countdown.js` — reusable 60s SVG-ring talk-window timer (Learn/Exercise/Spell mics); honors `prefers-reduced-motion`.
- `www/js/spell-tools.js` — pure spelling utilities: `cleanSpellWord`, `cleanSpellMeaning`, `buildSpellResult`, `parseSpellLookup`, `extractSpellTarget` (regex-detects "spell X" / "how do you spell X", ignores pronouns), `buildSpellTeachMessage`. Exposed as `globalThis.SpellTools` and `module.exports` (dual-mode for Vitest).
- `www/js/speech.js` — Gemini Live WebSocket client. 24kHz `AudioContext` mic capture, audio playback queue, transcript accumulation, listen-window timer, per-tab mic toggles. `LIVE_MODELS = ['models/gemini-3.1-flash-live-preview']`. Also handles REST TTS fallback path (`/ai/speak`).
- `www/js/ai.js` — REST AI engine. SessionStorage prompt cache (10-min TTL, SHA-256 keyed). Per-day token usage tracking. On-device Gemma probe. `aiGenerate()`, `sysPmt()` (Ollie persona — STEM teacher, voice-only, ENGLISH ONLY, K-6 rules, mode tones: normal/excited/calm/night), `sysPmtJSON()`, `callAI()` learn loop, `recordLearnActivity()`, `rememberConversationTurn()`. Spell-target detection short-circuits to deterministic spell flow.
- `www/js/exercises.js` — `EXSYS` and `CHKSYS` system prompts, math sub-skill picker (Counting/Adding/Subtracting/Multiplying/Dividing) with K–6 ladder hints, MCQ + fill-blank + voice-answer rendering, `submitFB`/`finishEx`/`nextEx`.
- `www/js/progress.js` — Progress tab: per-subject activity bars, accuracy, badges, streak, recent-activity feed (interleaves exercise ✅/❌, learn 💬, spell 🔤).
- `www/js/ui.js` — tab switching, mode/difficulty/listen-wait setters, grade picker, parent PIN flows (`chkPin`, `openDash`, `openChgPin`, `saveChgPin`), spell tab handlers (`spellWord`, `togSpellMic`, `_spellHistory` → `kai5_spell`), typed-message Learn flow, COPPA accept gate.

### Mobile shell

- **Capacitor 7.0.0**, all four packages (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`).
- **Bundle ID:** `com.kiddoai.tutor`. **appName:** `KiddoAI Tutor`. **webDir:** `www`.
- Plugins: SplashScreen (`launchShowDuration: 0`), CapacitorHttp **disabled**. `android/app/src/main/assets/capacitor.plugins.json` = `[]` (no plugins synced).
- Android scheme overridden to `http`; `allowMixedContent: true`.
- Android permissions: `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`. Activity `singleTask`, `exported="true"`. FileProvider authority `${applicationId}.fileprovider`.
- Theme: `Theme.AppCompat.Light.DarkActionBar` (base) + `Theme.SplashScreen` (launch).
- Android dependencies: `androidx.appcompat:appcompat:1.6.1`, `coordinatorlayout:1.2.0`, `core-splashscreen:1.0.0`, `:capacitor-android`, `:capacitor-cordova-android-plugins`. `com.google.mlkit:genai-prompt:1.0.0-beta2` is commented as TODO.
- iOS: Info.plist additions in `ios-info-plist-additions.xml` (manual paste): `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `UIBackgroundModes: [audio]`, `NSAppTransportSecurity.NSAllowsArbitraryLoads = true`. Native iOS project not scaffolded.

### Desktop shell

n/a — no Tauri / Electron config or dependencies.

### Hosting / networking

- **Frontend + serverless API:** Vercel. URL `https://forthechild.vercel.app`. Static `www/` is the origin; functions auto-route under `/api/*`. Per-function 256 MB / 30s `maxDuration`.
- **Local Express proxy:** `0.0.0.0:3456`. No supervisor (no systemd / pm2 / Docker).
- **Mobile:** Capacitor wraps `www/` into Android (and iOS once scaffolded).
- No reverse proxy / tunnel / Cloudflare config. No Dockerfile. No K8s / Terraform.

### CI/CD

`.github/workflows/ci.yml` — name "KiddoAI CI/CD". Triggers: push to `main`, PR to `main`, daily cron `0 0 * * *`.

- **`test`** — Node 20 → `npm ci` → `npm run lint` → `npx vitest run` → grep guard for leaked `AIzaSy` strings in `www/`, `api/`, `server/index.js` (does **not** scan `server/.env`).
- **`build-android`** — needs `test`. Node 20 + Java Temurin 21 → `npm ci` → `npx cap sync android` → `cd android && ./gradlew assembleDebug` → uploads `app-debug.apk`.
- **`deploy-vercel`** — needs `test`, only on push or schedule on `main`. `vercel pull --yes` → `vercel deploy --prod` → post-deploy `curl -f https://forthechild.vercel.app/api/health` (max 40s, 2 retries × 5s delay).

No iOS build job. No release-signed Android job (only debug).

### MCP servers (`.mcp.json`)

- **`playwright`** — Microsoft official `@playwright/mcp` for web debugging.
- **`mobile`** — `@mobilenext/mobile-mcp` for Android via ADB / iOS Simulator.

### ASCII architecture diagram

```
                  ┌──────────────────────────────────────────────────────┐
                  │ Surfaces (single www/ codebase, no bundler/PWA)      │
                  │  • Mobile browser → forthechild.vercel.app           │
                  │  • Desktop browser → forthechild.vercel.app          │
                  │  • Android (Capacitor 7, com.kiddoai.tutor)          │
                  │  • iOS  (config stub only — not scaffolded)          │
                  └────────────┬─────────────────────────────────────────┘
                               │
                  ┌────────────┴─────────────────────────────────────────┐
                  │ www/ (vanilla HTML + JS, script-tag load order)      │
                  │   index.html  ── inline state S, VIZ, BADGES, AI_PROXY│
                  │     ├─ countdown.js   (60s mic ring timer)           │
                  │     ├─ spell-tools.js (pure spell-detect/build)      │
                  │     ├─ speech.js      (Gemini Live WS + REST TTS)    │
                  │     ├─ ai.js          (REST gen, Ollie persona,      │
                  │     │                  prompt cache, token meter,    │
                  │     │                  on-device Gemma probe)        │
                  │     ├─ exercises.js   (gen + check)                  │
                  │     ├─ progress.js    (badges/streak/recent)         │
                  │     └─ ui.js          (tabs, PIN, parent dash, COPPA)│
                  │   localStorage: kai5, kai5_spell                     │
                  │   sessionStorage: prompt cache, daily token count    │
                  └────────────┬─────────────────────────────────────────┘
                               │  HTTPS (REST)            wss:// (Live)
                               ▼                          │
        ┌──────────────────────────────────────────┐      │
        │ Vercel functions (api/*.js, CommonJS)    │      │
        │  POST /api/ai/generate    ── primary→    │      │
        │  POST /api/ai/speak       ── TTS         │      │
        │  POST /api/ai/live-token  ── returns ────┼──────┘ wss URL with key
        │  GET  /api/health         ── ping        │
        │  POST /api/errors         ── log sink    │
        │  256 MB / 30s maxDuration                │
        └────────────┬─────────────────────────────┘
                     │  GOOGLE_AI_KEY (Vercel env)
                     ▼
        ┌────────────────────────────────────────────────┐
        │ Google Generative Language API (v1beta)        │
        │   gemini-2.5-flash               (text primary)│
        │   gemini-2.0-flash               (text fallback)│
        │   gemini-2.5-flash-preview-tts   (TTS, "Kore") │
        │   gemini-3.1-flash-live-preview  (Live audio)  │
        │   Safety: BLOCK_LOW_AND_ABOVE × 4 categories   │
        └────────────────────────────────────────────────┘

        Local-only alt path (not used by deployed clients):
        ┌──────────────────────────────────┐
        │ server/index.js (Express :3456)  │── reads server/.env by hand
        │   GET /health, POST /ai/generate │   no /speak, no /live-token
        └──────────────────────────────────┘

        CI/CD (GitHub Actions, .github/workflows/ci.yml):
          test → build-android (APK artifact) + deploy-vercel → /api/health curl
```

### Doc-vs-code mismatches

- **Branding inconsistency.** `CLAUDE.md` calls the app "Ollie". `package.json:name` = `kiddoai-tutor`. Capacitor `appName` = "KiddoAI Tutor". Android `applicationId` = `com.kiddoai.tutor`. Deployed URL = `forthechild.vercel.app`. In-app branding header = `🌟 KiddoAI`. Five different names across the surfaces.
- **`README.md` is the framework's own README** ("Claude Code Project Framework"), not a project README for Ollie/KiddoAI.
- **Git status shows deleted prior project docs:** `PROJECT_LOG.md`, `PROJECT_SUMMARY.md`, `ROADMAP.md`, `TEAM.md`, `MARKETING_HQ.md`, `RECRUIT.md`, `SUMMARY_RULES.md` — all marked `D` (this PART_1 supersedes them).
- **`server/index.js` advertises only `/health` and `/ai/generate`** but client calls `/ai/speak` and `/ai/live-token`. Pointing `AI_PROXY` at the local server would silently break TTS and Live audio.
- **Two ESLint configs coexist:** `eslint.config.js` (flat, used by `npm run lint`) and `.eslintrc.json` (legacy, gitignored but checked in). Rules differ — only flat config is the source of truth.
- **`.gitignore` lists `memory.db` and `.eslintrc.json`** but both files are present in the working tree.
- **Capacitor Android uses `androidScheme: "http"` + `allowMixedContent: true`** with no inline comment explaining whether this is a deliberate dev/Live-API requirement or a leftover.
- **`api/ai/live-token.js` comment says "the key stays server-side"** but the returned WebSocket URL appends `?key=${API_KEY}`, so the client actually receives the key.

### Known gaps / pending work

- **Likely live `GOOGLE_AI_KEY` on disk** in `server/.env` (gitignored, but present in working tree). CI's leaked-key grep does not scan that file. Rotate + verify never-pushed.
- **iOS not scaffolded.** `npm run cap:add:ios` script exists but has not been run. Only Info.plist additions stub is present.
- **No PWA.** No `manifest.json`, no service worker, despite Apple-mobile meta tags suggesting installable intent.
- **No structured logger / Sentry.** Required by `CLAUDE.md` production bar; `api/errors.js` is a `console.error` sink. `setup-observability` skill is the next move.
- **No release-signed Android build in CI.** Only `assembleDebug` is built; no signing config in `android/app/build.gradle`.
- **No iOS build job in CI.**
- **Gemini Live model is in transition.** Previous `gemini-2.5-flash-native-audio-preview-12-2025` deprecated 2026-04-17; current `gemini-3.1-flash-live-preview` is the only entry in `LIVE_MODELS` with no fallback.
- **On-device Gemma tier is gated on a Capacitor plugin that doesn't exist** (`window.Capacitor.Plugins.GemmaPlugin` checked in `www/js/ai.js:48`, plugin not synced, ML Kit GenAI Gradle dep commented out as TODO).
- **`memory.db` orphaned** at repo root — no code references.
- **`www/audio/letters/` only has 26 lowercase WAVs** — no uppercase variants, no digits, no punctuation.
- **No 99% uptime SLO instrumentation yet** beyond CI's post-deploy `/api/health` curl.

---

## Activity Log

(Entries are appended in pipe-delimited format: `[YYYY-MM-DD HH:MM:SS TZ] | Task | What / How / Why | Verification`)

[2026-05-07 13:11:33 CDT] | UPDATE TECH (initial) | Created PROJECT_SUMMARY_PART_1.MD because none existed. Delegated codebase scan to `tech-stack-scanner` subagent and populated Project description, Tech Stack & Architecture (timestamped), and empty Activity Log. Prior project docs (`PROJECT_LOG.md`, `PROJECT_SUMMARY.md`, `ROADMAP.md`, `TEAM.md`, etc.) are marked deleted in git — PART_1 supersedes them. | Tooling-only scan. No code changed. File written and confirmed under 24k token limit (no hook block). Two findings flagged to user: live-looking GOOGLE_AI_KEY in `server/.env` on disk (gitignored), and 5-way branding inconsistency (Ollie / KiddoAI / kiddoai-tutor / com.kiddoai.tutor / forthechild).

[2026-05-07 20:40:27 CDT] | Spell mic restored as informational hint (no recognizer) | Per user: re-add the spell-tab 🎤 button (removed in 09a7755 due to Android's unsuppressable system listening tone), but make it informational instead of triggering SpeechRecognizer. New behavior: tap → showToast('Type your word, or tap the 🎤 on your keyboard to speak it!', { ms: 4500 }). Input placeholder updated to user's wording: "Type the answer OR use the 🎤 in the keyboard". `togSpellMic()` no-op replaced with the toast call; window._spell* state stubs kept for cap-sync residue safety. CSS: new #spell-mic style — 40×40 circular outlined button matching the purple aesthetic, hover/focus-visible turns the border purple, :active scale .92, night-mode variant. Why: gives kids a visible affordance + clear written guidance without re-introducing the system-tone problem (we never call SpeechRecognizer on this path). | 78/78 vitest pass, eslint clean. Headless chromium smoke (chromium 1217 via local playwright in /tmp): #spell-mic exists with 🎤 + aria-label="How to speak your answer", placeholder text matches exactly, click → toast text matches exactly, 0 console errors. Visual screenshot at 412×915 confirms layout (mic + input + Spell It! row). On narrow viewports the placeholder visibly truncates — full message remains in the DOM and is also surfaced via the toast on tap, so no functional loss. Not yet verified on real Android device.

[2026-05-07 20:19:28 CDT] | Fix Android CI + add regression guards | Diagnosis: build-android job had failed on every run since #71 (commit abfe077, 9 consecutive failures). Step 7 `cd android && ./gradlew assembleDebug` failed with Permission denied because abfe077 ("wrapper-script perm/EOL touch-ups") swapped the Unix exec bits in the git index — `android/gradlew` went 100755 → 100644 and `android/gradlew.bat` went the other way. Pure mode swap, zero content diff. Fix commit d4d217e restored canonical modes via `git update-index --chmod=+x android/gradlew` and `--chmod=-x android/gradlew.bat`. Added two regression guards: (a) `scripts/doctor.js` now reads `git ls-files --stage android/gradlew` and exits 1 with a fix-hint if mode != 100755 — runs via prelint+pretest hooks so any future regression fails the `Lint & Test` job before build-android even starts; (b) `chmod +x android/gradlew` belt-and-suspenders one-liner added to both `assembleDebug` and `assembleRelease` workflow steps so the runner self-heals even if doctor is bypassed. | Fix verified end-to-end: run #80 (commit d4d217e) all jobs green — Lint & Test, Build Android APK (debug + release skipped pending keystore), Build iOS, Deploy to Vercel. Local guard verified: removed exec bit via `git update-index --chmod=-x` and re-ran `npm run doctor` — exits 1 with the expected error and fix command. Restored. 78/78 vitest pass, eslint clean. CLAUDE.md.backup-20260507-130615 left untracked (local backup).

[2026-05-07 19:59:31 CDT] | Spell mic button removed — Android system tone unsuppressable | Commit 09a7755 fix(spell). Earlier _SPELL_MAX_RESTARTS=0 fix did NOT actually take effect because of a JS truthiness bug at speech.js:697 and :721 — `(window._SPELL_MAX_RESTARTS || 3)` short-circuits 0 to 3, so up to 3 restart cycles still ran (each playing Android's listening tone) during the spell countdown. Even with that bug fixed, the FIRST start of SpeechRecognizer plays an unsuppressable system tone on Android — there's no API to silence it short of muting the notification stream globally (hacky). Per user's fallback instruction, removed the spell mic button entirely and pointed users at the system keyboard's voice input button. Removed: #spell-mic + #spell-mic-stage + #spell-listening HTML, togSpellMic body, _spellCountdownStart, _spellSR, Web Speech API path, Android-native start path. togSpellMic + window._spellMic* state kept as no-op stubs. Spell branches in speech.js onAndroidSpeechResult/onAndroidSpeechError now drop straggling events. New #spell-inp placeholder: "Type a word — tap 🎤 on your keyboard to speak". Spell typed-flow (#spell-btn → spellWord) untouched. | 78/78 vitest pass, lint clean. Pixel 7 Pro com.ollieapp.tutor rebuilt + reinstalled + pm clear: accessibility tree confirms ZERO spell-mic Button element, only spell-inp + spell-btn remain on Spell tab. Placeholder text visible with keyboard-mic guidance. Audio cannot be verified remotely (no speaker output via Mobile MCP) — user to confirm.

[2026-05-07 19:33:02 CDT] | Progress section follow-up commit + debug panel removal | Commit 265d7c1 feat(progress). (a) Removed #speech-debug panel + 200px of Learn-tab vertical space (HTML, CSS, all 5 _recordSpeechDebug call sites, clearSpeechDebug global, debugSource arg). (b) progBus.recordActivity now rolls per-day counts into S.dailyCnt capped at 14 days. (c) 7-day SVG sparkline (280×32 polyline + active-day count) above per-subject bars in parent dashboard. (d) Math skill drilldown <div id="d-math"> renders sub-bars for Counting/Adding/Subtracting/Multiplying/Dividing pulled from S.cnt.MathSkills when total > 0; tap row → pickExSub('Math') + pickMathSkill + showTab('ex'). (e) Streak history modal (ov-streak overlay) — tap streak number on Progress card → 14-day filled-circle calendar (🔥 on active days). (f) .hdr-strk pill in #hdr always-visible across tabs when streak >= 1, 1.1s scale+glow keyframe pulse on each correct event when streak >= 5; reflow trick to restart animation on back-to-back corrects. (g) 5-wrong-in-a-row toast: S._wrongStreak per-subject counter, S._toastShown timestamps for 5-min cooldown, single toast on hit then resets. New global showToast helper + #toast-rail bottom-anchored stack. | 78/78 vitest pass (73→78, +5 progBus.recordActivity coverage), eslint clean, Playwright headless on local file:// verified all 5 features: progBus.recordActivity, header streak hidden→visible/pulses, 5 wrong → 1 toast, sparkline rendered, math drilldown 5 rows, streak grid 14 days with 7 active. APK rebuilt + reinstalled on Pixel 7 Pro com.ollieapp.tutor + pm clear: app boots cleanly, Learn tab has reclaimed vertical space (linp moved from y=1719 to y=1955 — full chat scroll area), header streak hidden at fresh state (correct), COPPA gate intact, welcome bubble + tabs + parent icon all intact.

[2026-05-07 19:03:47 CDT] | Progress section MVP redesign — bidirectional + live + dual-audience | Commit 8df2c3c feat(progress). New www/js/progbus.js (8 vitest cases) tiny on/off/emit/once/recordActivity bus. Writers wired: exercises.finishEx, ai.recordLearnActivity, ui.spellWord each progBus.recordActivity(S, sub, kind, correct?) before saveS(). progress.js: subject bars + recent items + badges now carry data-* attrs, single delegated click listener on #tab-prog routes taps — Subject bar→pickExSub+showTab('ex'), recent Learn 💬→showTab('learn')+#linp.value, recent Spell 🔤→showTab('spell')+spell-inp.value+spellWord(), recent exercise→speakDirect, badge→addBub explainer. Subscribed to progBus.on('activity', updProg) at boot for live re-render. ui.js openDash: 6-tile row (Exercises/Accuracy/Badges/Best Streak/Grade/Last Active), per-subject accuracy bars with "💪 needs practice" pill on lowest-acc ≥3-tries subject, subscribes to bus while open / closeAll unsubscribes. CSS: cursor:pointer + lift hover + focus-visible outline on .pbr-tap/.bdg-tap/.rlit-tap. State: S.lastActiveAt+S.lastQuestions added to literal. Why: closes user request "highly cohesive with workflow / bidirectional / fully synchronized / real-time stats for user AND parent". Deferred (separate commits): 7-day sparkline, math-skill drilldown, streak history modal, header streak pulse, 5-wrong toast. | 73/73 vitest pass (52→73, +8 progbus +13 aggregations), eslint clean, Playwright headless on deployed forthechild.vercel.app verified: progBus global with 5 methods, subject bar tap → tab-ex, recent Learn tap → tab-learn + linp populated, parent dash 6 tiles, "needs practice" pill on weakest subject, live update on emit (before:19 → after:20 exercises). Pixel 7 Pro (com.ollieapp.tutor) rebuilt + reinstalled + verified: Progress tab with new layout renders, parent dashboard 6-tile row visible (Exercises/Accuracy/Badges/Best Streak/Grade/Last Active), accuracy-by-subject bars present, all kid-flow tap targets attached.

[2026-05-07 16:42:24 CDT] | Push + production verification | All 6 commits (5ac63e3..b85b186) pushed to origin/main via SSH (newly-generated ed25519 key, public key added to MrKirlew GitHub account). Vercel auto-deployed in ~90s. Post-deploy Playwright drive of forthechild.vercel.app confirms: title "Ollie — STEAM Reading Buddy", header "🦉 Ollie", theme #7C3AED, /manifest.json loads with short_name=Ollie, service worker registered:activated, /api/health returns git_sha=b85b1863d65858d44234bcd76802fa49c8b4b1be (matches HEAD) + env=production, x-request-id headers unique per call (withSentry HOF firing), spell flow drove 3 words (elephant/cat/computer) → 4/4 TTS calls returned HTTP 200 (the previously-failing chunks "elephant." and "kuh." succeed now), 0 console errors, 0 failed requests. Why: closes the verification gate on items #1–4. | All visible production behavior matches expected. Items 1–4 fully shipped. Remaining user-side operational setup unchanged: Sentry account + DSN, UptimeRobot, Vercel project rename or custom domain, replace stop-gap PWA icons, privacy email, Android keystore + 4 GitHub secrets, iOS verification on a Mac.

[2026-05-07 15:55:47 CDT] | Rebrand + PWA + iOS scaffold + Android release-signing | Commit a33182a feat: rebrand to Ollie. (a) Branding: Android applicationId com.kiddoai.tutor → com.ollieapp.tutor (safe — never published to Play Store), Java package directory moved via git mv, Capacitor appId/appName → Ollie, package.json/server/package.json names → ollie/ollie-proxy, www title + header + welcome → Ollie/🦉, [Ollie] log prefix everywhere, GATES.md/RUNBOOK.md/ios-info-plist-additions.xml retitled. (b) PWA: www/manifest.json (theme #7C3AED), www/sw.js (cache-first shell, network-first /api/*), <link rel="manifest"> + apple-touch-icon + theme-color meta + SW registration in index.html, www/icons/ stop-gap PNGs from android xxhdpi launcher (replace with proper Ollie owl art before launch). (c) iOS: npx cap add ios laid down ios/App + Podfile + xcodeproj/xcworkspace; pod install + xcodebuild skipped on Linux. (d) CI: workflow renamed Ollie CI/CD; build-android decodes ANDROID_KEYSTORE_BASE64 secret if set + assembleRelease + uploads release-apk (no-op until secret added); build-android.gradle has signingConfigs.release env-driven; new build-ios job on macos-latest does compile-check with CODE_SIGNING disabled. Why: closes recommended fix order #4 from production-bar audit. | 52/52 vitest pass, eslint clean, Playwright file:// load shows title=Ollie — STEAM Reading Buddy / header=🦉 Ollie / theme-color #7C3AED / window.Sentry + globalThis.Logger initialized / 0 console errors. Audio letter wavs + countdown.js + spell-tools.js + tests/spell-tools.test.js bundled in (required for deploy). NOT YET DEPLOYED — 5 local commits await `git push origin main`. Follow-ups required from user: (i) push, (ii) create Sentry account → DSN into www/index.html + Vercel env, (iii) UptimeRobot monitor on /api/health, (iv) rename Vercel project forthechild → ollie (or buy custom domain — also update window.AI_PROXY in index.html), (v) update privacy.html email when domain is owned, (vi) generate Android release keystore + add 4 GitHub secrets (ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD), (vii) verify iOS scaffold on a Mac (pod install + xcodebuild signing).

[2026-05-07 14:39:15 CDT] | Production-bar audit + 3-commit fix sweep | (1) Lint/test/health audit found busted local node_modules/.bin/ (fixed via npm rebuild) + Spell TTS HTTP-400/500 chunk-0 bug repro'd via Playwright drive of deployed app. (2) Commit 0c4b146 fix(spell): retry TTS with preamble on classifier-miss errors — server-side preamble + auto-retry per Google's TTS docs (May 2026), with 14 new vitest cases. (3) Commit b9ee163 feat(obs): centralized observability — Sentry browser + node SDK 10.52.0 (replay/PII OFF for K-6), withSentry() HOF wrapping all 5 Vercel handlers, structured JSON access logs, /api/health surfaces version+git_sha+env via VERCEL_GIT_COMMIT_SHA fallback, RUNBOOK.md + LOGGING_GUIDE.md docs, .env.example template. (4) Commit 5892b96 chore(ci): scripts/doctor.js preflight wired via prelint+pretest hooks so empty .bin/ fails fast with actionable hint instead of falling through to system eslint. Why: closes 99% uptime SLO + centralized-observability + behavior-coverage gaps from CLAUDE.md production bar. | 52/52 vitest pass (38 prior + 14 new for TTS retry path), npm run lint clean, Sentry CDN bundle 200/85kB reachable, file:// load shows window.Sentry + globalThis.Logger initialized with zero console errors, doctor exits 0 healthy / 1+actionable-message when a shim is missing. NOT YET DEPLOYED — three commits await `git push origin main`. User-side setup required to fully close obs gate: (a) create Sentry account → fill window.SENTRY_DSN in www/index.html + add to Vercel env, (b) create UptimeRobot monitor on /api/health. Recommended fix order #4 (branding consolidation, PWA manifest, iOS scaffold, signed Android, iOS CI job) is queued, not started.
