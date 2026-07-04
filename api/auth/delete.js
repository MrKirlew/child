const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');
const { del } = require('../_store');
const { getSession } = require('../_auth');

// Full account erasure for a signed-in parent (GDPR/COPPA "delete all data").
// Removes the account, consent, and subscription records + the session.
// NOTE: an active Stripe subscription should be canceled via the billing portal
// (or a future Stripe-cancel call here) so the parent isn't billed after deletion.
const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });

  const token = req.body && req.body.sessionToken;
  try {
    const sess = await getSession(token);
    if (sess) {
      await del('account:' + sess.he);
      await del('consent:' + sess.he);
      await del('sub:' + sess.he);
      await del('stripe_customer:' + sess.he);
    }
    if (token) await del('session:' + token);
    return res.json({ deleted: true });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'auth.delete_failed', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not delete your data.' });
  }
};

module.exports = withSentry(handler);
