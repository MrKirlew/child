/* ══ PROGRESS TAB ══ */
/* globals: S, SUBS, SCOL, BADGES, esc, saveS, addBub, speakDirect */

function updProg() {
  // Per-subject ACTIVITY (cross-tab): Learn (ai.js::recordLearnActivity),
  // Exercises (exercises.js::finishEx), and Spell (ui.js::spellWord) each
  // increment S.cnt[subject], so the bars now reflect total engagement
  // across every tab rather than only graded exercise completion. Accuracy
  // stays derived from S.ex because only exercises have a correct/wrong
  // dimension.
  const act = {};
  SUBS.forEach(s => { act[s] = Math.max((S.cnt && S.cnt[s]) || 0, (S.ex[s] || { t: 0 }).t); });
  const tot = SUBS.reduce((a, s) => a + act[s], 0);
  const cor = Object.values(S.ex).reduce((a, b) => a + b.c, 0);
  const exTot = Object.values(S.ex).reduce((a, b) => a + b.t, 0);
  document.getElementById('pt-t').textContent = tot; document.getElementById('pt-c').textContent = cor;
  document.getElementById('pt-a').textContent = exTot ? Math.round(cor / exTot * 100) + '%' : '—';
  document.getElementById('strk-num').textContent = S.streak; document.getElementById('bstrk').textContent = 'Best: ' + S.bestStreak;
  const f = S.streak >= 20 ? '🔥🔥🔥🔥🔥' : S.streak >= 10 ? '🔥🔥🔥' : S.streak >= 5 ? '🔥🔥' : '🔥';
  document.getElementById('strk-fire').textContent = f;
  document.getElementById('strk-msg').textContent = S.streak >= 10 ? 'You\'re on FIRE!' : S.streak >= 5 ? 'Amazing! Keep going!' : S.streak >= 2 ? 'Great streak!' : 'Current streak';
  const mx = Math.max(...SUBS.map(s => act[s]), 1);
  document.getElementById('prog-bars').innerHTML = SUBS.map(sub => {
    const ex = S.ex[sub] || { c: 0, t: 0 };
    // Show accuracy where exercises have been done for this subject;
    // otherwise show total activity count (e.g., "5×" for 5 Learn turns).
    const label = ex.t ? Math.round(ex.c / ex.t * 100) + '%' : act[sub] ? act[sub] + '×' : '—';
    return `<div class="pbr"><div class="pbn">${sub}</div><div class="pbt"><div class="pbf" style="width:${Math.round(act[sub] / mx * 100)}%;background:${SCOL[sub]}"></div></div><div class="pbp">${label}</div></div>`;
  }).join('');
  document.getElementById('prog-bdg').innerHTML = BADGES.map(b => { const e = S.earnedBadges.includes(b.id); return `<div class="bdg${e ? ' e' : ''}"><span class="bdi">${b.icon}</span><div class="bdn">${b.name}</div></div>`; }).join('');
  // Recent activity — interleaved exercise (✅/❌), learn (💬), and spell (🔤) entries.
  // Interleave by index since none of the sources carry timestamps; the
  // result groups newest-per-source on top, which keeps cross-tab activity
  // visible on a glance.
  const recEx = (S.recentEx || []).map(r => ({ sub: r.sub, icon: r.correct ? '✅' : '❌', q: r.q }));
  const recQ = (S.recentQ || []).map(r => ({ sub: r.sub, icon: '💬', q: r.q }));
  const recSp = (function () {
    try { return (JSON.parse(localStorage.getItem('kai5_spell') || '[]') || []).map(h => ({ sub: 'Spelling', icon: '🔤', q: h.word || '' })); } catch (_e) { return []; }
  })();
  const merged = [];
  const maxLen = Math.max(recEx.length, recQ.length, recSp.length);
  for (let i = 0; i < maxLen && merged.length < 12; i++) {
    if (recEx[i]) merged.push(recEx[i]);
    if (recQ[i] && merged.length < 12) merged.push(recQ[i]);
    if (recSp[i] && merged.length < 12) merged.push(recSp[i]);
  }
  document.getElementById('prog-rec').innerHTML = merged.length
    ? merged.map(q => `<div class="rlit"><span class="rltag">${q.sub}</span><span class="rltx">${q.icon} ${esc(q.q)}</span></div>`).join('')
    : `<p style="color:var(--muted);font-size:12px;padding:6px 0">Tap any tab to start — your activity shows up here!</p>`;
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
