# Ollie — Compliance Register

**Status:** Draft (engineering-owned) · **Last updated:** 2026-07-03 · **Owner:** Solo developer
**App:** Ollie — AI reading + STEAM tutor, K–6 (under-13). PWA + Capacitor (Android/iOS). Direct-to-parent, global, eventually paid.

> ⚠️ **This is not legal advice and is not a certification of compliance.** It is an engineering-maintained gap analysis intended to (a) make the app's real data practices explicit and (b) drive remediation. Items requiring a lawyer are marked **⚖️ NEEDS-COUNSEL** and collected in [`LEGAL_HANDOFF.md`](./LEGAL_HANDOFF.md). A children's product should have qualified counsel review this and should consider enrolling in an FTC-approved **COPPA Safe Harbor** program.

Legend — Status: ✅ closed · 🟡 in progress · 🔴 open · ⚖️ needs legal determination · ⬜ N/A

---

## 1. Data inventory (what actually happens — from code audit 2026-07-03)

| Data | Collected? | Stored where | Leaves device? | Recipients |
|---|---|---|---|---|
| Name, email (child), DOB, phone, address, photo, geolocation | **No** | — | — | — |
| Grade band (K–6), difficulty, settings | Yes | `localStorage` `kai5` | No | — |
| Exercise scores, streaks, badges, progress | Yes | `localStorage` `kai5` | No | — |
| Child's recent questions (`recentQ`, 12×55 chars) | Yes | `localStorage` `kai5` | No (stored); text content **does** go to AI in-session | Google (in-session) |
| Chat transcript (`chatHist`, ≤24 turns) | Yes | Memory only (not persisted) | Sent to AI | Google Gemini |
| Spell history (last 20 words) | Yes | `localStorage` `kai5_spell` | No | — |
| **Child typed/spoken text (content)** | In-session | Not persisted server-side | **Yes** | Google Gemini (text) |
| **Child raw voice audio** | In-session | Not stored | **Yes — streamed to Google** | Google Gemini Live API |
| Parent PIN | Yes | `localStorage` (SHA-256 hash) | No | — |
| IP address / persistent identifier | Implicit (any HTTP call) | Transient | **Yes** | Google, Vercel, Sentry, Google Fonts CDN |
| Error/diagnostic events | Yes | — | **Yes** | Sentry (US), Vercel logs |
| Parent email (planned, Phase 4) | Planned | Minimal server record (hashed) | Yes | Email provider, consent store |

**Third-party processors:** Google (Gemini text + Live audio + TTS), Sentry (US ingest), Vercel (hosting + logs), Google Fonts CDN (→ self-host, Phase 5). Firebase referenced in Gradle but **inactive** (no `google-services.json`). No analytics/ads/tracking SDKs.

**Key legal characterizations:**
- Voice audio = **biometric identifier / voiceprint** → "personal information" under amended COPPA and likely special-category under GDPR.
- IP address = **persistent identifier** under COPPA and **personal data** under GDPR/UK-GDPR.
- Therefore the app **does** collect/transmit "personal information," even though it collects no name/email from the child. The "we collect nothing" framing is inaccurate and must be corrected.

---

## 2. COPPA (US federal — amended Rule, in full effect since 2026-04-22)

| # | Requirement | Status | Gap / Remediation | Ref |
|---|---|---|---|---|
| C1 | Direct notice + online privacy notice, accurate | 🔴→🟡 | Rewrite `privacy.html` to match reality; add `coppa-direct-notice.md` | Phase 1 |
| C2 | Verifiable parental consent **before** collecting PI from <13 | 🔴 → 🟡 | Add parent email-verification (email-plus); **⚖️** whether email-plus suffices given voice/biometric collection, or whether heavier VPC is required | Phase 4 / ⚖️ |
| C3 | Notice names **each** third party + purpose | 🔴→🟡 | Name Google/Sentry/Vercel + purposes in policy & notice | Phase 1 |
| C4 | Separate opt-in consent to **share** with third parties | 🔴 | Disclose audio→Google as processing necessary to the service; separate consent toggle for anything beyond internal operations; **⚖️** classification | ⚖️ |
| C5 | Biometric (voiceprint) treated as PI | 🔴 | Disclose voice→Google; gate live mic behind consent; **⚖️** retention at Google | Phase 3/4 |
| C6 | Data retention limits + secure deletion | 🔴→🟡 | Add true "delete all data"; document retention; **⚖️** Google/Sentry retention we don't control | Phase 5 |
| C7 | Parental right to review/delete/revoke | 🟡 | Dashboard review exists; add real delete-all + revoke-consent | Phase 5 |
| C8 | Keep consent records | 🔴 | Consent-record store `{hashed_email, ts, ip, policy_version}` | Phase 4 |
| C9 | Reasonable security | 🟡 | **Fix API-key exposure** to browser (Live token) | Phase 3 |
| C10 | No conditioning participation on more data than needed | ✅ | Data-minimized; device-only progress | — |

## 3. State Age-Appropriate Design Codes (CA, MD, NE, VT, SC) + CCPA/CPRA

| # | Requirement | Status | Gap / Remediation |
|---|---|---|---|
| S1 | Best-interests-of-child, privacy by default | 🟡 | Strong defaults; document in DPIA |
| S2 | Data minimization | ✅/🟡 | Already minimal; self-host fonts to stop IP leak |
| S3 | No dark patterns / no nudging | 🔴 | Remove "Default PIN 1234" on-screen prompt; neutral consent UI |
| S4 | DPIA / risk assessment | 🔴→🟡 | `DPIA.md` (also GDPR/UK) |
| S5 | CCPA/CPRA notice + "do not sell/share" (we don't sell) | 🔴→🟡 | Add CCPA section; state we never sell/share for ads |
| S6 | Age assurance appropriate to risk | ⚖️ | Whole audience treated as <13; **⚖️** whether an age-neutral screen is advisable |

## 4. EU GDPR-K + UK Children's Code (UK-GDPR / DUAA 2025)

| # | Requirement | Status | Gap / Remediation |
|---|---|---|---|
| G1 | Identify data controller + contact/DPO | 🔴→🟡 | Add legal entity, address, contact in policy |
| G2 | Lawful basis (consent/legitimate interest) for each processing | 🔴 | Document per-processing basis; **⚖️** |
| G3 | Parental consent under 13–16 (member-state age) | 🟡 | Email-plus consent (Phase 4); **⚖️** age thresholds per state |
| G4 | Data minimization + privacy by default (Children's Code 15 standards) | 🟡 | Mostly met; self-host fonts; document |
| G5 | International transfer mechanism (US processors) | 🔴 | Disclose transfers to US (Google/Vercel/Sentry); **⚖️** SCCs/DPF reliance |
| G6 | DSAR / erasure / portability process | 🔴→🟡 | Document request path; delete-all covers erasure locally |
| G7 | DPIA (mandatory — high-risk children's processing) | 🔴→🟡 | `DPIA.md` |
| G8 | Transparency to children (age-appropriate) | 🔴 | Add kid-facing "Ollie is an AI" + simple privacy explainer |

## 5. EU AI Act (transparency) + ADA/WCAG 2.2 AA

| # | Requirement | Status | Gap / Remediation |
|---|---|---|---|
| A1 | Disclose users are interacting with AI | 🔴→🟡 | In-app "Ollie is an AI" disclosure (Phase 6) |
| A2 | WCAG 2.2 AA — keyboard operable (2.1.1) | 🔴 | Convert `<div onclick>` controls → buttons/keyboard (Phase 6) |
| A3 | WCAG — name/role/value (4.1.2) | 🔴 | Roles on custom controls; dialog role on consent overlay |
| A4 | WCAG — skip link, focus, contrast, reduced motion | 🟡 | Reduced-motion ✅; add skip link + sr-only; contrast audit |

## 6. Other jurisdictions (global reach) — principle-level only

| Regime | Status | Note |
|---|---|---|
| Canada PIPEDA | ⚖️ | Consent + minimization align; local specifics need counsel |
| Brazil LGPD (children — best interest) | ⚖️ | Parental consent + minimization align; ANPD specifics need counsel |
| Australia Privacy Act (Children's Online Privacy Code, in development) | ⚖️ | Monitor; principle alignment |

## 7. Security & hygiene

| # | Item | Status | Action |
|---|---|---|---|
| H1 | Google API key exposed to browser (Live token) | 🔴 | Ephemeral token / WS proxy (Phase 3) |
| H2 | CORS `*` on API | 🔴 | Restrict to app origin |
| H3 | `stripe_backup_code.txt` (real Stripe recovery code) at repo root | 🔴 | **User action:** delete from disk, move to password manager |
| H4 | `server/.env` live key on disk | 🟡 | Gitignored ✅; confirm not shipped |
| H5 | No child content in logs/Sentry | ✅ | `sendDefaultPii:false`; verify `/api/errors` callers |

---

## 8. Progress summary (drives the epic #3)

- ✅ **Phase 1 (docs) — DONE** (`17e15cb`): C1, C3, S5, G1, G5, G6. Register + accurate privacy policy + ToS + DPIA + COPPA notice + legal handoff.
- ✅ **Phase 2 (safety) — DONE** (`18ea1e4`, issue #2): safetySettings on all 3 AI paths, blockReason handling, blocklist + output moderation, 29 tests.
- 🔴 **Phase 3 (voice/security) — OPEN:** C5, C9, H1, H2. Live-voice key exposure + CORS. *Needs deploy-and-test-on-device.*
- 🔴 **Phase 4 (consent) — OPEN (blocked):** C2, C8, G3. *Needs Resend + Upstash accounts/keys from owner.*
- ✅ **Phase 5 (deletion/minimize) — DONE** (`a6feb4c`): C6, C7, S3, H3(self-host fonts + delete-all + default-PIN removal). H3 Stripe file = **owner action**.
- ✅ **Phase 6 (a11y/AI) — DONE** (`ad2ffbb`): A1–A4, G8.
- **⚖️ To counsel:** C2, C4, C5, S6, G2, G5 + all §6. See [`LEGAL_HANDOFF.md`](./LEGAL_HANDOFF.md).

**Owner actions still required:** (1) secure `stripe_backup_code.txt`; (2) provide Resend + Upstash keys for Phase 4; (3) deploy to device to test Phase 3; (4) fill `[TBD]` legal entity/address; (5) engage counsel / Safe Harbor.
