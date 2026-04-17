const MODEL = 'gemini-3.1-flash-live-preview';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { text, voice } = req.body || {};
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const r = await fetch(`${BASE}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          maxOutputTokens: 150,
          response_modalities: ['AUDIO'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: voice || 'Kore'
              }
            }
          }
        }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    // Extract audio from response
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find(p => p.inlineData);
    if (!audioPart) return res.status(500).json({ error: 'No audio in response' });

    res.json({
      audio: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType
    });
  } catch (_e) {
    res.status(502).json({ error: 'TTS generation failed' });
  }
};
