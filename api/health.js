const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(503).json({ ok: false, error: 'API key not configured' });

  const model = 'gemini-2.5-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch(`${API_BASE}/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 5 }
      })
    });
    clearTimeout(timeout);
    if (r.ok) {
      return res.json({ status: 'ok', model, ts: Date.now() });
    }
    return res.status(503).json({ ok: false, error: `Model returned ${r.status}`, model, ts: Date.now() });
  } catch (e) {
    clearTimeout(timeout);
    return res.status(503).json({ ok: false, error: e.name === 'AbortError' ? 'Timeout after 8s' : e.message, model, ts: Date.now() });
  }
};
