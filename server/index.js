const express = require('express');
const cors = require('cors');
const app = express();

// Load .env
require('fs').readFileSync(__dirname + '/.env', 'utf8').split('\n').forEach(line => {
  const [k, v] = line.split('='); if (k && v) process.env[k.trim()] = v.trim();
});

const API_KEY = process.env.GOOGLE_AI_KEY;
const PORT = process.env.PORT || 3456;
const MODEL = 'gemini-2.5-flash';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Child-safe content filtering — block at lowest threshold
const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_, res) => res.json({ ok: true, model: MODEL }));

// AI proxy — accepts same body as Google AI, adds the key server-side
app.post('/ai/generate', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const r = await fetch(`${BASE}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, safetySettings: SAFETY })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e) {
    console.error('[proxy]', e.message);
    res.status(502).json({ error: 'Upstream error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`KiddoAI proxy running on port ${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Test: curl http://localhost:${PORT}/health`);
});
