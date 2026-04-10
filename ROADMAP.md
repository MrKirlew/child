# ROADMAP.md — KiddoAI Product & Growth Roadmap

> Owned jointly by: **Dev Lead** (feature work) + **Growth & Marketing Strategist** (growth sequencing)
> Updated at every `Team Child HQ` and after every major feature release
> **Token rule:** Under 24,800 tokens.
> Priority is always driven by the Marketing Hierarchy of Needs (MARKETING_HQ.md §2)
> **Non-negotiable:** Every feature on this roadmap is evaluated against the Child Best Interest Filter (MARKETING_HQ.md §0)

---

## Current Phase

```
┌─────────────────────────────────────────────────────────┐
│  ▶ CURRENT:  LEVEL 1 — FOUNDATION                       │
│    Play Store submission + app stability                 │
│                                                          │
│    NEXT:     LEVEL 2 — AWARENESS                         │
│    ASO, SEO/GEO, organic discovery                       │
└─────────────────────────────────────────────────────────┘
```

Do not advance to the next level until the current level's exit criteria are met.

---

## Level 1 — Foundation (Current Sprint)
**Exit criteria:** App is live on Play Store, crash-free, COPPA gate working, full CI green

### ✅ Done
- [x] Gemini 2.5 Flash integration with 3-model fallback chain
- [x] Gemini native TTS (Kore voice)
- [x] Conversation mode (continuous mic loop)
- [x] Candy Pop visual redesign
- [x] COPPA consent gate
- [x] Vercel serverless proxy (no API keys in client)
- [x] 21 automated tests + CI pipeline (GitHub Actions)
- [x] Touch targets ≥ 44px, ARIA roles
- [x] 25/25 Reliability Gate cleared
- [x] Architecture direction files (CLAUDE.md, GATES.md, TEAM.md, etc.)

### 🔲 In Progress / Remaining
- [ ] **Play Store signing** — production keystore + signed AAB
  - Owner: Platform Engineer
  - Blocker: none
- [ ] **Play Store submission** — listing, screenshots, content rating, data safety form
  - Owner: Play Store Specialist + Growth & Marketing Strategist
  - Dependency: signed AAB complete
- [ ] **`www/index.html` split** — currently exceeds 1,500 line limit
  - Owner: Dev Lead
  - Extract: `www/css/main.css`, `www/js/ai.js`, `www/js/speech.js`, `www/js/exercises.js`, `www/js/progress.js`, `www/js/ui.js`
- [ ] **SHA-256 PIN hashing** — parent dashboard PIN must not be stored as plain text
  - Owner: Security Auditor + Dev Lead
- [ ] **health.js real Gemini ping** — current health check must make a live API call, not just return 200
  - Owner: QA Lead + AI Engineer
- [ ] **ESLint baseline pass** — run `npm run lint` on current codebase, fix all errors
  - Owner: Dev Lead
- [ ] **privacy.html review** — Security Auditor reviews before store submission
  - Owner: Security Auditor

---

## Level 2 — Awareness (Next Sprint)
**Entry criteria:** App is live on Play Store, crash rate < 1%, Level 1 items complete
**Exit criteria:** Ranking for ≥ 3 primary keywords in top 50, landing page live with SEO basics

### Planned
- [ ] **ASO keyword optimization** — title, subtitle, description updated with keyword research
  - Owner: Growth & Marketing Strategist
  - Tool: AppFollow free tier + Play Console keyword data
- [ ] **Landing page** — dedicated domain or improved Vercel root with proper SEO meta, schema markup (`MobileApplication`, `EducationalApplication`), FAQ section
  - Owner: Dev Lead + Growth & Marketing Strategist
- [ ] **GEO content** — 2 long-form articles targeting parent search queries ("how AI tutors help kids read at home")
  - Owner: Growth & Marketing Strategist
  - Distribution: app landing page + submit to 2 EdTech publications
- [ ] **Common Sense Media submission**
  - Owner: Growth & Marketing Strategist + Security Auditor (data practices doc)
- [ ] **App screenshots refresh** — screenshots that convert (show Ollie + child win moment, not UI)
  - Owner: UX Guardian + Growth & Marketing Strategist
- [ ] **Feature graphic (Play Store)** — 1024x500 PNG
  - Owner: UX Guardian
- [ ] **iOS submission** (if Mac available)
  - Owner: Platform Engineer + Play Store Specialist

---

## Level 3 — Retention (Future Sprint)
**Entry criteria:** D1 retention > 30%, app stable, ASO generating organic downloads
**Exit criteria:** D7 > 20%, push notification system live, parent email digest working

### Planned
- [ ] **Session habit prompt** — parent sets preferred session time in dashboard; app sends push reminder
  - Owner: Dev Lead + UX Guardian
  - Child safety check: reminder targets parent, not child
- [ ] **Weekly progress email** — parent opt-in digest: streak, badges earned, accuracy trend
  - Owner: Dev Lead + Security Auditor (CAN-SPAM compliance)
- [ ] **D1/D7/D30 tracking** — implement retention measurement via Play Console + App Store Connect analytics
  - Owner: Growth & Marketing Strategist + QA Lead
- [ ] **Onboarding audit** — measure time-to-first-Ollie-interaction; target < 60 seconds
  - Owner: UX Guardian + Dev Lead
- [ ] **Review prompt system** — fires after 3 consecutive correct answers, parent dashboard context only
  - Owner: Dev Lead + UX Guardian
  - Timing rule: never on first session, never mid-child-session

---

## Level 4 — Trust (Future Sprint)
**Entry criteria:** D7 > 20%, ≥ 50 ratings (4.0+ average), Common Sense Media rating received
**Exit criteria:** Recognized by ≥ 1 credible EdTech publication, teacher endorsement secured

### Planned
- [ ] **Teacher outreach program** — 10 elementary school teachers get free access in exchange for honest feedback
  - Owner: Growth & Marketing Strategist
  - Child safety: teachers provide feedback, no child data is collected
- [ ] **Micro-influencer pilot** — identify 3 homeschooling parent accounts (5K–50K followers), offer free access
  - Owner: Growth & Marketing Strategist
  - Security Auditor sign-off: all influencer content reviewed against §0 filter before going live
- [ ] **Trust badge on landing page** — "COPPA Compliant · No Ads · No Child Data Collected"
  - Owner: Dev Lead + Security Auditor
- [ ] **Negative feedback loop** — "Contact Support" more prominent than "Leave a Review" in parent dashboard
  - Owner: UX Guardian + Dev Lead
- [ ] **EdTech publication pitch** — EdSurge, Common Sense Media, Cult of Pedagogy
  - Owner: Growth & Marketing Strategist

---

## Level 5 — Scale (Future — when Levels 1–4 are solid)
**Entry criteria:** D30 > 12%, K-Factor measured, Level 4 trust signals in place
**Exit criteria:** CPA < $3 on at least one paid channel, K-Factor measured and improving

### Planned
- [ ] **Apple Search Ads launch** — start at $5/day, keywords: "kids tutor", "reading app grade 2"
  - Owner: Growth & Marketing Strategist + Security Auditor (COPPA ad compliance)
- [ ] **Shareable achievement cards** — parent-shareable badge/milestone cards with "Made with KiddoAI" watermark
  - Owner: Dev Lead + UX Guardian
  - Child safety: no real name, no photo, avatar/nickname only
- [ ] **Referral program** — parent-to-parent only, appears in parent dashboard only
  - Owner: Dev Lead + Growth & Marketing Strategist
- [ ] **Google App Campaigns (UAC) test** — $10/day, 7-day test only
  - Owner: Growth & Marketing Strategist
  - Child safety: Families policy compliance, child-directed treatment enabled
- [ ] **MMP integration (Branch.io)** — attribution for paid campaigns
  - Owner: Dev Lead + Security Auditor
  - Requires: child-directed mode confirmed before SDK initialization
- [ ] **Creative hook testing** — 5 video ad hooks tested simultaneously
  - Owner: Growth & Marketing Strategist
  - Child safety: no child faces without written parental consent

---

## Icebox (Good Ideas — Not Yet Prioritized)
These are valid but premature. Revisit when the relevant Hierarchy level is reached.

- WebSocket Live API (gemini-2.5-flash-native-audio-preview) for full-duplex audio
- Dark mode toggle for evening use
- Multilingual support (Spanish first — large US EdTech market)
- Character animations and particle effects for Ollie
- iOS App Store submission (if Mac device available)
- TikTok Ads (revisit at Level 5 — requires strong UGC creative pipeline first)
- In-app parent subscription tier (requires privacy policy update + store billing setup)
- On-device Gemma inference via ML Kit GenAI (reduces latency + API costs at scale)

---

## Roadmap Update Protocol
- **After every `Team Child HQ`:** Growth & Marketing Strategist updates current level status
- **After every `Team Child [task]`:** Dev Lead checks off completed items
- **Monthly:** Full roadmap review — move items between levels if priorities shift
- **Never remove items** — mark them ✅ Done or move to Icebox with a reason
