const { withSentry } = require('../_observability');
const { setEx, redisCmd } = require('../_store');
const Stripe = require('stripe');

// Stripe webhook — the ONLY place premium entitlement is granted. Server-to-server
// (no CORS/origin gating; authenticated by the Stripe signature over the RAW body).
// Idempotent (Stripe may redeliver). Writes sub:<emailHash> = {status, priceId, ...}.
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SUB_TTL = 60 * 60 * 24 * 400;      // ~13 months
const CUSTOMER_TTL = 60 * 60 * 24 * 365 * 3;
const EVENT_TTL = 60 * 60 * 24;          // idempotency window

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

function periodEnd(sub) {
  return sub.current_period_end || (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end) || null;
}
function priceOf(sub) {
  return (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price && sub.items.data[0].price.id) || null;
}
async function writeSub(he, data) {
  await setEx('sub:' + he, JSON.stringify(data), SUB_TTL);
}

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).json({ error: 'Billing not configured' });

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'stripe.webhook_bad_signature', err: String((e && e.message) || e) }));
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Idempotency — SET NX; null result means we've already processed this event.
  try {
    const first = await redisCmd(['SET', 'stripe_event:' + event.id, '1', 'NX', 'EX', String(EVENT_TTL)]);
    if (first === null) return res.json({ received: true, duplicate: true });
  } catch (_e) { /* store hiccup — fall through and process (Stripe will retry if we 500) */ }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const he = s.metadata && s.metadata.emailHash;
      if (he && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription);
        if (s.customer) await setEx('stripe_customer:' + he, s.customer, CUSTOMER_TTL);
        await writeSub(he, { status: sub.status, priceId: priceOf(sub), currentPeriodEnd: periodEnd(sub), customerId: s.customer });
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const he = sub.metadata && sub.metadata.emailHash;
      if (he) {
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;
        await writeSub(he, { status, priceId: priceOf(sub), currentPeriodEnd: periodEnd(sub), customerId: sub.customer });
      }
    }
    return res.json({ received: true });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'stripe.webhook_process_failed', type: event && event.type, err: String((e && e.message) || e) }));
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = withSentry(handler);
// Vercel: keep the RAW request body (Stripe signature verification needs exact bytes).
module.exports.config = { api: { bodyParser: false } };
