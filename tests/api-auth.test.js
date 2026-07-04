import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const reqHandler = (await import('../api/auth/request.js')).default;
const verifyHandler = (await import('../api/auth/verify.js')).default;
const sessionHandler = (await import('../api/auth/session.js')).default;
const logoutHandler = (await import('../api/auth/logout.js')).default;

function mockReq(method, body, origin = 'http://localhost') {
  return { method, body, headers: { origin, 'x-forwarded-for': '203.0.113.5' }, url: '/api/auth' };
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

// Route fetch to fake Upstash (command array) or Resend, with per-test knobs.
function installFetch({ code = null, sessionHe = null, accountEmail = null, sub = null, incr = 1 } = {}) {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('resend.com')) return { ok: true, status: 200, json: async () => ({ id: 'e1' }) };
    const args = JSON.parse(opts.body);
    const cmd = args[0], key = args[1];
    let result = 'OK';
    if (cmd === 'INCR') result = incr;
    else if (cmd === 'EXPIRE' || cmd === 'DEL') result = 1;
    else if (cmd === 'GET') {
      if (key && key.startsWith('login_code:')) result = code;
      else if (key && key.startsWith('session:')) result = sessionHe;
      else if (key && key.startsWith('account:')) result = accountEmail ? JSON.stringify({ email: accountEmail }) : null;
      else if (key && key.startsWith('sub:')) result = sub ? JSON.stringify(sub) : null;
      else result = null;
    }
    return { ok: true, status: 200, json: async () => ({ result }) };
  });
}

beforeEach(() => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 't';
  process.env.RESEND_API_KEY = 'resend-key';
});
afterEach(() => { vi.restoreAllMocks(); delete process.env.RESEND_API_KEY; });

describe('POST /api/auth/request', () => {
  it('emails a sign-in code for a valid address', async () => {
    installFetch({ incr: 1 });
    const res = mockRes();
    await reqHandler(mockReq('POST', { email: 'parent@example.com' }), res);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch.mock.calls.some(c => String(c[0]).includes('resend.com'))).toBe(true);
  });
  it('rejects an invalid email (400)', async () => {
    installFetch();
    const res = mockRes();
    await reqHandler(mockReq('POST', { email: 'nope' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('rate-limits after too many requests (429)', async () => {
    installFetch({ incr: 6 });
    const res = mockRes();
    await reqHandler(mockReq('POST', { email: 'parent@example.com' }), res);
    expect(res.statusCode).toBe(429);
  });
  it('blocks disallowed cross-site origin (403)', async () => {
    installFetch();
    const res = mockRes();
    await reqHandler(mockReq('POST', { email: 'parent@example.com' }, 'https://evil.example.com'), res);
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/auth/verify', () => {
  it('signs in with the correct code → session token + subscription', async () => {
    installFetch({ code: '123456', sub: { status: 'active', priceId: 'price_1' } });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: '123456' }), res);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.sessionToken).toBe('string');
    expect(res.body.email).toBe('parent@example.com');
    expect(res.body.subscription.status).toBe('active');
  });
  it('rejects an incorrect code (400)', async () => {
    installFetch({ code: '123456' });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: '000000' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
  it('rejects a malformed code (400)', async () => {
    installFetch({ code: '123456' });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: 'abc' }), res);
    expect(res.statusCode).toBe(400);
  });
  it('defaults subscription to none when none stored', async () => {
    installFetch({ code: '123456', sub: null });
    const res = mockRes();
    await verifyHandler(mockReq('POST', { email: 'parent@example.com', code: '123456' }), res);
    expect(res.body.subscription.status).toBe('none');
  });
});

describe('POST /api/auth/session', () => {
  it('returns account state for a valid session', async () => {
    installFetch({ sessionHe: 'hash-abc', accountEmail: 'parent@example.com', sub: { status: 'trialing' } });
    const res = mockRes();
    await sessionHandler(mockReq('POST', { sessionToken: 'tok' }), res);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.email).toBe('parent@example.com');
    expect(res.body.subscription.status).toBe('trialing');
  });
  it('returns 401 for an unknown/expired token', async () => {
    installFetch({ sessionHe: null });
    const res = mockRes();
    await sessionHandler(mockReq('POST', { sessionToken: 'tok' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body.authenticated).toBe(false);
  });
  it('returns 401 when no token supplied', async () => {
    installFetch();
    const res = mockRes();
    await sessionHandler(mockReq('POST', {}), res);
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('invalidates a session token', async () => {
    installFetch();
    const res = mockRes();
    await logoutHandler(mockReq('POST', { sessionToken: 'tok' }), res);
    expect(res.body.ok).toBe(true);
  });
  it('requires a token (400)', async () => {
    installFetch();
    const res = mockRes();
    await logoutHandler(mockReq('POST', {}), res);
    expect(res.statusCode).toBe(400);
  });
});
