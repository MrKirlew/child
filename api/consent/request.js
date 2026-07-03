const crypto = require('crypto');
const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { setEx, incrEx } = require('../_store');
const { sendEmail } = require('../_email');

// Step 1 of email-plus parental consent: email a 6-digit verification code.
const CODE_TTL = 600;   // code valid 10 minutes
const RL_TTL = 3600;    // rate-limit window: 1 hour
const RL_MAX = 5;       // max code requests per email per window

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
}
function validEmail(e) {
  return typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function genCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const email = req.body && req.body.email;
  if (!validEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const he = hashEmail(email);
  try {
    const count = await incrEx('consent_rl:' + he, RL_TTL);
    if (count > RL_MAX) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });

    const code = genCode();
    await setEx('consent_code:' + he, code, CODE_TTL);
    await sendEmail({
      to: email,
      subject: 'Your Ollie parent verification code',
      text: `Your Ollie verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<div style="font-family:sans-serif"><p>Your Ollie parent verification code is:</p><p style="font-size:26px;font-weight:800;letter-spacing:3px">${code}</p><p>It expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p></div>`,
    });
    // No email/code logged (PII).
    return res.json({ ok: true });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'consent.request_failed', err: String((e && e.message) || e) }));
    const notConfigured = /email not configured|consent store not configured/.test(String(e && e.message));
    return res.status(502).json({ error: notConfigured ? 'Verification is not set up yet. Please contact support.' : 'Could not send the code. Please try again.' });
  }
};

module.exports = withSentry(handler);
