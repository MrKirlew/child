const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { getSession, readSub } = require('../_auth');

// Validate a session token and return the account's current state (email +
// subscription). Called on app load to restore login + entitlement.
const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const token = req.body && req.body.sessionToken;
  try {
    const sess = await getSession(token);
    if (!sess) return res.status(401).json({ authenticated: false });
    const subscription = await readSub(sess.he);
    return res.json({ authenticated: true, email: sess.email, subscription });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'auth.session_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not check your session.' });
  }
};

module.exports = withSentry(handler);
