const MODEL = 'gemini-2.5-flash';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Child-safe content filtering — block at lowest threshold
const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const body = { ...req.body, safetySettings: SAFETY };
    const r = await fetch(`${BASE}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream error' });
  }
};
