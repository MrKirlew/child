const { withSentry } = require('../_observability');
const Safety = require('../../www/js/safety.js');
const { getSession, readSub, isActive } = require('../_auth');

// Text generation models — native audio models don't support text output.
// Live audio (gemini-3.1-flash-live-preview) is used via Live API WebSocket only.
// FALLBACK must be a LIVE model: gemini-2.0-flash was retired by Google on
// 2026-06-01, so the old fallback could never succeed — a transient primary blip
// then dead-ended as "All models unavailable" (the Homework Helper "hiccup").
// ⚠️ Both models below (the whole 2.5 line) retire 2026-10-16 — migrate PRIMARY
// and FALLBACK to the 3.x tier (e.g. gemini-3.5-flash) before then.
const PRIMARY = 'gemini-2.5-flash';
const FALLBACK = 'gemini-2.5-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Child-safe content filtering — block at lowest threshold.
// Kept as a literal here (source-grep test) and mirrored by Safety.SAFETY_SETTINGS
// (www/js/safety.js), which the Live path uses. Keep the two in sync.
const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

// Log a safety block without any child content (COPPA — counts/categories only).
function logSafetyBlock(reason, model) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(), level: 'warn', event: 'safety.block', reason, model,
  }));
}

// Log a Homework Helper entitlement denial (no child content — reason only).
function logHomeworkDenied(reason) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(), level: 'info', event: 'homework.premium_denied', reason,
  }));
}

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

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_AI_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  // Premium/vision gate: the Homework Helper sends feature:'homework'. Verify the
  // parent's subscription server-side (the client gate is bypassable, and vision
  // calls are pricier). Requests with no `feature` field are unaffected.
  const { feature, sessionToken, ...rest } = req.body || {};
  if (feature === 'homework') {
    try {
      const session = await getSession(sessionToken);
      const sub = session ? await readSub(session.he) : null;
      if (!session || !isActive(sub)) {
        logHomeworkDenied(session ? 'not_subscribed' : 'no_session');
        return res.status(402).json({ error: 'premium_required' });
      }
    } catch (_e) {
      // Entitlement store unreachable — fail closed, but distinguish from a hard
      // paywall so the client shows "try again", not an upsell.
      return res.status(503).json({ error: 'entitlement_unavailable' });
    }
  }

  // Strip our routing fields before forwarding — Gemini rejects unknown top-level keys.
  const body = { ...rest, safetySettings: SAFETY };

  // Try primary model 3 times with exponential backoff (1s, 2s, 4s)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await tryGenerate(PRIMARY, body, API_KEY);
      if (result.ok) {
        const verdict = Safety.isBlocked(result.data);
        if (verdict.blocked) {
          logSafetyBlock(verdict.reason, PRIMARY);
          return res.json({ blocked: true, reason: verdict.reason });
        }
        result.data._meta = { model: PRIMARY, attempt };
        return res.json(result.data);
      }
      // Retry the primary on transient upstream failures (429/500/503), then
      // fall through to FALLBACK below. A 4xx (bad request, safety, 402) is NOT
      // retried — the fallback would reject it identically — so it passes
      // straight through. Skip the backoff on the last attempt (we go to the
      // fallback next anyway) to stay under the 30s function budget.
      if (result.status === 429 || result.status === 500 || result.status === 503) {
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
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
      const verdict = Safety.isBlocked(result.data);
      if (verdict.blocked) {
        logSafetyBlock(verdict.reason, FALLBACK);
        return res.json({ blocked: true, reason: verdict.reason });
      }
      result.data._meta = { model: FALLBACK, attempt: 0, fallback: true };
      return res.json(result.data);
    }
  } catch (_e) { /* fallback also failed */ }

  res.status(503).json({ error: 'All models unavailable. Please try again in a moment.' });
};

module.exports = withSentry(handler);
