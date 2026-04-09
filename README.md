# 🌟 KiddoAI Tutor v2 — iOS & Android

An AI-powered educational app for kids with voice interaction, interactive exercises,
progress tracking, and reading comprehension. Works on **both iPhone and Android**.

---

## ✨ What's New in v2

| Feature | Details |
|---------|---------|
| 🎯 **Exercises Tab** | AI-generated multiple choice, fill-in-blank, voice answer quizzes |
| 📊 **Progress Tab** | Session scores, accuracy, streak counter with 🔥, badges |
| 🔊 **Word-by-Word TTS** | Ollie highlights each word as he reads it |
| 🎤 **Voice Answer Checking** | Speak your answer — AI checks if it's correct |
| 📚 **Reading Comprehension** | Passages with comprehension Q&A via voice |
| 🔥 **Streak System** | Consecutive correct answers build your streak |
| 🏆 **12 Badges** | Earn badges for each subject and milestone |

---

## 🚀 Quick Start — Both Platforms (Capacitor)

### Prerequisites
- **Node.js** 18+ (https://nodejs.org)
- **Android Studio** (for Android)
- **Xcode 15+** (for iOS — Mac only)

### Step 1 — Add Your API Key

Edit `www/index.html` and find this line near the bottom of the `<script>` section.
The app reads `window.ANTHROPIC_API_KEY`. You need to inject it.

**Option A — Capacitor plugin (recommended):**
Use `@capacitor-community/http` or a secure storage plugin to inject the key at runtime.

**Option B — Temporary (dev/family use only):**
Add this line inside `<script>` in `www/index.html`:
```javascript
window.ANTHROPIC_API_KEY = 'sk-ant-your-key-here';
```

Get your key at: https://console.anthropic.com

> ⚠️ For App Store / Play Store submission: use a backend proxy instead of
> embedding the key. Set up a free server on Railway/Render/Vercel that
> calls the Anthropic API on behalf of your app.

### Step 2 — Install Capacitor
```bash
cd KiddoAI_v2
npm install
```

### Step 3 — Add Platforms
```bash
# Android
npm run cap:add:android

# iOS (Mac only)
npm run cap:add:ios
```

### Step 4 — Sync Your Web App
```bash
npm run cap:sync
```

---

## 📱 Android Build

### 1. Open in Android Studio
```bash
npm run cap:open:android
```

### 2. Add Permissions to AndroidManifest.xml
In `android/app/src/main/AndroidManifest.xml`, add inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### 3. Run on Device or Emulator
- Connect your Android phone via USB (enable USB Debugging in Developer Options)
- Click the green ▶ **Run** button in Android Studio

### 4. Build Release APK
```bash
# In Android Studio: Build → Generate Signed Bundle/APK
# Or from command line:
cd android
./gradlew assembleRelease
```

---

## 🍎 iOS Build (Mac Required)

### 1. Open in Xcode
```bash
npm run cap:open:ios
```

### 2. Add Permissions to Info.plist
Open `ios/App/App/Info.plist` in Xcode.
Add the keys from `ios-info-plist-additions.xml`:
- `NSMicrophoneUsageDescription`
- `NSSpeechRecognitionUsageDescription`

Or in Xcode: Select the project → Info tab → Add these keys with the descriptions.

### 3. Set Your Team
In Xcode: Select project → Signing & Capabilities → set your Apple Developer Team.

### 4. Run on iPhone
- Connect your iPhone via USB
- Select it from the device dropdown
- Click ▶ Run

### 5. Archive for App Store
```
Xcode → Product → Archive → Distribute App
```

---

## 🎮 App Features

### 📚 Learn Tab
- **Ollie the Owl** — animated with blinking eyes, talking beak, rainbow visualizer
- **Wake Word** — say "hey ollie" (or custom phrase) to activate lessons
- **Word Highlighting** — Ollie highlights each word as he reads for reading comprehension
- **7 Subjects** × **4 Difficulty Levels** × **7 Grade Levels** (K–6)
- **Phonics Tiles** — golden letter tiles for spelling/reading words

### 🎯 Exercises Tab
- **Multiple Choice** — tap A/B/C/D or say "A", "B", "C", or "D"
- **Fill in the Blank** — type or speak the missing word
- **Voice Answer** — speak your answer for Reading & Grammar
- **Immediate Feedback** — green bounce for correct, red shake for wrong
- **Streak Counter** — build consecutive correct answers for 🔥🔥🔥
- **Session Score** — tracks correct/total/accuracy/best streak

### 📊 Progress Tab
- **Session Stats** — total exercises, correct answers, accuracy %
- **🔥 Streak Card** — current streak + best streak with fire animation
- **Subject Bars** — accuracy breakdown per subject
- **12 Badges** — earn by mastering subjects and building streaks
- **Recent History** — last 12 exercises with ✅/❌

### 👨‍👩‍👧 Parent Dashboard (PIN: 1234)
- Set custom wake word
- View activity stats and subject breakdown
- Change PIN
- Progress snapshot

---

## 📁 Project Structure
```
KiddoAI_v2/
├── www/
│   └── index.html          ← Complete app (HTML/CSS/JS)
├── capacitor.config.json   ← iOS + Android config
├── package.json            ← Capacitor dependencies
├── ios-info-plist-additions.xml  ← iOS permissions guide
└── README.md

After running cap:add:
├── android/                ← Android Studio project
└── ios/                    ← Xcode project
```

---

## 🔧 Voice Features by Platform

| Feature | Android (Chrome WebView) | iOS (WKWebView/Safari) |
|---------|--------------------------|------------------------|
| TTS | ✅ speechSynthesis | ✅ speechSynthesis |
| STT Wake Word | ✅ webkitSpeechRecognition | ⚠️ Limited (see note) |
| STT Mic Button | ✅ Full | ✅ webkitSpeechRecognition |
| Word Highlighting | ✅ | ✅ |

> **iOS Wake Word Note:** Continuous background speech recognition requires
> the native `SFSpeechRecognizer` API via a Capacitor plugin. The tap-to-speak
> mic button works perfectly on iOS. For background wake word on iOS, consider
> adding the `capacitor-voice-recorder` or a custom native plugin.

---

## 🛒 Publishing

### Google Play Store
1. Generate signed AAB: `Build → Generate Signed Bundle`
2. Create account: https://play.google.com/console ($25 one-time)
3. Upload and fill store listing

### Apple App Store
1. Archive in Xcode: `Product → Archive`
2. Create account: https://developer.apple.com ($99/year)
3. Submit via App Store Connect
