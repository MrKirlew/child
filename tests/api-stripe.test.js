import { describe, it, expect, vi, afterEach } from 'vitest';

// Configure before importing (the `stripe` client is created at module load).
process.env.STRIPE_SECRET_KEY = 'sk_test_' + 'x'.repeat(24);
process.env.STRIPE_PRICE_ID = 'price_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_' + 'x'.repeat(24);
process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
process.env.UPSTASH_REDIS_REST_TOKEN = 't';

const stripeHandler = (await import('../api/stripe.js')).default;
const webhookHandler = (await import('../api/stripe/webhook.js')).default;

function mockRes() {
  const res = {
    statusCode: 200, headers: {}, body: null, ended: false,
    setHeader(k, v) { res.headers[k] = v; return res; },
    status(c) { res.statusCode = c; return res; },
    json(d) { res.body = d; return res; },
    end() { res.ended = true; return res; },
  };
  return res;
}
function req(method, body, origin = 'http://localhost', headers = {}) {
  return { method, body, headers: { origin, ...headers }, url: '/api/stripe' };
}
// Upstash mock — session lookup resolves to an emailHash (or null → no session).
function fetchWithSession(he) {
  global.fetch = vi.fn(async (url, opts) => {
    const args = JSON.parse(opts.body); const cmd = args[0], key = args[1];
    let result = 'OK';
    if (cmd === 'GET') {
      if (key.startsWith('session:')) result = he;
      else if (key.startsWith('account:')) result = he ? JSON.stringify({ email: 'parent@example.com' }) : null;
      else result = null;
    }
    return { ok: true, json: async () => ({ result }) };
  });
}

describe('POST /api/stripe — checkout/portal guards', () => {
  afterEach(() => vi.restoreAllMocks());

  it('handles OPTIONS preflight (200)', async () => {
    fetchWithSession(null); const res = mockRes();
    await stripeHandler(req('OPTIONS', {}), res);
    expect(res.statusCode).toBe(200);
  });
  it('rejects GET (405)', async () => {
    fetchWithSession(null); const res = mockRes();
    await stripeHandler(req('GET', {}), res);
    expect(res.statusCode).toBe(405);
  });
  it('blocks disallowed origin (403)', async () => {
    fetchWithSession(null); const res = mockRes();
    await stripeHandler(req('POST', { action: 'checkout', sessionToken: 't' }, 'https://evil.example.com'), res);
    expect(res.statusCode).toBe(403);
  });
  it('requires a valid session (401)', async () => {
    fetchWithSession(null); const res = mockRes();
    await stripeHandler(req('POST', { action: 'checkout', sessionToken: 'bad' }), res);
    expect(res.statusCode).toBe(401);
  });
  it('rejects an unknown action (400) without calling Stripe', async () => {
    fetchWithSession('he-abc'); const res = mockRes();
    await stripeHandler(req('POST', { action: 'bogus', sessionToken: 't' }), res);
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/stripe/webhook — signature/method guards', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rejects GET (405)', async () => {
    const res = mockRes();
    await webhookHandler(req('GET', {}), res);
    expect(res.statusCode).toBe(405);
  });
  it('rejects a bad/missing Stripe signature (400)', async () => {
    const res = mockRes();
    await webhookHandler({ method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' }, url: '/api/stripe/webhook' }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });
});
