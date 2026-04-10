# 🌟 KiddoAI Tutor — iOS & Android

An AI-powered educational app for kids (K-6) with voice interaction, interactive exercises,
progress tracking, and reading comprehension. Built with Capacitor for both iPhone and Android.

**AI:** Google Gemini 2.5 Flash via Vercel serverless proxy
**Voice:** Gemini native TTS (Kore voice) + Android SpeechRecognizer
**Backend:** Vercel (`https://forthechild.vercel.app`)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🤖 **Ollie the Owl** | Animated AI tutor — blinking eyes, talking beak, rainbow audio visualizer |
| 🎯 **Exercises Tab** | AI-generated multiple choice, fill-in-blank, and voice answer quizzes |
| 📊 **Progress Tab** | Session scores, accuracy %, streak counter 🔥, 12 subject badges |
| 🔊 **Gemini TTS** | Natural-sounding Kore voice replaces robotic Android TTS |
| 🎤 **Conversation Mode** | Tap mic → Ollie listens → responds → auto-listens again. Tap again to stop. |
| 📚 **Reading Comprehension** | Passages with comprehension Q&A via voice |
| 👨‍👩‍👧 **Parent Dashboard** | PIN-protected: activity stats, difficulty setting |

---

## 🏗️ Architecture

```
Browser / Android WebView
        │
        ▼
  www/index.html  (app shell + UI)
  www/js/         (feature modules — ai.js, speech.js, exercises.js, etc.)
  www/css/        (styles)
        │
        │  HTTPS fetch
        ▼
  Vercel Serverless (forthechild.vercel.app)
  ├── api/ai/generate.js   ← chat + exercises (3-model fallback)
  ├── api/ai/speak.js      ← Gemini TTS (Kore voice)
  └── api/health.js        ← CI health check
        │
        │  Google AI API
        ▼
  gemini-2.5-flash  →  gemini-2.0-flash (fallback)  →  gemini-2.5-flash-lite (fallback)
```

**No API keys in client code.** The Vercel proxy holds `GOOGLE_AI_KEY` as an environment variable.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ — https://nodejs.org
- **Android Studio** (for Android builds)
- **Xcode 15+** (for iOS — Mac only)
- A **Vercel account** with `GOOGLE_AI_KEY` set (or use the deployed proxy at `forthechild.vercel.app`)

### Step 1 — Clone and install
```bash
git clone https://github.com/MrKirlew/child.git
cd child
npm install
```

### Step 2 — Set up environment (local dev only)
Create `.env.local` (gitignored):
```
GOOGLE_AI_KEY=your-google-ai-key-here
LOCAL_PROXY_PORT=3456
```
Get a key at: https://aistudio.google.com

### Step 3 — Sync and build
```bash
npm run build        # lint + test + cap sync
```

---

## 📱 Android Build

### Open in Android Studio
```bash
npm run cap:open:android
```

### Build debug APK
```bash
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Build release AAB (Play Store)
```
Android Studio → Build → Generate Signed Bundle/APK → Android App Bundle
```
> ⚠️ Store your `.jks` keystore file **outside** the repo. Never commit it.

---

## 🍎 iOS Build (Mac only)

```bash
npm run cap:open:ios
```

Add to `ios/App/App/Info.plist`:
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

Then: `Xcode → Product → Archive → Distribute App`

---

## 🔧 Development Scripts

| Script | Purpose |
|--------|---------|
| `npm test` | Run all vitest tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:snap` | Update snapshot tests (review diff first) |
| `npm run lint` | ESLint all JS files |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run build` | lint + test + cap sync (run before every commit) |
| `npm run secret:scan` | Scan for accidental secrets in source |

---

## 📁 Project Structure

```
forthechild/
├── www/
│   ├── index.html          ← App shell (HTML structure only)
│   ├── js/
│   │   ├── ai.js           ← Gemini calls, fallback chain, prompt cache
│   │   ├── speech.js       ← STT/TTS bridge
│   │   ├── exercises.js    ← Exercise generation, scoring, streaks
│   │   ├── progress.js     ← Progress tracking, badges
│   │   └── ui.js           ← DOM helpers, tab routing, animations
│   ├── css/
│   │   └── main.css        ← Candy Pop theme, layout
│   └── privacy.html        ← COPPA privacy policy
├── api/
│   ├── ai/generate.js      ← Vercel fn: chat + exercises
│   ├── ai/speak.js         ← Vercel fn: Gemini TTS
│   ├── health.js           ← Vercel fn: health check
│   └── errors.js           ← Shared error formatting
├── server/index.js         ← Local dev proxy
├── android/                ← Android Studio project
├── ios/                    ← Xcode project
├── tests/                  ← Vitest tests
├── .github/workflows/ci.yml
├── capacitor.config.json
├── vercel.json
├── package.json
├── .eslintrc.json
├── CHANGELOG.md
└── .gitignore
```

---

## 🔒 Security Notes

- **No API keys in client code** — ever. Keys live in Vercel env vars only.
- **PIN storage** — parent PIN stored as SHA-256 hash in `localStorage`. Plain PIN never stored.
- **COPPA** — no PII leaves the device. Vercel logs metadata only, never message content.
- Run `npm run secret:scan` before every push.

---

## 🛒 Publishing

### Google Play Store
1. Generate signed AAB in Android Studio (`targetSdk 34` required)
2. https://play.google.com/console ($25 one-time)
3. Content rating: **Everyone / child-directed**
4. Link to deployed `privacy.html` for privacy policy

### Apple App Store
1. Xcode → Archive → Distribute App
2. https://developer.apple.com ($99/year)
3. Content rating: **4+**
4. Privacy nutrition label: declare microphone usage

---

## 📋 CI / CD

GitHub Actions runs on every push + nightly:
1. `npm run lint`
2. `npm test`
3. `./gradlew assembleDebug`
4. `vercel --prod`
5. `curl -f https://forthechild.vercel.app/api/health` — must pass or deploy rolls back
