# Ollie — COPPA Direct Notice to Parents

**Purpose:** Content for the direct notice COPPA requires operators to give parents (16 CFR §312.4). Render this in the consent flow and/or email it to the parent at the email-verification step. Keep wording in sync with `www/privacy.html`. **[TBD]** = complete before release.

---

## Notice

**About Ollie.** Ollie is an educational AI tutor for children in grades K–6, operated by **[TBD — legal entity]**. There is no account or login. This notice explains what personal information the App handles so you can decide whether to give consent.

**What we collect from your child and why.**
- **The words your child types or speaks to Ollie**, and — if the live-voice microphone is used — **your child's voice audio**. This is sent to **Google (Gemini AI)** so Ollie can answer educational questions. Voice audio may be treated as a biometric identifier.
- **Technical connection data** (such as an IP address), which is an unavoidable part of connecting to the internet, is received by our providers (Google, Vercel, Sentry).
- We do **not** collect your child's name, email, birthdate, phone, address, photo, or location. Learning progress is stored **only on your device**.

**Who receives the information.** Google (AI responses and speech), Vercel (hosting), and Sentry (error diagnostics, minimized). We do **not** sell or share it for advertising and use no ad or tracking services.

**Your choices as a parent.** You can:
- **Consent** to allow your child to use the data-transmitting features (you are providing this consent now);
- **Review** the data stored on the device (parent dashboard, PIN-protected);
- **Delete** all of your child's data ("Delete all data" in the dashboard, or uninstall);
- **Revoke** consent at any time, which stops further transmission and deletes your consent record.

**We won't require more than needed.** You do not have to provide more information than is reasonably necessary for your child to use the App.

**Contact.** privacy@ollietutor.com · **[TBD — postal address]**.

By confirming the code we sent to your email, you consent to the data practices described here and in our [Privacy Policy].

---

*Implementation note:* this notice must be presented **before** collection and is stored/versioned with the consent record `{hashed_email, timestamp, policy_version}` (Phase 4).
