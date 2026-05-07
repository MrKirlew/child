/* ══ PROGRESS TAB ══ */
/* globals: S, SUBS, SCOL, BADGES, esc, saveS, addBub, speakDirect,
            showTab, pickExSub, pickMathSkill, spellWord, progBus */

// Pure helpers (also exported for vitest). Kept above updProg so the bus
// listener registration at the bottom can reference them.

// Per-subject accuracy: c / t when there are graded tries, else null.
function _accuracyForSub(state, sub) {
  const ex = (state.ex && state.ex[sub]) || { c: 0, t: 0 };
  if (!ex.t) return null;
  return Math.round((ex.c / ex.t) * 100);
}

// Subject with the lowest accuracy among those that have ≥ MIN_TRIES tries.
// Returns null if no subject has enough samples — we don't shame a subject
// with a single wrong answer.
function _weakestSubject(state, MIN_TRIES = 3) {
  let worst = null; let worstAcc = 101;
  for (const sub of (Object.keys(state.ex || {}))) {
    const ex = state.ex[sub];
    if (!ex || ex.t < MIN_TRIES) continue;
    const acc = (ex.c / ex.t) * 100;
    if (acc < worstAcc) { worstAcc = acc; worst = sub; }
  }
  return worst;
}

// Human-readable "time since" — kept short so it fits in a stat tile.
function _timeSince(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + 'm ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h ago';
  const day = Math.floor(hr / 24);
  if (day < 7) return day + 'd ago';
  const wk = Math.floor(day / 7);
  return wk + 'w ago';
}

function updProg() {
  // Per-subject ACTIVITY (cross-tab): Learn (ai.js::recordLearnActivity),
  // Exercises (exercises.js::finishEx), and Spell (ui.js::spellWord) each
  // increment S.cnt[subject], so the bars now reflect total engagement
  // across every tab rather than only graded exercise completion. Accuracy
  // stays derived from S.ex because only exercises have a correct/wrong
  // dimension.
  if (!document.getElementById('prog-bars')) return;
  const act = {};
  SUBS.forEach(s => { act[s] = Math.max((S.cnt && S.cnt[s]) || 0, (S.ex[s] || { t: 0 }).t); });
  const tot = SUBS.reduce((a, s) => a + act[s], 0);
  const cor = Object.values(S.ex).reduce((a, b) => a + b.c, 0);
  const exTot = Object.values(S.ex).reduce((a, b) => a + b.t, 0);
  document.getElementById('pt-t').textContent = tot;
  document.getElementById('pt-c').textContent = cor;
  document.getElementById('pt-a').textContent = exTot ? Math.round(cor / exTot * 100) + '%' : '—';
  document.getElementById('strk-num').textContent = S.streak;
  document.getElementById('bstrk').textContent = 'Best: ' + S.bestStreak;
  const f = S.streak >= 20 ? '🔥🔥🔥🔥🔥' : S.streak >= 10 ? '🔥🔥🔥' : S.streak >= 5 ? '🔥🔥' : '🔥';
  document.getElementById('strk-fire').textContent = f;
  document.getElementById('strk-msg').textContent = S.streak >= 10 ? 'You\'re on FIRE!' : S.streak >= 5 ? 'Amazing! Keep going!' : S.streak >= 2 ? 'Great streak!' : 'Current streak';

  const mx = Math.max(...SUBS.map(s => act[s]), 1);
  // Subject bars are now tappable — child taps a subject to jump straight
  // into Exercises with that subject preselected. data-sub carries the
  // routing target; the delegated listener at the bottom of this file
  // does the navigation.
  document.getElementById('prog-bars').innerHTML = SUBS.map(sub => {
    const ex = S.ex[sub] || { c: 0, t: 0 };
    const label = ex.t ? Math.round(ex.c / ex.t * 100) + '%' : act[sub] ? act[sub] + '×' : '—';
    const tappable = act[sub] > 0 || ex.t > 0;
    const cls = 'pbr' + (tappable ? ' pbr-tap' : '');
    const dataAttr = tappable ? ` data-sub="${esc(sub)}" tabindex="0" role="button" aria-label="Practice ${esc(sub)} now"` : '';
    return `<div class="${cls}"${dataAttr}><div class="pbn">${sub}</div><div class="pbt"><div class="pbf" style="width:${Math.round(act[sub] / mx * 100)}%;background:${SCOL[sub]}"></div></div><div class="pbp">${label}</div></div>`;
  }).join('');

  document.getElementById('prog-bdg').innerHTML = BADGES.map(b => {
    const e = S.earnedBadges.includes(b.id);
    const cls = 'bdg' + (e ? ' e' : '') + ' bdg-tap';
    return `<div class="${cls}" data-badge="${esc(b.id)}" tabindex="0" role="button" aria-label="${e ? 'Earned' : 'Locked'} badge: ${esc(b.name)}"><span class="bdi">${b.icon}</span><div class="bdn">${b.name}</div></div>`;
  }).join('');

  // Recent activity — interleaved exercise (✅/❌), learn (💬), and spell (🔤) entries.
  // Each item carries data-* describing how a tap should re-engage the child
  // with the originating tab.
  const recEx = (S.recentEx || []).map(r => ({ kind: 'exercise', sub: r.sub, icon: r.correct ? '✅' : '❌', q: r.q || '' }));
  const recQ = (S.recentQ || []).map(r => ({ kind: 'learn', sub: r.sub, icon: '💬', q: r.q || '' }));
  const recSp = (function () {
    try { return (JSON.parse(localStorage.getItem('kai5_spell') || '[]') || []).map(h => ({ kind: 'spell', sub: 'Spelling', icon: '🔤', q: h.word || '' })); } catch (_e) { return []; }
  })();
  const merged = [];
  const maxLen = Math.max(recEx.length, recQ.length, recSp.length);
  for (let i = 0; i < maxLen && merged.length < 12; i++) {
    if (recEx[i]) merged.push(recEx[i]);
    if (recQ[i] && merged.length < 12) merged.push(recQ[i]);
    if (recSp[i] && merged.length < 12) merged.push(recSp[i]);
  }
  document.getElementById('prog-rec').innerHTML = merged.length
    ? merged.map(q => `<div class="rlit rlit-tap" data-kind="${q.kind}" data-sub="${esc(q.sub)}" data-q="${esc(q.q)}" tabindex="0" role="button" aria-label="${q.kind} ${esc(q.q)}"><span class="rltag">${esc(q.sub)}</span><span class="rltx">${q.icon} ${esc(q.q)}</span></div>`).join('')
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

/* ══ Bidirectional taps + live sync ══
 * One delegated click listener on #tab-prog handles all tap targets
 * (subject bars, badges, recent items). Cheaper than per-element handlers
 * and survives the innerHTML rerender from updProg().
 */
function _onProgClick(ev) {
  const target = ev.target.closest('[data-sub], [data-badge], [data-kind]');
  if (!target) return;
  // Recent-activity item — route to originating tab and re-engage.
  if (target.dataset.kind) {
    const kind = target.dataset.kind;
    const q = target.dataset.q || '';
    if (kind === 'exercise') {
      // Re-speak the question; child can also tap "New Exercise" themselves.
      if (typeof speakDirect === 'function' && q) speakDirect(q);
    } else if (kind === 'learn' && typeof showTab === 'function') {
      showTab('learn');
      const inp = document.getElementById('linp');
      if (inp) { inp.value = q; inp.focus(); }
    } else if (kind === 'spell' && typeof showTab === 'function') {
      showTab('spell');
      const inp = document.getElementById('spell-inp') || document.getElementById('spell-inp');
      if (inp) { inp.value = q; if (typeof spellWord === 'function') spellWord(); }
    }
    return;
  }
  // Badge tile — explain what unlocked it (or what's needed).
  if (target.dataset.badge) {
    const id = target.dataset.badge;
    const def = BADGES.find(b => b.id === id);
    if (!def) return;
    const earned = S.earnedBadges.includes(id);
    const msg = earned
      ? `🏆 ${def.icon} ${def.name} — earned!`
      : `🔒 ${def.icon} ${def.name} — keep practicing to unlock this!`;
    if (typeof addBub === 'function') addBub('ai', msg, { lessonType: 'Badges' });
    return;
  }
  // Subject bar — pick subject in Exercises and switch tabs.
  if (target.dataset.sub) {
    const sub = target.dataset.sub;
    if (typeof pickExSub === 'function') pickExSub(sub);
    if (sub === 'Math' && typeof pickMathSkill === 'function' && S.mathSkill) pickMathSkill(S.mathSkill);
    if (typeof showTab === 'function') showTab('ex');
  }
}

(function _bootProgress() {
  // Idempotent — guard against duplicate registration if this file is
  // reloaded by a hot-swap during dev.
  if (typeof document === 'undefined') return;
  const tab = document.getElementById('tab-prog');
  if (tab && !tab.__progClickWired) {
    tab.addEventListener('click', _onProgClick);
    tab.__progClickWired = true;
  }
  // Keyboard activation for accessibility — Enter/Space on a tap target
  // mimics a click. Same delegation pattern.
  if (tab && !tab.__progKeyWired) {
    tab.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const target = ev.target.closest('[data-sub], [data-badge], [data-kind]');
      if (!target) return;
      ev.preventDefault();
      _onProgClick({ target: ev.target });
    });
    tab.__progKeyWired = true;
  }
  // Live sync: re-render Progress tab on every recorded activity. Safe to
  // run while the tab is hidden — innerHTML swap is < 1ms.
  if (typeof progBus !== 'undefined' && !progBus._progressBound) {
    progBus.on('activity', updProg);
    progBus._progressBound = true;
  }
})();

// CommonJS export for vitest unit tests of the pure aggregation helpers.
// `module` is undefined in the browser, so this branch is a no-op there.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _accuracyForSub, _weakestSubject, _timeSince };
}
