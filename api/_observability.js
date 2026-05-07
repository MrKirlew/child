// Centralized Sentry init + handler wrapper for Vercel serverless functions.
// Handlers wrap their export: `module.exports = withSentry(handler)`.
//
// Sentry is no-op when SENTRY_DSN is unset — tests and local dev don't need it.

const crypto = require('crypto');

let _sentry = null;
let _initialized = false;

function _initSentry() {
  if (_initialized) return _sentry;
  _initialized = true;
  if (!process.env.SENTRY_DSN) return null;
  try {
    _sentry = require('@sentry/node');
    _sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.APP_ENV || 'production',
      release: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
      // No replay/PII for the K-6 audience.
      sendDefaultPii: false,
    });
  } catch (_e) {
    _sentry = null;
  }
  return _sentry;
}

function newRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

// HOF wrapping a Vercel handler with: request ID, structured access log,
// Sentry exception capture, and event flush before the lambda freezes.
function withSentry(handler) {
  return async function wrapped(req, res) {
    const sentry = _initSentry();
    const requestId = req.headers?.['x-request-id'] || newRequestId();
    const started = Date.now();
    const route = (req.url || '').split('?')[0] || 'unknown';

    if (res.setHeader) res.setHeader('x-request-id', requestId);
    if (sentry) sentry.setTag('request_id', requestId);

    // Wrap res.status / res.json / res.end so we can capture the final
    // status code for the access log without monkey-patching every handler.
    let finalStatus = 200;
    const origStatus = res.status?.bind(res);
    if (origStatus) res.status = (code) => { finalStatus = code; return origStatus(code); };

    try {
      await handler(req, res);
    } catch (e) {
      finalStatus = 500;
      if (sentry) sentry.captureException(e, { tags: { route, request_id: requestId } });
      console.error(JSON.stringify({
        ts: new Date().toISOString(), level: 'error', request_id: requestId, route,
        msg: 'unhandled-exception', err: String(e?.message || e), stack: e?.stack,
      }));
      if (!res.headersSent) {
        try { res.status(500).json({ error: 'Internal error', request_id: requestId }); } catch (_e) { /* response already started */ }
      }
    } finally {
      const duration_ms = Date.now() - started;
      console.log(JSON.stringify({
        ts: new Date().toISOString(), level: 'info', request_id: requestId, route,
        method: req.method, status: finalStatus, duration_ms,
      }));
      if (sentry && typeof sentry.flush === 'function') {
        try { await sentry.flush(2000); } catch (_e) { /* swallow flush timeout */ }
      }
    }
  };
}

module.exports = { withSentry, newRequestId };
