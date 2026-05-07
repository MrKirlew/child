const { withSentry } = require('./_observability');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const meta = {
    version: process.env.APP_VERSION || 'dev',
    git_sha: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    env: process.env.APP_ENV || process.env.VERCEL_ENV || 'production',
  };
  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(503).json({ ok: false, error: 'API key not configured', ...meta });

  const model = 'gemini-2.5-flash';
  const url = `${API_BASE}/${model}:generateContent?key=${API_KEY}`;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    generationConfig: { maxOutputTokens: 5 }
  });

  let lastErr = null;
  let lastStatus = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body
      });
      clearTimeout(timeout);
      if (r.ok) {
        return res.json({ status: 'ok', model, attempt, ts: Date.now(), ...meta });
      }
      if (r.status === 429 || r.status === 503) {
        lastStatus = r.status;
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
      }
      return res.status(503).json({ ok: false, error: `Model returned ${r.status}`, model, attempt, ts: Date.now(), ...meta });
    } catch (e) {
      clearTimeout(timeout);
      lastErr = e.name === 'AbortError' ? 'Timeout after 8s' : e.message;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  return res.status(503).json({
    ok: false,
    error: lastErr || `Upstream ${lastStatus} after 3 attempts`,
    model,
    attempt: 2,
    ts: Date.now(),
    ...meta,
  });
};

module.exports = withSentry(handler);
