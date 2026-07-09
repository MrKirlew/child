import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';

// Env must be present before the handler module loads (auth store reads it lazily,
// but we set it up front to mirror the other API tests).
process.env.GOOGLE_AI_KEY = 'test-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.example';
process.env.UPSTASH_REDIS_REST_TOKEN = 't';

const handler = (await import('../api/ai/generate.js')).default;

function mockRes() {
  const res = {
    statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { res.headers[k] = v; return res; },
    status(c) { res.statusCode = c; return res; },
    json(d) { res.body = d; return res; },
    end() { return res; },
  };
  return res;
}
function req(body) { return { method: 'POST', body }; }

// Fake Upstash (session/sub) + Gemini backends over one fetch stub.
function mkFetch({ he = null, subStatus = null, upstashThrows = false } = {}) {
  const calls = { gemini: [], upstash: [] };
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('generativelanguage')) {
      calls.gemini.push(JSON.parse(opts.body));
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"message":"hi"}' }] } }] }) };
    }
    if (upstashThrows) throw new Error('store down');
    const args = JSON.parse(opts.body); const cmd = args[0], key = args[1];
    calls.upstash.push(args);
    let result = 'OK';
    if (cmd === 'GET') {
      if (key.startsWith('session:')) result = he;
      else if (key.startsWith('account:')) result = he ? JSON.stringify({ email: 'p@e.com' }) : null;
      else if (key.startsWith('sub:')) result = subStatus ? JSON.stringify({ status: subStatus }) : null;
      else result = null;
    }
    return { ok: true, json: async () => ({ result }) };
  });
  return calls;
}

const homeworkBody = () => ({
  feature: 'homework',
  sessionToken: 'tok',
  system_instruction: { parts: [{ text: 'sys' }] },
  contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: 'AAAA' } }, { text: 'read it' }] }],
  generationConfig: { maxOutputTokens: 1200 },
});

describe('POST /ai/generate — Homework Helper premium gate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks homework requests with no valid session (402) and never calls Gemini', async () => {
    const calls = mkFetch({ he: null });
    const res = mockRes();
    await handler(req(homeworkBody()), res);
    expect(res.statusCode).toBe(402);
    expect(res.body.error).toBe('premium_required');
    expect(calls.gemini).toHaveLength(0);
  });

  it('blocks a logged-in parent without an active subscription (402)', async () => {
    const calls = mkFetch({ he: 'emailhash', subStatus: 'canceled' });
    const res = mockRes();
    await handler(req(homeworkBody()), res);
    expect(res.statusCode).toBe(402);
    expect(res.body.error).toBe('premium_required');
    expect(calls.gemini).toHaveLength(0);
  });

  it('allows an active subscriber and strips feature/sessionToken before forwarding', async () => {
    const calls = mkFetch({ he: 'emailhash', subStatus: 'active' });
    const res = mockRes();
    await handler(req(homeworkBody()), res);
    expect(res.statusCode).toBe(200);
    expect(calls.gemini).toHaveLength(1);
    const forwarded = calls.gemini[0];
    expect(forwarded.feature).toBeUndefined();
    expect(forwarded.sessionToken).toBeUndefined();
    expect(forwarded.safetySettings).toBeDefined();       // safety still injected
    expect(forwarded.contents[0].parts[0].inline_data.data).toBe('AAAA'); // image forwarded
  });

  it('treats a trialing subscription as entitled', async () => {
    const calls = mkFetch({ he: 'emailhash', subStatus: 'trialing' });
    const res = mockRes();
    await handler(req(homeworkBody()), res);
    expect(res.statusCode).toBe(200);
    expect(calls.gemini).toHaveLength(1);
  });

  it('fails closed with a distinct 503 when the entitlement store is unreachable', async () => {
    const calls = mkFetch({ upstashThrows: true });
    const res = mockRes();
    await handler(req(homeworkBody()), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('entitlement_unavailable');
    expect(calls.gemini).toHaveLength(0);
  });

  it('does NOT gate ordinary (non-homework) requests — existing Learn/exercise/spell path unchanged', async () => {
    const calls = mkFetch({ he: null }); // no session at all
    const res = mockRes();
    await handler(req({ contents: [{ role: 'user', parts: [{ text: 'teach me 2+2' }] }] }), res);
    expect(res.statusCode).toBe(200);
    expect(calls.upstash).toHaveLength(0);  // no entitlement lookup
    expect(calls.gemini).toHaveLength(1);
    expect(calls.gemini[0].safetySettings).toBeDefined();
  });
});

// Fake Upstash (always an active subscriber, so the homework gate passes) +
// per-model Gemini responses so we can exercise the primary→fallback path. The
// URL carries the model id, so a '-lite' segment identifies the fallback call.
function mkFetchModels({ primaryStatus = 200, fallbackStatus = 200 } = {}) {
  const calls = { gemini: [] };
  const geminiResp = (status) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (status >= 200 && status < 300)
      ? { candidates: [{ content: { parts: [{ text: '{"message":"ok"}' }] } }] }
      : { error: { code: status, message: 'upstream ' + status } },
  });
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('generativelanguage')) {
      const isFallback = String(url).includes('gemini-2.5-flash-lite');
      calls.gemini.push({ model: isFallback ? 'fallback' : 'primary', body: JSON.parse(opts.body) });
      return geminiResp(isFallback ? fallbackStatus : primaryStatus);
    }
    const args = JSON.parse(opts.body); const cmd = args[0], key = args[1];
    let result = 'OK';
    if (cmd === 'GET') {
      if (key.startsWith('session:')) result = 'emailhash';
      else if (key.startsWith('account:')) result = JSON.stringify({ email: 'p@e.com' });
      else if (key.startsWith('sub:')) result = JSON.stringify({ status: 'active' });
      else result = null;
    }
    return { ok: true, json: async () => ({ result }) };
  });
  return calls;
}

describe('POST /ai/generate — model fallback & resilience', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('recovers via the fallback model when the primary is transiently overloaded (503)', async () => {
    vi.useFakeTimers();
    const calls = mkFetchModels({ primaryStatus: 503, fallbackStatus: 200 });
    const res = mockRes();
    const p = handler(req(homeworkBody()), res);
    await vi.runAllTimersAsync();
    await p;
    expect(res.statusCode).toBe(200);
    expect(res.body._meta.fallback).toBe(true);                 // answered by the fallback
    const models = calls.gemini.map(c => c.model);
    expect(models.filter(m => m === 'primary')).toHaveLength(3); // primary retried 3x
    expect(models[models.length - 1]).toBe('fallback');
  });

  it('returns 503 "All models unavailable" only when BOTH primary and fallback fail', async () => {
    vi.useFakeTimers();
    mkFetchModels({ primaryStatus: 503, fallbackStatus: 503 });
    const res = mockRes();
    const p = handler(req(homeworkBody()), res);
    await vi.runAllTimersAsync();
    await p;
    expect(res.statusCode).toBe(503);
    expect(String(res.body.error)).toMatch(/All models unavailable/);
  });

  it('never assigns a Google-retired model id to PRIMARY/FALLBACK', () => {
    const src = readFileSync(new URL('../api/ai/generate.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/=\s*'gemini-2\.0-flash'/);          // retired 2026-06-01
    expect(src).toMatch(/const PRIMARY\s*=\s*'gemini-2\.5-flash'/);
    expect(src).toMatch(/const FALLBACK\s*=\s*'gemini-2\.5-flash-lite'/);
  });
});
