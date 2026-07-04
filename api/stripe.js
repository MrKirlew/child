const { withSentry } = require('./_observability');
const { applyCors } = require('./_cors');
const { get, setEx } = require('./_store');
const { getSession } = require('./_auth');
const Stripe = require('stripe');

// Subscription checkout + billing portal. Web-checkout / app-unlocks model:
// the parent subscribes on the website; the app (web + Android) unlocks premium
// from the entitlement written by the webhook. Action-routed (checkout|portal)
// to fit the Vercel Hobby 12-function cap.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SITE = process.env.APP_URL || 'https://www.ollietutor.com';
const CUSTOMER_TTL = 60 * 60 * 24 * 365 * 3;

async function getOrCreateCustomer(he, email) {
  const existing = await get('stripe_customer:' + he);
  if (existing) return existing;
  const cust = await stripe.customers.create({ email: email || undefined, metadata: { emailHash: he } });
  await setEx('stripe_customer:' + he, cust.id, CUSTOMER_TTL);
  return cust.id;
}

async function doCheckout(res, sess) {
  const customer = await getOrCreateCustomer(sess.he, sess.email);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    customer,
    // emailHash on BOTH so every webhook event can find the account.
    metadata: { emailHash: sess.he },
    subscription_data: { metadata: { emailHash: sess.he } },
    success_url: SITE + '/?upgraded=1',
    cancel_url: SITE + '/?canceled=1',
    allow_promotion_codes: true,
  });
  return res.json({ url: session.url });
}

async function doPortal(res, sess) {
  const customerId = await get('stripe_customer:' + sess.he);
  if (!customerId) return res.status(400).json({ error: 'No subscription found for this account.' });
  const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: SITE + '/' });
  return res.json({ url: portal.url });
}

const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Origin not allowed' });
  if (!stripe || !process.env.STRIPE_PRICE_ID) return res.status(500).json({ error: 'Billing is not set up yet.' });

  const sess = await getSession(req.body && req.body.sessionToken);
  if (!sess) return res.status(401).json({ error: 'Please sign in first.' });

  try {
    const action = req.body && req.body.action;
    if (action === 'checkout') return await doCheckout(res, sess);
    if (action === 'portal') return await doPortal(res, sess);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'stripe.action_failed', action: req.body && req.body.action, err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not open billing. Please try again.' });
  }
};

module.exports = withSentry(handler);
