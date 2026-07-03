const crypto = require('crypto');
const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { get, del, setEx } = require('../_store');

// Step 2 of email-plus parental consent: verify the code and record consent.
const POLICY_VERSION = '2.0';
const CONSENT_TTL = 60 * 60 * 24 * 365; // keep the consent record ~1 year

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');
}

const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const email = req.body && req.body.email;
  const code = req.body && req.body.code;
  if (!email || !/^\d{6}$/.test(String(code || ''))) return res.status(400).json({ error: 'Enter the 6-digit code we emailed you.' });

  const he = hashEmail(email);
  try {
    const stored = await get('consent_code:' + he);
    if (!stored || String(stored) !== String(code)) {
      return res.status(400).json({ consented: false, error: 'That code is incorrect or has expired. Please try again.' });
    }
    await del('consent_code:' + he);

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
    const record = JSON.stringify({ ts: new Date().toISOString(), ip, policyVersion: POLICY_VERSION });
    await setEx('consent:' + he, record, CONSENT_TTL);

    // Opaque token stored back to the client so it can later revoke this consent
    // record (e.g. from the parent-dashboard "Delete all data" action).
    const token = crypto.randomBytes(24).toString('hex');
    await setEx('consent_token:' + token, he, CONSENT_TTL);

    return res.json({ consented: true, token, policyVersion: POLICY_VERSION });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'consent.verify_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not verify right now. Please try again.' });
  }
};

module.exports = withSentry(handler);
