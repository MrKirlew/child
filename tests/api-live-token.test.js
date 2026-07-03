import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const handler = (await import('../api/ai/live-token.js')).default;

function mockReq(method, origin) {
  return { method, headers: origin !== undefined ? { origin } : {}, url: '/api/ai/live-token' };
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

describe('API /ai/live-token — ephemeral token minting', () => {
  beforeEach(() => { process.env.GOOGLE_AI_KEY = 'AIza-SECRET-KEY'; });
  afterEach(() => { delete process.env.GOOGLE_AI_KEY; vi.restoreAllMocks(); });

  it('mints a token and returns a WS URL with access_token — never the raw key', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ name: 'auth_tokens/EPHEMERAL123' }) }));
    const res = mockRes();
    await handler(mockReq('POST', 'http://localhost'), res);
    expect(res.body.url).toContain('access_token=auth_tokens');
    expect(res.body.url).toContain('BidiGenerateContentConstrained');
    expect(res.body.url).not.toContain('AIza-SECRET-KEY');   // raw key must not leak
    expect(res.body.url).not.toContain('key=');
  });

  it('returns 502 when token minting fails upstream', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: 'quota' }) }));
    const res = mockRes();
    await handler(mockReq('POST', 'http://localhost'), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.url).toBeUndefined();
  });

  it('allows the native app origin and the Vercel domain', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ name: 'auth_tokens/X' }) }));
    for (const origin of ['http://localhost', 'https://forthechild.vercel.app', undefined]) {
      const res = mockRes();
      await handler(mockReq('POST', origin), res);
      expect(res.body.url, `origin=${origin}`).toContain('access_token=');
    }
  });

  it('blocks an unknown cross-site browser origin with 403', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ name: 'auth_tokens/X' }) }));
    const res = mockRes();
    await handler(mockReq('POST', 'https://evil.example.com'), res);
    expect(res.statusCode).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();   // never mints for disallowed origin
  });

  it('handles OPTIONS preflight', async () => {
    const res = mockRes();
    await handler(mockReq('OPTIONS', 'http://localhost'), res);
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });
});
