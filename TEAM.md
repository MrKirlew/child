# TEAM.md — KiddoAI Expert Roster

> **Token rule:** This file must stay under 24,800 tokens.
> When roster grows large, archive inactive members to TEAM_ARCHIVE.md.
> **Knowledge staleness:** 30 days = ⚠️ aging, 60 days = ❌ stale. See CLAUDE.md Team System Standards.

---

## Core Team

| # | Member | Role | Core Domain | Owns |
|---|--------|------|-------------|------|
| 1 | **Dev Lead** | Frontend Architecture | HTML/CSS/JS, Canvas, WebGL, ESLint, file structure | `www/index.html`, `www/js/`, `www/css/`, `.eslintrc.json`, `CLAUDE.md` |
| 2 | **AI Engineer** | AI Engine Integration | Google AI / Gemini, prompt engineering, token budgets, caching, fallback chain | `api/ai/generate.js`, `api/ai/speak.js`, `server/index.js`, all prompt constants |
| 3 | **UX Guardian** | Child Experience | K-6 UX, accessibility, cognitive load, 44px touch targets, ARIA | UI components, tab layouts, Candy Pop theme, font/size decisions |
| 4 | **Platform Engineer** | iOS & Android | Capacitor 7, WKWebView, SpeechPlugin, Gradle, app signing | `capacitor.config.json`, `android/`, `ios/`, `SpeechPlugin.java`, `GemmaPlugin.java` |
| 5 | **Security Auditor** | App & API Safety | API hygiene, COPPA compliance, CSP, secret scanning, PIN hashing, log auditing, marketing COPPA filter | `api/errors.js`, `www/privacy.html`, pre-commit checks, Vercel log config, data safety form |
| 6 | **QA Lead** | Testing & Reliability | vitest, CI pipeline, snapshot tests, health checks, gate runs, error boundaries | `tests/`, `.github/workflows/ci.yml`, `GATES.md` |
| 9 | **Growth & Marketing Strategist** | Growth & Marketing | ASO, paid acquisition, SEO/GEO, influencer strategy, product-led growth, retention, competitor research, K-Factor, MMP, trust building | `MARKETING_HQ.md`, store listings copy, landing page content, ad creatives review |

---

## Knowledge Versions

| Member | Tracks | Version | Last Confirmed | Status |
|--------|--------|---------|----------------|--------|
| Dev Lead | Browser APIs + Tooling | Chrome 147 / Safari 18 / WebAudio W3C Rec 2025-06-17 / ESLint 9 | 2026-04-09 | ✅ |
| AI Engineer | Google AI / Gemini | `gemini-2.5-flash` · Generative Language API v1beta · 3-model fallback · prompt caching · reading level injection | 2026-04-09 | ✅ |
| Platform Engineer | Mobile SDKs + Store | Capacitor 7.x · iOS 18 · Android 15 · targetSdk 34 · minSdk 26 · Play Console 2025 · App Store Connect 2025 | 2026-04-09 | ✅ |
| Security Auditor | Privacy regs | COPPA 2025 Final Rule Amendments · GDPR-K · App Store 2025 · SHA-256 PIN hashing · Vercel log retention | 2026-04-09 | ✅ |
| UX Guardian | Design system | KiddoAI DS v3 · Candy Pop theme · 44px touch targets · WCAG 2.1 AA | 2026-04-09 | ✅ |
| QA Lead | Test matrix + CI | Chrome 147 (Android/iOS/Win/Desktop) · Edge ✅ · Safari 18 ⚠️ · Firefox ❌ · vitest ~4.1.4 · GitHub Actions | 2026-04-09 | ✅ |
| Gemini API Specialist | Google Generative AI | API v1beta · Gemini 2.5 Flash/Pro/Lite · gemma-3/4 · Safety filters · quota · retry · backoff | 2026-04-09 | ✅ |
| Growth & Marketing Strategist | ASO · Paid Acquisition · SEO/GEO · Influencer · PLG · MMP · Retention · COPPA Marketing | Apple Search Ads Advanced · Google UAC · Meta Advantage+ · TikTok Smart+ · Branch.io MMP · Google SGE · COPPA FTC 2025 · EdTech market trends | 2026-04-09 | ✅ |

---

## Recruited Members
*(Added by `Team Child Recruit` — see RECRUIT.md)*

| # | Member | Role | Core Domain | Recruited |
|---|--------|------|-------------|-----------|
| 7 | **Gemini API Specialist** | AI Model Ops | Google Generative AI API, model fallback, retry logic, safety filters | 2026-04-09 |
| 8 | **Play Store Specialist** | App Distribution | Google Play Console, App Store Connect, submission checklists, content ratings, privacy forms, ASO | 2026-04-09 |
| 9 | **Growth & Marketing Strategist** | Growth & Marketing | ASO, K-Factor, paid acquisition (ASA/UAC/Meta/TikTok), SEO/GEO, influencer/community growth, PLG, ratings strategy, MMP, retention, competitor research, trust building — always filtered through Child Best Interest (MARKETING_HQ.md §0) | 2026-04-09 |

---

## ⚠️ Known Version Discrepancy — Resolved 2026-04-09
**Issue:** `package.json` listed `@capacitor/*: ^5.7.0` but TEAM.md tracked Capacitor 7.6.
**Resolution:** `package.json` updated to `^7.0.0`. Platform Engineer owns keeping all `@capacitor/*` versions in sync.

---

## Architecture Ownership Map

| File / Area | Primary Owner | Must Consult |
|-------------|---------------|--------------|
| `www/index.html` | Dev Lead | UX Guardian (UI), Security Auditor (auth/PIN) |
| `www/js/*.js` | Dev Lead | QA Lead (2 tests required per feature) |
| `www/css/main.css` | UX Guardian | Dev Lead (performance) |
| `api/ai/generate.js` | AI Engineer | Gemini API Specialist, Security Auditor (log audit) |
| `api/ai/speak.js` | AI Engineer | Platform Engineer (audio format compatibility) |
| `api/health.js` | QA Lead | AI Engineer (real Gemini ping required) |
| `server/index.js` | AI Engineer | Security Auditor (must mirror api/ logic) |
| `SpeechPlugin.java` / `GemmaPlugin.java` | Platform Engineer | QA Lead (device test required) |
| `android/` / `ios/` | Platform Engineer | Security Auditor (permissions review) |
| `tests/*.test.js` | QA Lead | owner of the tested file |
| `.github/workflows/ci.yml` | QA Lead | Platform Engineer (build step) |
| `CLAUDE.md` / `GATES.md` | Dev Lead | **full team vote** required before any change |
| Prompt constants (`sysPmt`, `EXPM`, `CHKPM`) | AI Engineer | QA Lead (snapshot update required) |
| `www/privacy.html` | Security Auditor | Platform Engineer (review before store submission) |
| Play Store / App Store listings | Play Store Specialist | Growth & Marketing Strategist (copy), Security Auditor (data safety) |
| `MARKETING_HQ.md` | Growth & Marketing Strategist | Security Auditor (§0 filter), full team at every HQ briefing |
| Ad creatives / landing page copy | Growth & Marketing Strategist | UX Guardian (child-appropriateness), Security Auditor (COPPA marketing compliance) |
| `CHANGELOG.md` | whoever made the change | Dev Lead (review on release) |

---

## Team Meeting Protocol
Triggered when expertise gap found or a ⚠️ lens fires in Command Challenge:
1. Dev Lead chairs — states the issue clearly in one sentence
2. Each relevant member researches their slice (1–3 sentences, no padding)
3. Vote: ✅ Proceed / ⏸️ Pause for user input / ❌ Escalate — user decides
4. Decision + rationale logged in PROJECT_LOG.md before proceeding
