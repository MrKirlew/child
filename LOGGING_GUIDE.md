# Logging Guide

The infra is useless if logs don't carry the right fields. Every code path in `api/` and `www/js/` should follow this guide.

## Levels

| Level | When | Production? |
|---|---|---|
| `debug` | Verbose internal state, decision traces | Off (toggle via `LOG_LEVEL=debug`) |
| `info` | Significant events: request received, action taken, state transition | On |
| `warn` | Degraded but recovered: retry succeeded, fallback triggered | On |
| `error` | Operation failed; also captured to Sentry | On |

## Always log

- **Every backend HTTP request** — done automatically by `withSentry` wrapper. Includes `request_id`, route, method, status, duration_ms.
- **Every external API call from backend** — target, duration_ms, outcome. Use `log.info` from `api/_logger.js`.
- **Every retry path** — first failure → warn, recovered after retry → info.
- **Every error condition** — use `log.error` (backend) or `Logger.exception` (frontend).
- **Significant state changes (frontend)** — COPPA accepted, parent dashboard opened, exercise generated, spell ceremony started — `Logger.info('event-name', { fields })`.

## Never log

- Child voice transcriptions in any form. The K-6 audience is COPPA-protected.
- Parent PIN values (already hashed but treat the hash as sensitive).
- The full `GOOGLE_AI_KEY` or any subset that could leak it.
- Full request bodies for any AI endpoint — they may contain user-typed content.
- Any user name, email, or device identifier.

## Format

Always structured. Backend uses `api/_logger.js` (JSON to stdout). Frontend uses `www/js/logger.js` (Sentry breadcrumbs + console).

**Backend:**
```js
const log = require('./_logger');
log.info('gemini-call-start', { model: 'gemini-2.5-flash', request_id: rid });
log.warn('tts-classifier-miss', { request_id: rid, retried: true });
log.error('upstream-503', { route: '/api/ai/generate', attempt: 2 });
```

**Frontend:**
```js
Logger.info('coppa-accepted');
Logger.warn('tts-fallback', { reason: 'http-500' });
Logger.exception(err, { feature: 'spell-ceremony' });
```

## Request ID flow

Every backend request has a `request_id` (8-byte hex). The wrapper:
- Generates one if not provided
- Returns it in `x-request-id` response header
- Logs every line for that request with the same ID
- Tags the Sentry scope so any captured exception carries the ID

When the frontend calls a backend endpoint, it can extract `x-request-id` from the response and include it in subsequent `Logger.error` calls so issues correlate end-to-end.
