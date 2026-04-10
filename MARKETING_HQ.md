# MARKETING_HQ.md — KiddoAI Growth & Marketing Intelligence

> Owned by: **Growth & Marketing Strategist** — reviewed monthly, updated with every `Team Child HQ`
> Referenced by: CLAUDE.md `Team Child HQ` command
> **Token rule:** Under 24,800 tokens.
> **Non-negotiable filter:** Every strategy, tactic, and creative in this file is subject to the
> Child Best Interest Filter (§0). If it conflicts, it is removed — no exceptions.

---

## §0 — The Child Best Interest Filter (Applied to Everything)

Before any marketing strategy is proposed, approved, or executed, it must pass all five:

| Filter | Question | Fail condition — remove the strategy |
|--------|----------|--------------------------------------|
| **Manipulation** | Does this use dark patterns, urgency loops, or guilt to drive engagement? | Any tactic designed to maximize screen time at the expense of the child's wellbeing |
| **Data** | Does this collect, share, or infer any data about a child? | Any tactic requiring tracking, profiling, or behavioral data from under-13 users |
| **Content** | Is all ad creative, influencer content, and landing page copy appropriate for ages 5–12? | Anything scary, violent, adult-themed, or using social comparison to pressure children |
| **Targeting** | Are paid ads targeted at parents and educators — never at children directly? | Any ad placement on platforms primarily used by under-13s (e.g., YouTube Kids pre-roll targeting children) |
| **Trust** | Does this build genuine trust with parents, or does it exploit their anxiety? | Fear-based marketing ("your child is falling behind!") that exploits parental anxiety |

**Security Auditor co-signs every marketing plan.** If a strategy passes the §0 filter, Security Auditor confirms it is also COPPA-compliant before it is logged as approved.

---

## §1 — HQ Briefing Format

`Team Child HQ` runs this briefing every session. Growth & Marketing Strategist leads.

```
╔══════════════════════════════════════════════════════╗
║          KIDDOAI HQ BRIEFING — [YYYY-MM-DD]          ║
╠══════════════════════════════════════════════════════╣
║  1. MARKET PULSE        — What's trending in EdTech / Kids apps this week?
║  2. COMPETITOR SCAN     — Who moved in our keyword/rank space?
║  3. ASO STATUS          — Current keyword rankings, rating velocity, conversion rate
║  4. RETENTION REPORT    — Session length, D1/D7/D30 retention (if data available)
║  5. GROWTH LEVERS       — Top 3 highest-ROI actions this sprint
║  6. CHILD SAFETY CHECK  — Any proposed action reviewed against §0 filter
║  7. ACTION LIST         — Prioritized by Marketing Hierarchy (§2), owner assigned
╚══════════════════════════════════════════════════════╝
```

Each team member contributes their slice:
- **Security Auditor** — flags COPPA conflicts, removes non-compliant tactics
- **UX Guardian** — rates child experience impact of each proposed tactic (1–5, child-friendly scale)
- **Platform Engineer** — confirms store policy compliance (no guideline violations)
- **Dev Lead** — flags any product changes needed to enable the tactic

HQ Briefing is logged to PROJECT_LOG.md as a compressed summary. Full detail lives in MARKETING_HQ.md updates.

---

## §2 — The Marketing Hierarchy of Needs

Work bottom-up. A higher level is wasted spend if the level below it is broken.

```
┌─────────────────────────────────────────────────────────┐
│  LEVEL 5 — SCALE          Paid ads, influencers, PR     │
│             ↑ Only when Level 4 is strong               │
├─────────────────────────────────────────────────────────┤
│  LEVEL 4 — TRUST          Reviews, social proof,        │
│                           community presence            │
│             ↑ Only when Level 3 is proven               │
├─────────────────────────────────────────────────────────┤
│  LEVEL 3 — RETENTION      D1/D7/D30 loops,              │
│                           push notifications, habits    │
│             ↑ Only when Level 2 is working              │
├─────────────────────────────────────────────────────────┤
│  LEVEL 2 — AWARENESS      SEO, GEO, ASO, organic        │
│             ↑ Only when Level 1 is solid                │
├─────────────────────────────────────────────────────────┤
│  LEVEL 1 — FOUNDATION     App stability, zero crashes,  │  ← START HERE
│            (HIGHEST       COPPA compliance, fast load,  │
│             PRIORITY)     seamless onboarding           │
└─────────────────────────────────────────────────────────┘
```

**Current focus is always stated at the top of each HQ briefing.**
Do not fund Level 5 tactics while Level 1 or 2 problems are open.

---

## §3 — App Store Optimization (ASO)

ASO is the highest-ROI channel for an EdTech app. It compounds over time and costs nothing per install.

### Keyword Strategy
- **Primary keywords (owned):** "AI tutor for kids", "kids learning app", "K-6 educational app", "voice tutor children"
- **Long-tail targets:** "reading comprehension app grade 2", "math tutor kindergarten", "spelling app for kids with voice"
- **Update keyword list monthly** — Growth & Marketing Strategist runs a competitor keyword gap analysis using sensor tower data or free tools (AppFollow, AppTweak free tier, or manual App Store search rank checking)
- **Never stuff keywords** — Google Play and Apple both penalize keyword stuffing in titles/descriptions

### Keyword Gap Analysis Protocol
Every `Team Child HQ`, Strategist checks:
1. Search the App Store for our top 5 primary keywords — what position do we rank?
2. Look at top 3 competitors' titles, subtitles, and descriptions — what keywords are they using that we are not?
3. Check "Users also viewed" and "Users also bought" sections — what adjacent apps are gaining ground?
4. Update keyword targets in the store listing if a better opportunity is found

### Competitor Tracking (Standing List)
Track these categories monthly:
- "Kids learning app" category top 10 — who entered/exited?
- "AI tutor" search results — any new entrants?
- Apps that mention "voice" + "children" + "education" — direct competitors

### Rating Velocity (The Algorithm's Obsession)
The Play Store and App Store both boost apps with a high **recent** rating volume.
- Target: **10+ new ratings per week** once live
- Review prompt timing: fire the prompt exactly after the child completes 3 consecutive correct answers (a genuine "win" moment — not on launch, not mid-session)
- Prompt copy: "Ollie is proud of you! 🦉 Would you like to leave us a review?" — shown to parent only (parent dashboard context)
- **Negative feedback loop:** In the parent dashboard, place "Send Feedback" in a more prominent position than "Leave a Review." Route complaints to you privately before they become public 1-star reviews.

### Geographic SEO (Geo-ASO)
Different markets use different search terms:
- **US:** "AI tutor", "learning app for kids", "educational games K-6"
- **UK:** "primary school learning app", "KS1 KS2 tutor app"
- **Canada/Australia:** same as US with "grade" terminology
- Localized descriptions and screenshots dramatically improve conversion in non-US English markets
- Growth & Marketing Strategist flags the top 2 international markets to localize for, based on current download geography data from Play Console / App Store Connect

---

## §4 — SEO, Generative Engine Optimization (GEO), and Geographic SEO

In 2026, traditional Google SEO, AI-generated search results (ChatGPT, Gemini, Perplexity), and geographic intent are converging. All three must be addressed.

### Traditional SEO
- **Landing page** (forthechild.vercel.app or a dedicated domain): needs a proper title tag, meta description, H1, and structured FAQ section
- Target long-form content: "How AI tutors help kids learn to read at home" — this ranks on Google and gets cited by AI engines
- Schema markup: `MobileApplication` and `EducationalApplication` structured data on the landing page so Google understands the app's nature

### Generative Engine Optimization (GEO)
When a parent asks ChatGPT or Gemini "what is the best AI tutor app for my 7-year-old?", we want KiddoAI to appear.
- GEO is driven by **being cited in authoritative sources** — education blogs, parent review sites, teacher resource sites
- Target publications: Common Sense Media (submit for review), Teachers Pay Teachers blog, mommy blogger outreach, EdTech review sites
- The more these sources mention KiddoAI by name with specific facts (grade levels, voice interaction, COPPA-compliant), the more AI engines include it in generated recommendations
- **GEO check:** Monthly, Growth & Marketing Strategist asks Claude/ChatGPT/Gemini "what are the best AI tutor apps for elementary school kids?" and checks if KiddoAI is mentioned. If not — identify which sources need outreach.

### Geographic SEO
- Optimize Play Store listing for top download regions (check Play Console > Statistics > Countries)
- If a country drives >5% of downloads with a non-English primary language → invest in localized store listing
- Google Maps / Apple Maps are irrelevant here, but local parenting Facebook groups and regional Reddit communities (r/Parenting_UK, r/AusMums) are the geographic SEO equivalent

---

## §5 — Paid Acquisition

Only activate when Level 3 retention is proven (D7 retention > 20%).
Spending on acquisition before retention is proven burns money — users churn before generating value.

### Apple Search Ads (ASA)
- **Channel:** App Store search results only — highest intent traffic available
- **Targeting:** Parents searching for education/tutor apps. Keywords: "kids tutor", "reading app grade 2", "learning app for children"
- **Child safety:** ASA does not require device-level tracking. It uses first-party App Store data. COPPA-compliant by default.
- **Starting budget:** $5/day to find a baseline CPA (cost per acquisition). Scale only if CPA < $3.
- **Creative:** Apple Search Ads uses your App Store screenshots — ASO quality directly impacts paid performance

### Google App Campaigns (UAC)
- **Channel:** Google Play, YouTube, Google Search, Google Display Network
- **Targeting:** Parents of school-age children. Do NOT use interest targeting that could reach children directly.
- **Child safety:** Set campaign to "Families" policy compliance. Enable "Child-directed treatment" in all ad content settings.
- **Creative assets:** Provide 5+ landscape images, 5+ portrait images, 5+ short videos (15s max). Google's algorithm tests combinations — more assets = better optimization.
- **Starting budget:** $10/day minimum for UAC to exit the learning phase. Below this, data is too sparse.
- **Conversion tracking:** Track "first AI conversation completed" as the conversion event — not just install, which is a vanity metric.

### Meta (Facebook/Instagram) Ads
- **Targeting:** Parents aged 25–45 with children, interests: education, homeschooling, learning disabilities, parenting
- **Ad formats:** Video ads perform best (UGC-style outperforms polished). Carousel showing app features second.
- **Child safety:** Never target users under 18. Use Meta's "Special Ad Category: None" but manually review audience for child-directedness. Do not use retargeting pixels that could track children across the web.
- **Hook testing:** Create 5 different 3-second video openers. Test simultaneously. The best hook determines 80% of the ad's performance. Kill losers after 3 days / $30 spend.

### TikTok Ads
- **Channel:** Parents on TikTok (not children's content)
- **Targeting:** Parents interest category, education hashtags, parenting content
- **Child safety:** TikTok has strict policies on child-directed content in ads. All creative must pass TikTok's child safety review. Do not run on TikTok For Business if your primary user is under 13 — the audience data cannot be reliably filtered.
- **Format:** TopView or In-Feed video. UGC-style (a parent talking to camera about their child's learning experience) dramatically outperforms branded content.
- **Cost:** Higher CPMs than Google, but creative virality potential is significant. Budget: test with $20/day for 7 days only.

### K-Factor (Viral Coefficient)
K-Factor = (average invites per user) × (conversion rate of those invites)
- K > 1.0 = app grows without paid acquisition
- Target K-Factor: 0.3–0.5 initially (rare for education apps to exceed 1.0 organically)
- **Referral mechanics:** "Share KiddoAI with another parent — you both get 30 days of premium features free." Referral is parent-to-parent only. Never incentivize a child to recruit friends.
- Track K-Factor monthly in PROJECT_LOG.md under HQ Briefing summary.

---

## §6 — Influencer & Community-Led Growth

In a world saturated with AI-generated content, **people trust people**. This is especially true for parents making decisions about their children's education.

### Micro-Influencer Strategy
- **Do not target:** Mega-influencers (1M+ followers). Their audience is diffuse, engagement is performative, and cost-per-genuine-recommendation is enormous.
- **Target:** Micro-influencers (5,000–50,000 followers) who are:
  - Homeschooling parents on Instagram/TikTok/YouTube
  - Elementary school teachers with a content presence
  - "EdTech mom" accounts that review learning apps authentically
  - Speech-language pathologists who recommend apps to parents
- **Outreach approach:** Genuine relationship first. Comment on their content, engage, then offer a free premium access code — no expectation of a post, just "we'd love your feedback."
- **Content requirement:** Any sponsored post must disclose the partnership (#ad, #sponsored). Non-disclosure of sponsorship to a children's audience is an FTC violation.
- **Child safety check:** Review the influencer's content history before outreach. Do not partner with accounts that use child-exploitative content (child's face without context, performative reactions, etc.)

### The Reddit / Quora Effect
Parents go to Reddit (r/Parenting, r/HomeschoolRecovery, r/GiftedEducation, r/DyslexiaResources) to ask real questions about their children's education.
- Growth & Marketing Strategist monitors these communities monthly
- When a relevant question appears ("what app helps my 6-year-old with reading?"), provide a genuine, helpful answer — not a sales pitch
- Mention KiddoAI only when it is genuinely the right answer to the question. If it is not the right answer, do not mention it.
- **Never create fake accounts or posts.** This destroys trust permanently and violates platform rules.
- Value-first posts about AI tutoring trends, without any product mention, build authority that eventually converts organically

### Discord / Slack Communities (Dark Social)
- Homeschooling Discord servers, teacher Slack communities, and parenting Facebook groups are "dark social" — not indexed by search engines, but extremely high-trust
- Strategy: Become a genuine community member first (30 days of participation before any mention of the app)
- Share useful resources (not app links): "here's how AI tutors work for phonics" type content
- Product mention only when directly relevant and authentic

---

## §7 — Product-Led Growth

The best marketing is built into the product itself so that **users market it for you**.

### Shareable "Win" Moments
When a child completes a milestone (10 exercises correct, new badge earned, reading level up), generate a shareable achievement card:
- Design: bright, kid-friendly, shows achievement + Ollie celebrating
- Watermark: small "Made with KiddoAI" in the corner
- Parent-facing: "Share [Child's nickname]'s achievement!" — parent shares to their social, not the child
- **Child safety:** The card must never show the child's real name, photo, or any identifying information. Use the child's chosen avatar/nickname only, or generic "A KiddoAI Learner."
- This is a **zero-cost viral loop** — every share is a product impression to other parents

### Seamless Onboarding (Friction = Drop-Off)
- The child must experience Ollie's voice and a genuine interaction within **60 seconds** of first launch
- COPPA consent gate is required — but it must be fast, clear, and not feel like a wall
- No account creation required before first use. Save progress to localStorage first; offer account creation only after the child has had their first successful session
- Every field removed from the onboarding flow increases conversion by ~10%. Audit onboarding monthly.

### Referral Program Rules (Child-Safe)
- Incentive is for **parents only**: "Invite a parent friend — you both get premium free"
- The referral flow appears in the **parent dashboard** only — never in the child's UI
- No peer pressure mechanics targeting the child ("tell your friends about Ollie!")
- Referral tracking uses a simple unique code — no behavioral tracking or cross-app cookies

---

## §8 — Ratings & Reviews Strategy

The Play Store and App Store algorithms weight **recent rating velocity** and **sentiment** heavily. This is one of the highest-leverage levers available.

### When to Ask
Ask for a review only after a genuine "win":
- Child completes 3 consecutive correct answers ✅
- Child unlocks a new badge 🏆
- Child reaches a streak milestone 🔥
The prompt appears in the **parent dashboard** notification or as a subtle banner — never interrupting the child's session.

### What to Ask
```
"[Child's nickname] is on a 5-answer streak! 🦉
Enjoying KiddoAI? A quick review helps other parents find us."
[Leave a Review]  [Maybe Later]
```
"Maybe Later" must be a real option. "Never" must also be available after 2 "Later" responses.

### The Negative Feedback Loop
- In the parent dashboard: "Contact Support" button must be **more prominent** than "Leave a Review"
- Goal: dissatisfied parents contact you privately first, giving you a chance to fix the issue before it becomes a 1-star public review
- Support response time target: **under 24 hours** for parent complaints
- Every 1-star review must be responded to within 48 hours, professionally, in the Play Console / App Store Connect

### Responding to Reviews
- Positive reviews: thank them briefly, mention a coming feature if relevant
- Negative reviews: acknowledge the issue, state what you're doing about it, invite them to contact support
- Never argue, never be defensive — other parents are reading every response

---

## §9 — Retention vs. Acquisition

**Retention is 5–10x cheaper than acquisition.** Fix retention before spending on acquisition.

### Retention Benchmarks for EdTech Apps
| Metric | Poor | Average | Good | Target |
|--------|------|---------|------|--------|
| D1 (next day) | < 20% | 25–35% | > 40% | **> 40%** |
| D7 (1 week) | < 10% | 12–18% | > 25% | **> 20%** |
| D30 (1 month) | < 5% | 6–10% | > 15% | **> 12%** |

If D1 < 30%, **stop paid acquisition** until the onboarding and first-session experience is improved.

### Retention Levers
- **Push notifications:** Parent-facing only. Maximum 1 per day. Content: child's streak reminder, new badge available, weekly progress summary. Never manipulative ("Ollie misses you!"-style guilt messages).
- **Email loops:** If parent provides an email during account creation, weekly progress digest. Always includes an unsubscribe link prominent in the email. CAN-SPAM and CASL compliant.
- **Habit hooks (child-safe):** Build the habit around a natural moment (after school, before bed) — prompt set by the parent in the dashboard, not algorithmically imposed on the child.

---

## §10 — Mobile Measurement Partners (MMPs)

MMPs (Adjust, AppsFlyer, Branch) provide attribution data — which ad campaign drove which install and subsequent action.

### When to Use an MMP
- Only needed when running paid acquisition at scale (>$50/day across channels)
- Before that point, Play Console + App Store Connect built-in analytics are sufficient

### Which MMP to Use
- **Recommended:** Branch.io (generous free tier, COPPA-compliant child-directed mode available)
- **Alternative:** Adjust (excellent but more expensive at scale)
- **Avoid:** Any MMP that requires IDFA/GAID collection without consent for child-directed apps

### COPPA MMP Requirements
Before integrating any MMP SDK:
1. Security Auditor verifies the MMP has a documented child-directed mode
2. SDK must be initialized in child-directed mode from the first line of the integration
3. No behavioral retargeting, no cross-app tracking, no fingerprinting
4. MMP integration is documented in PROJECT_LOG.md with Security Auditor sign-off

---

## §11 — Building Public Trust

For a children's app, **trust is the product**. Parents are the customer. Every piece of public-facing content is a trust signal.

### Trust Signals Checklist
```
[ ] COPPA compliance badge displayed on landing page and app store listing
[ ] Privacy policy written in plain English (no legalese) — readable by a non-lawyer parent
[ ] "No ads, ever" stated explicitly in store description (and honored in the product)
[ ] "No data collected from children" stated explicitly — with technical explanation if asked
[ ] Developer responds to all Play Store / App Store reviews
[ ] Common Sense Media rating submitted (parents check this before installing)
[ ] Featured in at least one credible EdTech or parenting publication
[ ] App has been reviewed by a teacher or child development professional (quote their endorsement)
```

### Child Safety as a Differentiator
Most EdTech competitors are vague about their data practices. KiddoAI's COPPA compliance and zero-data-collection approach is a **marketing advantage**, not just a legal requirement.
- Lead with it: "The AI tutor that never collects data on your child."
- Explain it simply: "Everything stays on your phone. We never see what your child says."
- This message resonates most strongly with privacy-aware parents and teachers recommending apps to students.

### Common Sense Media Submission
Common Sense Media is the most-trusted source for parents evaluating apps for children.
- Submit KiddoAI for review at: https://www.commonsense.org/education/app-reviews
- A positive rating dramatically increases organic discovery among the target audience
- Prepare: privacy policy URL, data practices documentation, age appropriateness evidence

---

## §12 — Creative Testing (AI-Driven)

The digital ad landscape moves faster than any one person can track. Systematic creative testing is required.

### Hook Testing Protocol
For every video ad created:
1. Write 5 different first-3-second "hooks" (the opening frame that determines whether the viewer continues)
2. Launch all 5 simultaneously with equal budget ($10/day each)
3. After 3 days: kill the bottom 3 performers by click-through rate
4. After 7 days: scale the winner by 2x. Write 5 new hooks against the winner.

### Hook Archetypes That Work for Parent-Targeted EdTech
- **The Problem:** "My 7-year-old hated reading. This changed everything." (relatable struggle)
- **The Demo:** Show the child's face lighting up when Ollie speaks (genuine reaction, parent consent required)
- **The Proof:** "3 grade levels of reading improvement in 4 months" (specific, credible claim — only use if verifiable)
- **The Contrast:** Split screen: frustrated child with homework / same child happily talking to Ollie
- **The Question:** "What if your kid actually wanted to do their homework?"

### UGC-Style Creative
Ads that look like organic content (a parent talking to camera, a screen recording) consistently outperform polished branded production.
- Record: a parent genuinely narrating their child's experience with KiddoAI
- No scripts — authentic, slightly imperfect delivery performs better
- Include real in-app footage
- **Child appearance in ads:** Requires explicit written parental consent. Child's face should not be the focal point. Prefer screen recordings of the app over footage of the child.

### Creative Rules for a Children's App
- No countdown timers or urgency language ("Only 3 spots left!")
- No before/after comparisons that shame the child's previous performance
- No celebrity or influencer endorsements that target children's aspirations
- All ad copy reviewed by UX Guardian for age-appropriateness before launch

---

## §13 — Market Trend Tracking

Growth & Marketing Strategist monitors these sources monthly and delivers findings at `Team Child HQ`:

### Sources to Track
| Source | What to look for | Frequency |
|--------|-----------------|-----------|
| App Store "Education" Top Charts | New entrants, category rank changes | Weekly |
| Google Trends | "AI tutor", "kids learning app", "educational app" search volume | Monthly |
| Common Sense Media new reviews | Competitor apps getting featured | Monthly |
| r/Parenting, r/Homeschool | Parent pain points, app requests | Weekly |
| EdSurge, TechCrunch Education | EdTech funding, new competitor launches | Monthly |
| TikTok #KidsLearning, #HomeschoolMom | Trending content formats in our space | Weekly |
| Play Console / App Store Connect | Category ranking, keyword rank changes | Weekly |

### Trend Response Protocol
When a trend is identified:
1. Strategist presents the trend at next `Team Child HQ` with evidence (links, data)
2. Team assesses: is this a signal (act on it) or noise (monitor it)?
3. If signal: add to the sprint action list with an owner and deadline
4. If noise: note it in PROJECT_LOG.md and re-check in 30 days

---

## §14 — Knowledge Version Stamp

Growth & Marketing Strategist tracks these domains and must re-verify every 30 days:

| Domain | Current Version / State | Last Confirmed |
|--------|------------------------|----------------|
| Apple Search Ads | ASA Advanced · CPP (Custom Product Pages) available | 2026-04-09 |
| Google UAC | Google App Campaigns · Demand Gen campaigns · Privacy Sandbox in transition | 2026-04-09 |
| Meta Ads | Advantage+ Shopping Campaigns · Broad targeting performing best | 2026-04-09 |
| TikTok Ads | Smart+ Campaigns · Series creative format · child-directed policy v3 | 2026-04-09 |
| ASO Tools | AppFollow free tier · AppTweak free tier · Play Console built-in | 2026-04-09 |
| MMP Landscape | Branch.io free tier · Adjust · AppsFlyer · SKAdNetwork 4.0 | 2026-04-09 |
| SEO / GEO | Google SGE active · Perplexity shopping · ChatGPT app recommendations | 2026-04-09 |
| COPPA Marketing | FTC 2025 amendments · CARU guidelines · Google Families policy | 2026-04-09 |
| EdTech Market | Global EdTech market growing 14% YoY · AI tutors fastest-growing segment | 2026-04-09 |
