// Transactional email via Resend (REST) — no SDK dependency.
// Env: RESEND_API_KEY (add in Vercel), CONSENT_EMAIL_FROM (verified sender;
// defaults to Resend's onboarding sender which only delivers to the account
// owner's address until you verify a domain like ollietutor.com).

function fromAddress() {
  return process.env.CONSENT_EMAIL_FROM || 'Ollie <onboarding@resend.dev>';
}

async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('email not configured');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromAddress(), to, subject, html, text }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('email send failed: ' + ((data && data.message) || r.status));
  return data;
}

module.exports = { sendEmail, fromAddress };
