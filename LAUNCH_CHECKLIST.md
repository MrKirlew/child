# Ollie — What's Left To Do (Launch Checklist)

_Last updated: 2026-07-06. This is your running "what's left" list. Check items off as you go. Items are grouped by priority: **🔴 Before taking real customers** → **⚖️ Legal** → **🧹 Housekeeping** → **🟢 Optional / growth**._

---

## ✅ What's already done (context)

So you know what's *not* on this list:

- **App** — full K-6 tutor (Learn / Exercises / Spell / Progress), Ollie octopus + Candy Pop design, live on web + Android.
- **Child-safety** — content filtering on all 3 AI paths, safe-redirect on blocks.
- **Privacy/compliance foundation** — accurate privacy policy, Terms, COPPA direct notice, DPIA, compliance register (all in `docs/compliance/`).
- **Parent accounts** — passwordless email login / logout, account section in the parent dashboard.
- **Billing** — Stripe subscriptions ($9.99/mo · $79.99/yr), paywall (free = Exercises + Spell + 10 Learn/day; Premium = unlimited), webhook-driven unlock. **Verified working end-to-end (no charges).**
- **Security** — live-voice API key no longer exposed; sessions are revocable; secrets gitignored.
- **Deploys** — production runs from `main` at `www.ollietutor.com`; billing/auth are permanent.

---

## 🔴 Before you can take real paying customers

### 1. Confirm the webhook secret matches (5 min)
My automated tests signed events with the `STRIPE_WEBHOOK_SECRET` stored in Vercel and passed. But **real** Stripe payments are signed with the secret shown on your **dashboard** webhook — these must be the same value, or a real payment will succeed but Premium won't unlock.

- [ ] Stripe (live mode, account `MrKirlew`) → **Developers → Webhooks → "sophisticated-dream"** → copy the **Signing secret** (`whsec_…`).
- [ ] Vercel → project `ollie` → **Environment Variables** → open `STRIPE_WEBHOOK_SECRET` → confirm it's the **same** value (Production + Preview).
- [ ] If you changed it, redeploy (or tell me and I'll redeploy).

> The real-charge test below (step 2) also proves this — if the subscription unlocks Premium, the secret matches.

### 2. The one real-money test (the walkthrough you asked for) — ~10 min
This is the only way to exercise the true **card → Stripe → webhook → unlock** path in live mode. You'll pay, confirm it works, then refund yourself.

1. **Open the web app** in a browser (not the Android app): **https://www.ollietutor.com**
2. **Sign in as a parent** — enter your email → get the 6-digit code → verify. (Use a real inbox you control.)
3. **Trigger the paywall** — either open the parent dashboard (👨‍👩‍👧 icon → your PIN) and tap **"Upgrade to Premium"**, OR use the free Learn tutor until you hit the daily cap.
4. **Choose a plan** — pick **Monthly ($9.99)** for the cheapest test (or Annual). You'll land on Stripe Checkout.
5. **Pay with your real card.** (This is a genuine charge — you'll refund it in step 8.)
6. **You're redirected back** to `ollietutor.com/?upgraded=1`. The app calls the server and Premium should unlock.
7. **Confirm Premium works** — open the parent dashboard; the button should now read **"Premium — manage subscription."** The Learn daily cap should be gone (unlimited). ✅ = the whole chain works.
8. **Refund + cancel** — Stripe dashboard → **Payments** → find the charge → **Refund**. Then **Customers** (or **Subscriptions**) → find your subscription → **Cancel**. (Cancelling triggers the `customer.subscription.deleted` webhook, so Premium will switch back off — a nice bonus test.)

- [ ] Completed the real-charge test and Premium unlocked
- [ ] Refunded the charge + cancelled the subscription

> ⚠️ **Android note:** don't test the purchase *inside* the Android app — it intentionally sends users to the website to subscribe (this keeps you compliant with Google Play's billing rules). Test on web; the Android app unlocks automatically once the account is Premium.

### 3. Delete leftover test data (2 min)
My verification runs created a few empty test customers in Stripe.
- [ ] Stripe → **Customers** → delete any with these emails: `relwik+billingverify`, `relwik+billingverify2`, `relwik+billingverify3`, `relwik+finalcheck`, `relwik+authtest` (all `@gmail.com`).

---

## ⚖️ Legal — before public launch / marketing

You have no lawyer yet; this posture is **defensible but not certified**. See `docs/compliance/LEGAL_HANDOFF.md` for the full brief and the 8 questions for counsel.

- [ ] **Fill in your legal entity name + postal address** everywhere marked `[TBD]`: `www/privacy.html`, `www/terms.html`, `docs/compliance/coppa-direct-notice.md`. (Tell me the values and I'll fill them in.)
- [ ] **Fill the refund policy** `[TBD]` in `www/terms.html` (section 6).
- [ ] **Engage a children's-privacy attorney** (COPPA + GDPR-K experience). Give them `docs/compliance/LEGAL_HANDOFF.md`.
- [ ] **Consider a COPPA Safe Harbor** program (kidSAFE, PRIVO, or ESRB) — vetted framework, lowers enforcement risk.
- [ ] Counsel to confirm: email-plus consent sufficiency, **auto-renewal law** (e.g. California ARL), **PCI scope** (SAQ-A via Stripe Checkout), voice/biometric consent, GDPR transfer mechanism.

---

## 🧹 Housekeeping

- [ ] **Delete `stripe_backup_code.txt`** from your computer (it's a real Stripe recovery code sitting in the project folder). It's gitignored so it won't be committed/uploaded — but it's still a plaintext secret on disk. Move it to a password manager.
- [ ] **Confirm `SENTRY_DSN` is set** in Vercel if you want error tracking live (optional but recommended for a 99% uptime goal).
- [ ] (Optional) **Point the app at `ollietutor.com`** — the app currently calls `forthechild.vercel.app` (works fine, both are your project). Cleaner to move `window.AI_PROXY` to `https://www.ollietutor.com/api`. Tell me and I'll change it.

---

## 🟢 Optional / growth (not blockers)

**From the pricing research (market-validated):**
- [ ] **Add a 7-day free trial, opt-in, no card required** — education trials convert 25-40% and parents want to watch their kid use it before paying. (I can build this.)
- [ ] **A/B test $12.99/mo** once you have retention data + testimonials proving the "holds my ADHD kid's attention" claim.
- [ ] **"Access" program** — $0.99/mo for families on government assistance (copies Ello; great goodwill for a mission-driven ADHD product).

**Product / platform:**
- [ ] **iOS app** — not yet scaffolded (Android + web only today). iOS is the higher-willingness-to-pay surface.
- [ ] **On-device Upgrade-screen check** — re-approve USB debugging on your phone and I'll verify the Upgrade overlay renders correctly on Android.
- [ ] **Marketing** — the `marketing-strategy` skill can produce a full SEO/GEO + paid-acquisition + audience brief when you're ready to grow.

---

## How to use this doc

- Work top-down: the 🔴 section is the only thing between you and accepting real subscriptions.
- Anything marked "tell me and I'll…" — just ask and I'll do it.
- When an item's done, check the box (or tell me and I'll update it).
