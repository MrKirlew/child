import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const speakMod = await import('../api/ai/speak.js');
const handler = speakMod.default;
const { TTS_PREAMBLE, isClassifierMissError } = speakMod;

function mockReq(method, body) { return { method, body }; }

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

function fakeFetchOnce(...responses) {
  const fetchSpy = vi.fn();
  responses.forEach(r => {
    fetchSpy.mockImplementationOnce(() => Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: () => Promise.resolve(r.body),
    }));
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

const audioOk = {
  candidates: [{ content: { parts: [{ inlineData: { data: 'BASE64AUDIO==', mimeType: 'audio/L16;codec=pcm;rate=24000' } }] } }]
};

describe('API /ai/speak — request guards', () => {
  beforeEach(() => { delete process.env.GOOGLE_AI_KEY; vi.unstubAllGlobals(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns 405 for GET', async () => {
    const res = mockRes();
    await handler(mockReq('GET'), res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 200 for OPTIONS preflight with CORS headers', async () => {
    const res = mockRes();
    await handler(mockReq('OPTIONS'), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('returns 500 when GOOGLE_AI_KEY missing', async () => {
    const res = mockRes();
    await handler(mockReq('POST', { text: 'hi' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toContain('API key');
  });

  it('returns 400 when text is empty', async () => {
    process.env.GOOGLE_AI_KEY = 'k';
    const res = mockRes();
    await handler(mockReq('POST', {}), res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 phonics-unsanitized for bracketed text (defense-in-depth)', async () => {
    process.env.GOOGLE_AI_KEY = 'k';
    const res = mockRes();
    await handler(mockReq('POST', { text: 'el [ɪ] funt' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('phonics-unsanitized');
  });
});

describe('API /ai/speak — happy path', () => {
  beforeEach(() => { process.env.GOOGLE_AI_KEY = 'k'; vi.unstubAllGlobals(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns audio on first-try 200, no preamble used', async () => {
    const fetchSpy = fakeFetchOnce({ status: 200, body: audioOk });
    const res = mockRes();
    await handler(mockReq('POST', { text: 'hello there' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.audio).toBe('BASE64AUDIO==');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // Sent text should be bare, no preamble
    const sentBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(sentBody.contents[0].parts[0].text).toBe('hello there');
  });
});

describe('API /ai/speak — classifier-miss retry with preamble', () => {
  beforeEach(() => { process.env.GOOGLE_AI_KEY = 'k'; vi.unstubAllGlobals(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('retries with preamble after 500 "No audio in response" and recovers', async () => {
    const fetchSpy = fakeFetchOnce(
      { status: 200, body: { candidates: [{ content: { parts: [] } }] } }, // no audio in parts → classifier miss
      { status: 200, body: audioOk }
    );
    const res = mockRes();
    await handler(mockReq('POST', { text: 'kuh.' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.audio).toBe('BASE64AUDIO==');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(fetchSpy.mock.calls[1][1].body);
    expect(retryBody.contents[0].parts[0].text).toBe(TTS_PREAMBLE + 'kuh.');
  });

  it('retries with preamble after 400 "should only be used for TTS" and recovers', async () => {
    const fetchSpy = fakeFetchOnce(
      { status: 400, body: { error: { message: 'Model tried to generate text, but it should only be used for TTS' } } },
      { status: 200, body: audioOk }
    );
    const res = mockRes();
    await handler(mockReq('POST', { text: 'elephant.' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.audio).toBe('BASE64AUDIO==');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(fetchSpy.mock.calls[1][1].body);
    expect(retryBody.contents[0].parts[0].text).toBe(TTS_PREAMBLE + 'elephant.');
  });

  it('returns 500 to caller when retry also fails (no infinite loop)', async () => {
    const fetchSpy = fakeFetchOnce(
      { status: 200, body: { candidates: [{ content: { parts: [] } }] } },
      { status: 200, body: { candidates: [{ content: { parts: [] } }] } }
    );
    const res = mockRes();
    await handler(mockReq('POST', { text: 'a.' }), res);
    expect(res.statusCode).toBe(500);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // exactly one retry, not infinite
  });

  it('does NOT retry on unrelated 500 (e.g. real upstream failure)', async () => {
    const fetchSpy = fakeFetchOnce(
      { status: 500, body: { error: { message: 'Internal server error' } } }
    );
    const res = mockRes();
    await handler(mockReq('POST', { text: 'hello' }), res);
    expect(res.statusCode).toBe(500);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // no retry on unrelated 500
  });
});

describe('isClassifierMissError', () => {
  it('matches 500 + "No audio in response"', () => {
    expect(isClassifierMissError(500, { error: 'No audio in response' })).toBe(true);
  });
  it('matches 400 + "should only be used for TTS"', () => {
    expect(isClassifierMissError(400, { error: { message: 'Model tried to generate text, but it should only be used for TTS' } })).toBe(true);
  });
  it('does NOT match 500 with a generic upstream error', () => {
    expect(isClassifierMissError(500, { error: 'Internal' })).toBe(false);
  });
  it('does NOT match 200', () => {
    expect(isClassifierMissError(200, {})).toBe(false);
  });
});
