// Frontend logger. Errors flow to Sentry (when SENTRY_DSN configured); all
// levels mirror to console so dev tooling still sees them. Loaded as a
// plain <script> — no bundler — so APIs are attached to globalThis.

(function () {
  const DEBUG = (window.LOG_LEVEL || 'info') === 'debug';
  const _Sentry = () => window.Sentry; // resolved lazily; may load after this file

  function _toFields(fields) {
    if (!fields || typeof fields !== 'object') return {};
    return fields;
  }

  function info(msg, fields) {
    if (DEBUG) console.info('[Ollie]', msg, _toFields(fields));
    const S = _Sentry();
    if (S?.addBreadcrumb) S.addBreadcrumb({ category: 'app', level: 'info', message: msg, data: _toFields(fields) });
  }

  function warn(msg, fields) {
    console.warn('[Ollie]', msg, _toFields(fields));
    const S = _Sentry();
    if (S?.addBreadcrumb) S.addBreadcrumb({ category: 'app', level: 'warning', message: msg, data: _toFields(fields) });
  }

  function error(msg, fields) {
    console.error('[Ollie]', msg, _toFields(fields));
    const S = _Sentry();
    if (S?.captureMessage) S.captureMessage(msg, { level: 'error', extra: _toFields(fields) });
  }

  function exception(e, context) {
    console.error('[Ollie]', e, context);
    const S = _Sentry();
    if (S?.captureException) S.captureException(e, { extra: _toFields(context) });
  }

  globalThis.Logger = { info, warn, error, exception };
})();
