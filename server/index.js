const express = require('express');
const cors = require('cors');
const app = express();

// Load .env
require('fs').readFileSync(__dirname + '/.env', 'utf8').split('\n').forEach(line => {
  const [k, v] = line.split('='); if (k && v) process.env[k.trim()] = v.trim();
});

const API_KEY = process.env.GOOGLE_AI_KEY;
const PORT = process.env.PORT || 3456;
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Child-safe content filtering — block at lowest threshold
const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ ok: true, models: MODELS }));

app.post('/ai/generate', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });
  const body = { ...req.body, safetySettings: SAFETY };

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`${API_BASE}/${model}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await r.json();
        if (r.ok) return res.json(data);
        if (r.status === 503 || r.status === 429) {
          console.log(`[proxy] ${model} returned ${r.status}, ${attempt === 0 ? 'retrying...' : 'trying next model'}`);
          if (attempt === 0) await new Promise(r => setTimeout(r, 500));
          continue;
        }
        return res.status(r.status).json(data);
      } catch (e) {
        console.error(`[proxy] ${model} error:`, e.message);
        if (attempt === 0) continue;
      }
    }
  }

  res.status(503).json({ error: 'All models unavailable. Please try again in a moment.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`KiddoAI proxy running on port ${PORT}`);
  console.log(`Models: ${MODELS.join(' → ')}`);
  console.log(`Test: curl http://localhost:${PORT}/health`);
});
