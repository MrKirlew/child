import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const handler = (await import('../api/ai/generate.js')).default;

function mockReq(body) { return { method: 'POST', body: body || {}, headers: {}, url: '/api/ai/generate' }; }
function mockRes() {
  const res = {
    statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { res.headers[k] = v; return res; },
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
    end() { return res; },
  };
  return res;
}

describe('API /ai/generate — safety block handling (runtime)', () => {
  beforeEach(() => { process.env.GOOGLE_AI_KEY = 'test-key'; });
  afterEach(() => { delete process.env.GOOGLE_AI_KEY; vi.restoreAllMocks(); });

  it('returns { blocked:true } when Gemini reports a promptFeedback blockReason', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ promptFeedback: { blockReason: 'SAFETY' } }) }));
    const res = mockRes();
    await handler(mockReq({ contents: [] }), res);
    expect(res.body).toEqual({ blocked: true, reason: 'SAFETY' });
    expect(res.body.candidates).toBeUndefined();
  });

  it('returns { blocked:true } when the candidate finishReason is SAFETY', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ finishReason: 'SAFETY' }] }) }));
    const res = mockRes();
    await handler(mockReq({ contents: [] }), res);
    expect(res.body.blocked).toBe(true);
  });

  it('passes a clean response straight through (not blocked)', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Hello!' }] } }] }) }));
    const res = mockRes();
    await handler(mockReq({ contents: [] }), res);
    expect(res.body.blocked).toBeUndefined();
    expect(res.body.candidates[0].content.parts[0].text).toBe('Hello!');
  });
});
