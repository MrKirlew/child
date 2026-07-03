// Upstash Redis (REST) helper for the parental-consent store. Uses fetch against
// the Upstash REST API — no SDK dependency, works in Vercel serverless.
// Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (auto-added by the Upstash
// Vercel integration).

async function redisCmd(args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('consent store not configured');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await r.json();
  if (!r.ok || (data && data.error)) throw new Error('store error: ' + ((data && data.error) || r.status));
  return data.result;
}

const setEx = (k, v, ttl) => redisCmd(['SET', k, v, 'EX', String(ttl)]);
const get = (k) => redisCmd(['GET', k]);
const del = (k) => redisCmd(['DEL', k]);

// Atomic counter with a TTL set on first increment — used for rate limiting.
async function incrEx(k, ttl) {
  const n = await redisCmd(['INCR', k]);
  if (Number(n) === 1) await redisCmd(['EXPIRE', k, String(ttl)]);
  return Number(n);
}

module.exports = { redisCmd, setEx, get, del, incrEx };
