import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const requestHandler = (await import('../api/consent/request.js')).default;
const verifyHandler = (await import('../api/consent/verify.js')).default;
const revokeHandler = (await import('../api/consent/revoke.js')).default;

function mockReq(method, body, origin = 'http://localhost') {
  return { method, body, headers: { origin, 'x-forwarded-for': '203.0.113.7' }, url: '/api/consent' };
}
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

// Route fetch to a fake Upstash (command array) or Resend, with per-test knobs.
function installFetch({ incr = 1, getVal = null } = {}) {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('resend.com')) return { ok: true, status: 200, json: async () => ({ id: 'email_1' }) };
    const args = JSON.parse(opts.body);
    const cmd = args[0];
    let result = 'OK';
    if (cmd === 'INCR') result = incr;
    else if (cmd === 'GET') result = getVal;
    else if (cmd === 'EXPIRE' || cmd === 'DEL') result = 1;
    return { ok: true, status: 200, json: async () => ({ result }) };
  });
}

describe('POST /api/consent/request', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 't';
    process.env.RESEND_API_KEY = 'resend-key';
  });
  afterEach(() => { vi.restoreAllMocks(); delete process.env.RESEND_API_KEY; });

  it('emails a code for a valid address', async () => {
    installFetch({ incr: 1 });
    const res = mockRes();
    await requestHandler(mockReq('POST', { email: 'parent@example.com' }), res);
    expect(res.body).toEqual({ ok: true });
    // A Resend email was sent
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('resend.com'))).toBe(true);
  });

  it('rejects an invalid email with 400', async () => {
    installFetch();
    const res = mockRes();
    await requestHandler(mockReq('POST', { email: 'not-an-email' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('rate-limits after too many requests (429)', async () => {
    installFetch({ incr: 6 });   // over RL_MAX (5)
    const res = mockRes();
    await requestHandler(mockReq('POST', { email: 'parent@example.com' }), res);
    expect(res.statusCode).toBe(429);
  });

  it('blocks a disallowed cross-site origin (403)', async () => {
    installFetch();
    const res = mockRes();
    await requestHandler(mockReq('POST', { email: 'parent@example.com' }, 'https://evil.example.com'), res);
    expect(res.statusCode).toBe(403);
  });

  it('reports a friendly error when email is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    installFetch({ incr: 1 });
    const res = mockRes();
    await requestHandler(mockReq('POST', { email: 'parent@example.com' }), res);
    expect(res.statusCode).toBe(502);
  });
});

describe('POST /api/consent/verify', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 't';
  });
  afterEach(() => vi.restoreAllMocks());

  it('records consent and returns a token for the correct code', async () => {
    installFetch({ getVal: '123456' });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: '123456' }), res);
    expect(res.body.consented).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.policyVersion).toBeDefined();
  });

  it('rejects an incorrect code', async () => {
    installFetch({ getVal: '123456' });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: '000000' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.consented).toBe(false);
  });

  it('rejects a malformed code', async () => {
    installFetch({ getVal: '123456' });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: 'abc' }), res);
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/consent/revoke', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 't';
  });
  afterEach(() => vi.restoreAllMocks());

  it('revokes a consent record for a token', async () => {
    installFetch({ getVal: 'hashed-email-abc' });
    const res = mockRes();
    await revokeHandler(mockReq('POST', { token: 'tok123' }), res);
    expect(res.body.revoked).toBe(true);
  });

  it('requires a token', async () => {
    installFetch();
    const res = mockRes();
    await revokeHandler(mockReq('POST', {}), res);
    expect(res.statusCode).toBe(400);
  });
});
