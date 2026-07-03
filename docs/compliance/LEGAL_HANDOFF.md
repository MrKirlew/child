# Ollie — Legal Handoff & Open Questions for Counsel

**Purpose:** Ollie is a K–6 (under-13) AI tutor, direct-to-parent, global, eventually paid. This document gives an attorney the context to review the app's compliance posture efficiently. It lists (a) what has been done in engineering, (b) the specific legal questions that need a professional determination, and (c) recommended next steps.

> This is prepared by the developer, not a lawyer. Nothing here is legal advice. Read alongside [`COMPLIANCE_REGISTER.md`](./COMPLIANCE_REGISTER.md) and [`DPIA.md`](./DPIA.md).

## 1. One-paragraph product description
Ollie is a Progressive Web App wrapped for Android/iOS (Capacitor). A child talks or types to "Ollie the Octopus," an AI tutor powered by Google Gemini, about STEAM topics. There is **no account and no login**. Learning progress is stored **only on the device**. The child's typed text and (on the live-voice feature) **raw microphone audio** are sent to Google to generate responses. There are no ads, analytics, or tracking SDKs. Error diagnostics go to Sentry (PII-minimized). A future release will add paid subscriptions.

## 2. What engineering has done / is doing (see epic #3)
- Rewritten the privacy policy to be **accurate** (prior version contained several claims the code contradicted).
- Building app-level **child-safety content filtering** on all AI paths (issue #2).
- Hardening the **live-voice** path so the Google API key is not exposed to the browser; treating voice as biometric data and gating it behind consent.
- Adding **parent email-verification consent** and a minimal consent record.
- Adding **true data deletion**, removing the on-screen default PIN, self-hosting fonts.
- **WCAG 2.2 AA** accessibility fixes and an AI-transparency disclosure.

## 3. Key legal questions — please advise (⚖️)

1. **Verifiable Parental Consent (COPPA §312.5).** Given the app collects no name/email from the child but **transmits the child's voice audio (voiceprint) and IP to Google**, does our planned **email-plus** consent satisfy VPC, or is a higher-assurance method (payment, gov-ID, KBA, facial match) required? Does the **internal-operations exception** apply to any of our processing (e.g., IP for connectivity), reducing consent obligations?
2. **Voice as biometric PI.** Is streaming a child's raw voice to Google acceptable with proper notice/consent, and does Google's processing/retention on the API tier we use create additional obligations (e.g., a Safe Harbor or contractual controls)? Is a state biometric law (e.g., Illinois BIPA) implicated by "voiceprint" handling?
3. **Third-party sharing consent (amended COPPA).** Is sending content/audio to Google "sharing with a third party" requiring **separate** opt-in, or is Google a service provider performing the core service?
4. **International transfers (GDPR/UK-GDPR).** We rely on Google/Vercel/Sentry US processing. Confirm the correct transfer mechanism to disclose (SCCs / EU-US Data Privacy Framework) and whether a formal DPIA/transfer risk assessment is sufficient as drafted.
5. **Lawful basis & age thresholds (GDPR-K Art. 8).** Confirm lawful bases per processing and how to handle the 13–16 member-state consent-age variation for a global launch.
6. **Age assurance.** The entire audience is treated as under-13. Do the state design codes (CA/MD/NE/VT/SC) or UK Children's Code require any age-estimation/neutral-age screen for our risk profile?
7. **Marketing/claims.** Review any "COPPA-compliant"/"private" marketing language before use (FTC deception exposure).
8. **Future payments.** When subscriptions launch: parent billing PII, PCI DSS scope (Stripe as processor), auto-renewal disclosure laws (e.g., California ARL), and tax.

## 4. Recommended next steps
1. Engage counsel experienced in **children's privacy / COPPA + GDPR-K**.
2. Consider enrolling in an **FTC-approved COPPA Safe Harbor** program (e.g., kidSAFE, PRIVO, ESRB) — provides a vetted framework and mitigates enforcement risk.
3. Finalize the **[TBD] legal entity name and postal address** in the privacy policy, ToS, and direct notice.
4. Have counsel review `privacy.html`, `terms.html`, and `coppa-direct-notice.md` before public/store release.
5. Complete a **Google/Vercel/Sentry DPA** review and record the transfer mechanisms.

## 5. Immediate risk items (not legal — do now)
- **Secure `stripe_backup_code.txt`:** a live Stripe account recovery code is sitting in the repo working tree. Delete it from disk and store it in a password manager. (Left untouched by the assistant intentionally.)
- Do not deploy the rewritten policy to production as "final" until §4.3–4.4 are done (it is marked DRAFT for that reason).
