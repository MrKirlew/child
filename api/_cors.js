// Shared origin gating for app endpoints that must not be callable by arbitrary
// websites (quota/abuse protection). Native Capacitor WebViews use
// http(s)://localhost, send Origin: null, or omit Origin entirely — all allowed.
// Named cross-site browser origins are rejected.

const ALLOWED = new Set([
  'https://forthechild.vercel.app',
  'https://ollie.vercel.app',
  'https://ollietutor.com', 'https://www.ollietutor.com',
  'http://localhost', 'https://localhost',
  'capacitor://localhost', 'ionic://localhost',
]);

function originAllowed(origin) {
  if (!origin || origin === 'null') return true;                       // native app / opaque WebView
  if (ALLOWED.has(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;       // local dev, any port
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true; // preview deploys
  return false;
}

// Sets CORS headers and handles the OPTIONS preflight. Returns:
//   { allowed, handled } — if handled is true, the caller must return immediately.
function applyCors(req, res) {
  const origin = (req.headers && req.headers.origin) || '';
  const allowed = originAllowed(origin);
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(200).end(); return { allowed, handled: true }; }
  return { allowed, handled: false };
}

module.exports = { applyCors, originAllowed, ALLOWED };
