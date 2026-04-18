// Text generation models — native audio models don't support text output
// Live audio (gemini-3.1-flash-live-preview) is used via Live API WebSocket only
const PRIMARY = 'gemini-2.5-flash';
const FALLBACK = 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Child-safe content filtering — block at lowest threshold
const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

async function tryGenerate(model, body, apiKey) {
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  return { ok: r.ok, status: r.status, data };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const body = { ...req.body, safetySettings: SAFETY };

  // Try primary model 3 times with exponential backoff (1s, 2s, 4s)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await tryGenerate(PRIMARY, body, API_KEY);
      if (result.ok) {
        result.data._meta = { model: PRIMARY, attempt };
        return res.json(result.data);
      }
      if (result.status === 503 || result.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return res.status(result.status).json(result.data);
    } catch (_e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
    }
  }

  // Primary exhausted — try fallback once
  try {
    const result = await tryGenerate(FALLBACK, body, API_KEY);
    if (result.ok) {
      result.data._meta = { model: FALLBACK, attempt: 0, fallback: true };
      return res.json(result.data);
    }
  } catch (_e) { /* fallback also failed */ }

  res.status(503).json({ error: 'All models unavailable. Please try again in a moment.' });
};
