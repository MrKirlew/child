# Runbook — Ollie

Operational reference for diagnosing production issues. The 99% uptime SLO is unmaintainable without it.

## Where signals flow

| Signal | Destination | Free tier? |
|---|---|---|
| Errors (frontend + backend) | **Sentry** project (DSN set in `SENTRY_DSN` env var) | Yes — 5k errors/month |
| Structured request logs (backend) | **Vercel Logs** dashboard (built-in, captures `console.log` from functions) | Yes — included with Vercel |
| Synthetic uptime monitoring | **UptimeRobot** monitoring `/api/health` every 5 min | Yes — 50 monitors at 5-min |
| Live deploy verification | CI's `curl -f /api/health` post-deploy step | n/a |

## First-time setup (you, ~10 min)

1. **Create Sentry account** → new project → JavaScript (browser) + Node.js platforms.
   - Copy the DSN.
   - Set `SENTRY_DSN` in Vercel project env vars (Production + Preview).
   - In `www/index.html`, replace `window.SENTRY_DSN = ''` with your DSN. (It's a public-by-design key.)
2. **Create UptimeRobot account** → New Monitor → HTTP(s) → URL `https://forthechild.vercel.app/api/health` → 5-minute interval. Add an email alert contact.
3. (Optional later) Vercel dashboard → Integrations → Better Stack → connect to stream Vercel logs into Better Stack's search UI.

## Diagnosing a production incident

1. **Is it a real outage?** Check UptimeRobot — if `/api/health` is failing, the upstream Gemini API is likely the problem. Check `https://status.cloud.google.com`.
2. **Is it a code regression?** Open Sentry → look at the last 1 hour of issues, sort by frequency. New issue + recent deploy = the deploy is suspect.
3. **What deploy is live?** `curl https://forthechild.vercel.app/api/health` — response includes `git_sha` field. Cross-check with `git log --oneline`.
4. **Trace one user's request:** Each response carries an `x-request-id` header. Search Vercel Logs for that ID — every log line for that request shares it.
5. **Roll back if needed:** Vercel dashboard → Deployments → click prior good deploy → "Promote to Production".

## Common queries

| Question | Where to look |
|---|---|
| "Is the AI proxy down?" | UptimeRobot dashboard, then `curl /api/health` |
| "Did the last deploy break TTS?" | Sentry — filter `route:/api/ai/speak`, last 30 min |
| "Why did this child's spell flow go silent?" | Vercel Logs — filter by `request_id`, look for `_fetchTTS failed` lines |
| "How many TTS retries are firing per day?" | Vercel Logs — search for `Say in a clear, friendly voice:` (preamble retry path) |

## Manual rollback playbook

If Sentry shows a new error spike + the latest deploy looks responsible:

```
# 1. Note the bad deploy's commit SHA from /api/health response
# 2. In Vercel dashboard: Deployments → previous good → "Promote to Production"
# 3. Verify health: curl https://forthechild.vercel.app/api/health
# 4. Open a fix branch from the good SHA: git checkout -b fix/<issue> <sha>
# 5. File a Sentry issue link in the commit message of the eventual fix
```
