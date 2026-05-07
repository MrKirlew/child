// Sentry browser init — runs only when window.SENTRY_DSN is set in
// index.html. Loaded as a plain <script> after the Sentry CDN bundle.
//
// Replay/PII capture is DISABLED by design — this app's audience is K-6
// children. We send error events + breadcrumbs only.

(function () {
  if (!window.SENTRY_DSN) return;
  if (!window.Sentry || typeof window.Sentry.init !== 'function') return;

  window.Sentry.init({
    dsn: window.SENTRY_DSN,
    environment: window.APP_ENV || 'production',
    release: window.APP_VERSION || 'dev',
    tracesSampleRate: Number(window.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event?.request?.cookies) delete event.request.cookies;
      if (event?.user) delete event.user;
      return event;
    },
  });
})();
