const express = require('express');
const cors = require('cors');
const app = express();

// Load .env
require('fs').readFileSync(__dirname + '/.env', 'utf8').split('\n').forEach(line => {
  const [k, v] = line.split('='); if (k && v) process.env[k.trim()] = v.trim();
});

const API_KEY = process.env.GOOGLE_AI_KEY;
const PORT = process.env.PORT || 3456;
// Text generation only — native audio models used via Live API WebSocket
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

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ ok: true, model: PRIMARY }));

app.post('/ai/generate', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });
  const body = { ...req.body, safetySettings: SAFETY };

  // Try primary 3 times with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${API_BASE}/${PRIMARY}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (r.ok) { data._meta = { model: PRIMARY, attempt }; return res.json(data); }
      if (r.status === 503 || r.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return res.status(r.status).json(data);
    } catch (e) {
      console.error(`[proxy] ${PRIMARY} attempt ${attempt} error:`, e.message);
      if (attempt < 2) { await new Promise(resolve => setTimeout(resolve, 1000)); continue; }
    }
  }

  // Primary exhausted — try fallback once
  try {
    const r = await fetch(`${API_BASE}/${FALLBACK}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (r.ok) { data._meta = { model: FALLBACK, fallback: true }; return res.json(data); }
  } catch (e) { console.error(`[proxy] ${FALLBACK} error:`, e.message); }

  res.status(503).json({ error: 'All models unavailable. Please try again in a moment.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ollie proxy running on port ${PORT}`);
  console.log(`Models: ${PRIMARY} → ${FALLBACK}`);
  console.log(`Test: curl http://localhost:${PORT}/health`);
});
