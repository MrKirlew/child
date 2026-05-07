const { withSentry } = require('./_observability');
const log = require('./_logger');

let _sentry = null;
function _getSentry() {
  if (_sentry !== null) return _sentry || null;
  if (!process.env.SENTRY_DSN) { _sentry = false; return null; }
  try { _sentry = require('@sentry/node'); } catch (_e) { _sentry = false; }
  return _sentry || null;
}

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { type, message, timestamp, context } = req.body || {};
  log.error('client-error-report', { type, message, context, ts: timestamp || new Date().toISOString() });
  const sentry = _getSentry();
  if (sentry?.captureMessage) {
    sentry.captureMessage(`[client] ${type || 'unknown'}: ${message || 'no message'}`, {
      level: 'error',
      extra: { type, message, context, client_ts: timestamp },
    });
  }
  res.status(204).end();
};

module.exports = withSentry(handler);