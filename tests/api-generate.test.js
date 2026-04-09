import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the handler
const handler = (await import('../api/ai/generate.js')).default;

function mockReq(method, body) {
  return { method, body };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { res.headers[k] = v; return res; },
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
    end() { return res; },
  };
  return res;
}

describe('API /ai/generate', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_AI_KEY;
  });

  it('returns 405 for GET requests', async () => {
    const res = mockRes();
    await handler(mockReq('GET'), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 200 for OPTIONS (CORS preflight)', async () => {
    const res = mockRes();
    await handler(mockReq('OPTIONS'), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('returns 500 if GOOGLE_AI_KEY is not set', async () => {
    const res = mockRes();
    await handler(mockReq('POST', {}), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toContain('API key not configured');
  });

  it('sets CORS headers on every response', async () => {
    const res = mockRes();
    await handler(mockReq('POST', {}), res);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
  });
});

describe('Safety settings', () => {
  it('exports contain all 4 harm categories', async () => {
    const code = (await import('fs')).readFileSync('api/ai/generate.js', 'utf8');
    expect(code).toContain('HARM_CATEGORY_HARASSMENT');
    expect(code).toContain('HARM_CATEGORY_HATE_SPEECH');
    expect(code).toContain('HARM_CATEGORY_SEXUALLY_EXPLICIT');
    expect(code).toContain('HARM_CATEGORY_DANGEROUS_CONTENT');
    expect(code).toContain('BLOCK_LOW_AND_ABOVE');
  });
});
