// Shared parent-account auth helpers. Sessions are opaque random tokens stored in
// Upstash (session:<token> -> emailHash) — a store lookup validates them, so they're
// revocable (logout) with no signing needed. Parent identity is the sha256 of the
// email (emailHash); the plaintext email is kept only in the account record (needed
// for Stripe + display), disclosed in the privacy policy.
const crypto = require('crypto');
const { get, setEx } = require('./_store');

const SESSION_TTL = 60 * 60 * 24 * 60; // 60 days, refreshed on use

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email || '').trim().toLowerCase()).digest('hex');
}

// Validate a session token → { he, email } or null. Refreshes the TTL (sliding).
async function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  const he = await get('session:' + token);
  if (!he) return null;
  await setEx('session:' + token, he, SESSION_TTL);
  let email = null;
  const acct = await get('account:' + he);
  if (acct) { try { email = JSON.parse(acct).email || null; } catch (_e) { /* ignore */ } }
  return { he, email };
}

// Read the subscription entitlement for an email hash (webhook-written).
async function readSub(he) {
  const raw = await get('sub:' + he);
  if (!raw) return { status: 'none' };
  try {
    const s = JSON.parse(raw);
    return { status: s.status || 'none', priceId: s.priceId || null, currentPeriodEnd: s.currentPeriodEnd || null };
  } catch (_e) { return { status: 'none' }; }
}

function isActive(sub) { return !!sub && (sub.status === 'active' || sub.status === 'trialing'); }

module.exports = { SESSION_TTL, hashEmail, getSession, readSub, isActive };
