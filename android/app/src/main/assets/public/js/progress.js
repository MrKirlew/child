/* ══ PROGRESS TAB ══ */
/* globals: S, SUBS, SCOL, BADGES, esc, saveS, addBub, speakDirect */

function updProg() {
  const tot = Object.values(S.ex).reduce((a, b) => a + b.t, 0), cor = Object.values(S.ex).reduce((a, b) => a + b.c, 0);
  document.getElementById('pt-t').textContent = tot; document.getElementById('pt-c').textContent = cor;
  document.getElementById('pt-a').textContent = tot ? Math.round(cor / tot * 100) + '%' : '—';
  document.getElementById('strk-num').textContent = S.streak; document.getElementById('bstrk').textContent = 'Best: ' + S.bestStreak;
  const f = S.streak >= 20 ? '🔥🔥🔥🔥🔥' : S.streak >= 10 ? '🔥🔥🔥' : S.streak >= 5 ? '🔥🔥' : '🔥';
  document.getElementById('strk-fire').textContent = f;
  document.getElementById('strk-msg').textContent = S.streak >= 10 ? 'You\'re on FIRE!' : S.streak >= 5 ? 'Amazing! Keep going!' : S.streak >= 2 ? 'Great streak!' : 'Current streak';
  const mx = Math.max(...SUBS.map(s => (S.ex[s] || { t: 0 }).t), 1);
  document.getElementById('prog-bars').innerHTML = SUBS.map(sub => {
    const d = S.ex[sub] || { c: 0, t: 0 }; const pct = d.t ? Math.round(d.c / d.t * 100) : 0;
    return `<div class="pbr"><div class="pbn">${sub}</div><div class="pbt"><div class="pbf" style="width:${Math.round(d.t / mx * 100)}%;background:${SCOL[sub]}"></div></div><div class="pbp">${d.t ? pct + '%' : '—'}</div></div>`;
  }).join('');
  document.getElementById('prog-bdg').innerHTML = BADGES.map(b => { const e = S.earnedBadges.includes(b.id); return `<div class="bdg${e ? ' e' : ''}"><span class="bdi">${b.icon}</span><div class="bdn">${b.name}</div></div>`; }).join('');
  document.getElementById('prog-rec').innerHTML = S.recentEx.length ? S.recentEx.map(q => `<div class="rlit"><span class="rltag">${q.sub}</span><span class="rltx">${q.correct ? '✅' : '❌'} ${esc(q.q)}</span></div>`).join('') : `<p style="color:var(--muted);font-size:12px;padding:6px 0">Go to Exercises to start practicing!</p>`;
}

/* ══ BADGES ══ */
function checkBadges() {
  let ch = false;
  BADGES.forEach(b => {
    if (!S.earnedBadges.includes(b.id) && b.chk(S)) {
      S.earnedBadges.push(b.id); ch = true;
      addBub('ai', `You just earned the **${b.icon} ${b.name}** badge! Incredible!`, { lessonType: 'Badge!' });
      speakDirect(`Amazing! You earned a new badge: ${b.name}!`);
    }
  });
  if (ch) saveS();
}
