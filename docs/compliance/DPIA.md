# Ollie — Data Protection Impact Assessment (DPIA)

**Status:** Draft · **Date:** 2026-07-03 · **Basis:** GDPR Art. 35 + UK Children's Code (mandatory for high-risk processing of children's data). Also serves the state design-code risk-assessment requirement.

> Draft prepared by the developer; requires review by counsel/DPO. Cross-reference [`COMPLIANCE_REGISTER.md`](./COMPLIANCE_REGISTER.md).

## 1. Description of processing
- **What:** An AI tutor for K–6 children. Child types/speaks questions; Google Gemini generates educational replies (text + spoken audio).
- **Personal data:** grade band (K–6), on-device progress, the *content* of the child's questions, **live voice audio (voiceprint)**, connection data (IP), error diagnostics, and (planned) a parent email for consent.
- **Data subjects:** children under 13 (primary) and their parents/guardians.
- **Recipients/processors:** Google (Gemini/Live/TTS), Vercel (hosting/logs), Sentry (diagnostics), email provider + consent store (planned). US-based → international transfer.
- **Retention:** device data until deleted by user; server = metadata only, short-lived; provider retention not controlled by us.

## 2. Necessity & proportionality
- **Lawful basis:** consent (parental) + legitimate interest in providing the service. Data minimization: no accounts, no names, device-only progress, no ads/analytics.
- **Necessity:** text→AI and audio→AI are necessary to deliver the tutoring and live-voice features respectively. IP transmission is inherent to internet delivery.
- **Alternatives considered:** on-device-only speech recognition (would remove audio transmission) was considered; product decision is to **keep** cloud live-voice with added safeguards. This raises residual risk (see §3.1) and is documented as an accepted, mitigated risk.

## 3. Risks to children & mitigations
| # | Risk | Likelihood/Impact | Mitigation | Residual |
|---|---|---|---|---|
| 3.1 | Child voiceprint (biometric) transmitted to Google | Med / High | Consent-gated; disclosed; explore ephemeral handling; ⚖️ counsel on retention | Medium ⚖️ |
| 3.2 | Inappropriate content shown/spoken to child | Med / High | App-level input+output safety filtering on all AI paths; safe redirects; Gemini safety settings on every path (issue #2) | Low |
| 3.3 | API key exposed to browser → abuse | High / Med | Ephemeral token / server-side WS proxy; lock CORS (Phase 3) | Low |
| 3.4 | Inaccurate privacy claims → deception | Was High | Policy rewritten to be accurate; DRAFT pending counsel | Low |
| 3.5 | Weak parental gate (default PIN shown; self-attest) | Med / Med | Remove default PIN; email-verification consent (Phase 4/5) | Low–Med ⚖️ |
| 3.6 | No/incomplete deletion | Med / Med | True "delete all data" + revoke consent (Phase 5) | Low |
| 3.7 | IP leak to Google Fonts CDN | Low / Med | Self-host fonts (Phase 5) | Low |
| 3.8 | Child cannot operate app w/ assistive tech | Med / Med | WCAG 2.2 AA fixes (Phase 6) | Low |
| 3.9 | Child unaware it's an AI | Med / Low | In-app AI disclosure (Phase 6) | Low |

## 4. Data-flow summary
`Child device → (a) HTTPS text → Vercel proxy → Google Gemini (text) → reply; (b) WebSocket audio → Google Gemini Live → audio/text reply; (c) TTS text → Vercel proxy → Google TTS → audio; (d) errors → /api/errors → Vercel logs + Sentry.` Progress never leaves the device. See `docs/diagrams/ollie-safety-pipeline.*` and `ollie-ai-request-flow.*`; a compliance data-flow diagram should be added here.

## 5. Conclusion
With Phases 2–6 implemented, residual risk is **Low** except items flagged ⚖️ (voice/biometric consent classification, VPC sufficiency), which require legal determination before public/store release. This DPIA should be revisited when payments are added.
