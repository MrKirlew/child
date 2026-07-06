const crypto = require('crypto');
const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { get, del, setEx } = require('../_store');
const { hashEmail, readSub, SESSION_TTL } = require('../_auth');

// Passwordless parent sign-in, step 2: verify the code, ensure the account,
// record consent (login implies consent — same verified email), mint a session.
const POLICY_VERSION = '2.0';
const CONSENT_TTL = 60 * 60 * 24 * 365;       // 1 year
const ACCOUNT_TTL = 60 * 60 * 24 * 365 * 2;   // 2 years, refreshed on each login

const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const email = req.body && req.body.email;
  const code = req.body && req.body.code;
  if (!email || !/^\d{6}$/.test(String(code || ''))) return res.status(400).json({ error: 'Enter the 6-digit code we emailed you.' });

  const he = hashEmail(email);
  const normEmail = String(email).trim().toLowerCase();
  try {
    const stored = await get('login_code:' + he);
    if (!stored || String(stored) !== String(code)) {
      return res.status(400).json({ ok: false, error: 'That code is incorrect or has expired. Please try again.' });
    }
    await del('login_code:' + he); // single-use

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
    // Parent account record keeps the email (needed for Stripe + display; disclosed).
    await setEx('account:' + he, JSON.stringify({ email: normEmail, ts: new Date().toISOString() }), ACCOUNT_TTL);
    await setEx('consent:' + he, JSON.stringify({ ts: new Date().toISOString(), ip, policyVersion: POLICY_VERSION }), CONSENT_TTL);

    const sessionToken = crypto.randomBytes(32).toString('hex');
    await setEx('session:' + sessionToken, he, SESSION_TTL);

    const subscription = await readSub(he);
    return res.json({ ok: true, sessionToken, email: normEmail, consentPolicy: POLICY_VERSION, subscription });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'auth.verify_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not sign you in right now. Please try again.' });
  }
};

module.exports = withSentry(handler);
