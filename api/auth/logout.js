const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { del } = require('../_store');

// Invalidate a session token (log out). Idempotent. Mirrors consent/revoke.
const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const token = req.body && req.body.sessionToken;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    await del('session:' + token);
    return res.json({ ok: true });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'auth.logout_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not log out.' });
  }
};

module.exports = withSentry(handler);
