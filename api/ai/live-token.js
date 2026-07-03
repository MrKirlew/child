const { withSentry } = require('../_observability');
const { applyCors } = require('../_cors');

// Live-voice auth. The raw GOOGLE_AI_KEY MUST NOT reach the browser. Instead we
// mint a short-lived, single-use EPHEMERAL TOKEN server-side and hand the client
// a WebSocket URL that carries the token (not the key). The token works only for
// the Live API, expires quickly (Google default: ~1 min to start a session, ~30
// min connection), so a leaked URL is low-risk. Verified against the real API:
//   POST /v1alpha/auth_tokens?key=KEY  {uses:1}  ->  {name:"auth_tokens/..."}
//   wss://.../v1alpha...BidiGenerateContentConstrained?access_token=<name>
// The client (www/js/speech.js) opens the returned URL verbatim — no client change.
const TOKEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1alpha/auth_tokens';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

const handler = async (req, res) => {
  const { allowed, handled } = applyCors(req, res);
  if (handled) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) {
    console.warn(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', event: 'live-token.origin_blocked' }));
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const r = await fetch(`${TOKEN_ENDPOINT}?key=${API_KEY.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uses: 1 }),
    });
    const data = await r.json();
    if (!r.ok || !data || !data.name) {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'live-token.mint_failed', status: r.status }));
      return res.status(502).json({ error: 'Could not start voice session. Please try again.' });
    }
    const wsUrl = `${WS_BASE}?access_token=${encodeURIComponent(data.name)}`;
    return res.json({ url: wsUrl });
  } catch (e) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', event: 'live-token.mint_error', err: String((e && e.message) || e) }));
    return res.status(502).json({ error: 'Could not start voice session. Please try again.' });
  }
};

module.exports = withSentry(handler);
