const MODEL = 'gemini-2.5-flash-preview-tts';
const BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Per Google's TTS docs (May 2026): vague/short prompts can fail to trigger
// the speech-synthesis classifier — the model returns text tokens or 400
// "Model tried to generate text". Recommended fix is a clear preamble that
// labels where the spoken transcript begins. Model speaks ONLY what comes
// after the colon. Used on retry when a bare prompt fails.
const TTS_PREAMBLE = 'Say in a clear, friendly voice: ';

// Patterns that indicate the model misclassified the request and we should
// retry with the preamble. Both observed in production on bare short tokens
// like "elephant." and "kuh.".
function isClassifierMissError(status, errBody) {
  if (status === 500 && errBody && /no audio in response/i.test(JSON.stringify(errBody))) return true;
  if (status === 400 && errBody && /should only be used for tts|tried to generate text/i.test(JSON.stringify(errBody))) return true;
  return false;
}

async function _callGemini(apiKey, text, voice) {
  const r = await fetch(`${BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        // 500 audio tokens ≈ ~20s of speech. 150 capped at ~5.9s, which
        // truncated letter-by-letter spellings of 7+ letter words and
        // definitions longer than ~65 chars. Short prompts stop early,
        // so the raised cap has no effect on their cost or latency.
        maxOutputTokens: 500,
        response_modalities: ['AUDIO'],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: { voice_name: voice || 'Kore' }
          }
        }
      }
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, status: r.status, data };
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find(p => p.inlineData);
  if (!audioPart) return { ok: false, status: 500, data: { error: 'No audio in response' } };
  return { ok: true, audio: audioPart.inlineData.data, mimeType: audioPart.inlineData.mimeType };
}

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

  // Belt-and-suspenders: IPA brackets / slashes / parens still cause Gemini
  // to interpret the prompt as text-gen. Phonics callers are expected to
  // strip these client-side; surface a typed 400 if anything slips through.
  if (/[\[\]()/]/.test(text)) {
    return res.status(400).json({ error: 'phonics-unsanitized', hint: 'Strip [], (), and / from text before calling TTS' });
  }

  try {
    let result = await _callGemini(API_KEY, text, voice);

    // If the bare prompt missed the speech-synthesis classifier, retry
    // exactly once with an explicit TTS preamble. Per Google's TTS docs
    // this is the recommended pattern for terse / single-word inputs.
    if (!result.ok && isClassifierMissError(result.status, result.data)) {
      result = await _callGemini(API_KEY, TTS_PREAMBLE + text, voice);
    }

    if (!result.ok) return res.status(result.status).json(result.data);
    res.json({ audio: result.audio, mimeType: result.mimeType });
  } catch (_e) {
    res.status(502).json({ error: 'TTS generation failed' });
  }
};

// Test hooks — kept on the export so Vitest can verify constants without
// re-parsing the source. Not used by Vercel runtime.
module.exports.TTS_PREAMBLE = TTS_PREAMBLE;
module.exports.isClassifierMissError = isClassifierMissError;
