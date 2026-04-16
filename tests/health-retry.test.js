import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const handler = (await import('../api/health.js')).default;

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { res.headers[k] = v; return res; },
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

function jsonResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('API /health retry behaviour', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    process.env.GOOGLE_AI_KEY = 'test-key-for-unit-test';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.GOOGLE_AI_KEY;
  });

  it('returns 503 when API key is missing', async () => {
    delete process.env.GOOGLE_AI_KEY;
    const res = mockRes();
    await handler({}, res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toContain('API key not configured');
  });

  it('succeeds on first attempt when Gemini responds 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = mockRes();
    await handler({}, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.attempt).toBe(0);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds on 3rd attempt', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = mockRes();
    await handler({}, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.attempt).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it('retries on 503 and eventually fails with 503 after 3 attempts', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(503));
    const res = mockRes();
    await handler({}, res);
    expect(res.statusCode).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('503');
    expect(res.body.attempt).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it('does not retry on non-retriable status (401)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(401));
    const res = mockRes();
    await handler({}, res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toContain('401');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('sets CORS header on every response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const res = mockRes();
    await handler({}, res);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
