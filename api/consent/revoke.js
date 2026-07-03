const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { get, del } = require('../_store');

// Revoke a recorded consent (called by the parent-dashboard "Delete all data"
// flow when a consent token is present on the device). Deletes the server-side
// consent record + token. Idempotent.
const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const token = req.body && req.body.token;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    const he = await get('consent_token:' + token);
    if (he) {
      await del('consent:' + he);
      await del('consent_token:' + token);
    }
    return res.json({ revoked: true });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'consent.revoke_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not revoke.' });
  }
};

module.exports = withSentry(handler);
