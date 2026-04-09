// Model fallback chain — if primary is overloaded, try next
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
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

  // Try each model in fallback chain with retry
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await tryGenerate(model, body, API_KEY);
        if (result.ok) return res.json(result.data);
        // 503/429 = overloaded/rate-limited — try next model or retry
        if (result.status === 503 || result.status === 429) {
          if (attempt === 0) await new Promise(r => setTimeout(r, 500));
          continue;
        }
        // Other errors (400, 404, etc.) — return immediately
        return res.status(result.status).json(result.data);
      } catch (e) {
        if (attempt === 0) continue;
      }
    }
  }

  res.status(503).json({ error: 'All models unavailable. Please try again in a moment.' });
};
