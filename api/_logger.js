// Structured JSON logger for Vercel serverless functions. Lines flow to
// Vercel's runtime log stream automatically — no shipping config needed
// at this stage. Errors should ALSO be sent to Sentry via withSentry.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const ACTIVE_LEVEL = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function _emit(level, msg, fields) {
  if ((LEVELS[level] ?? LEVELS.info) < ACTIVE_LEVEL) return;
  const line = { ts: new Date().toISOString(), level, msg, ...(fields || {}) };
  const out = level === 'error' ? console.error : console.log;
  out(JSON.stringify(line));
}

module.exports = {
  debug: (msg, fields) => _emit('debug', msg, fields),
  info: (msg, fields) => _emit('info', msg, fields),
  warn: (msg, fields) => _emit('warn', msg, fields),
  error: (msg, fields) => _emit('error', msg, fields),
};
