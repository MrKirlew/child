/* ══ UI ══ */
/* globals: S, SUBS, SCOL, saveS, updProg, updScoreBar, addBub, speak, speakDirect, VIZ, hashPin, esc, sendLiveText, connectLive, sendL, aiGenerate, checkBadges, SpellTools */

function showTab(t) { ['learn', 'ex', 'spell', 'prog'].forEach(id => { document.getElementById('tab-' + id).classList.toggle('on', id === t); document.getElementById('tb-' + id).classList.toggle('on', id === t); }); if (t === 'prog') updProg(); }
function setMode(m) { S.mode = m; saveS(); document.body.className = (m === 'normal' || m === 'excited') ? '' : 'mode-' + m; document.querySelectorAll('[data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === m)); }
function setDiff(d) { S.diff = d; saveS(); document.querySelectorAll('[data-d]').forEach(e => e.classList.toggle('on', e.dataset.d === d)); }
function setListenWait(s) { S.listenWait = s; saveS(); document.querySelectorAll('[data-lw]').forEach(e => e.classList.toggle('on', parseInt(e.dataset.lw, 10) === s)); }
function pickGrade(g) { S.grade = g; S.chatHist = []; saveS(); document.getElementById('glbl').textContent = g; document.querySelectorAll('#gpr .pl').forEach(e => e.classList.toggle('on', e.dataset.g === g)); }
function closeAll() {
  // Release the parent-dashboard live-sync subscription before the modal
  // is hidden. Skipping this would leak progBus listeners across opens.
  const dash = document.getElementById('ov-dash');
  if (dash && dash.__progSub && typeof progBus !== 'undefined') {
    progBus.off('activity', dash.__progSub);
    dash.__progSub = null;
  }
  document.querySelectorAll('.ov').forEach(o => o.classList.remove('open'));
}
function openGrade() { document.querySelectorAll('#gpr .pl').forEach(e => e.classList.toggle('on', e.dataset.g === S.grade)); document.getElementById('ov-grade').classList.add('open'); }
function openPin() { document.getElementById('pin-inp').value = ''; document.getElementById('pin-err').textContent = ''; document.getElementById('ov-pin').classList.add('open'); }

async function chkPin() {
  const entered = document.getElementById('pin-inp').value;
  const enteredHash = await hashPin(entered);
  if (enteredHash === S.pin) { closeAll(); openDash(); }
  else document.getElementById('pin-err').textContent = 'Wrong PIN. Try again!';
}

// Last N days, oldest → newest. Each entry: { day: 'YYYY-MM-DD', count: n }.
// Used by the parent-dash sparkline and the kid-side streak history modal.
function _last14Days(state) {
  const out = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const buckets = (state.dailyCnt && state.dailyCnt[day]) || {};
    const count = Object.values(buckets).reduce((a, b) => a + b, 0);
    out.push({ day, count });
  }
  return out;
}

// Render an inline SVG sparkline of the last 7 days' total activity.
function _renderSparkline(state, w, h) {
  const days = _last14Days(state).slice(-7);
  const max = Math.max(1, ...days.map(d => d.count));
  const stepX = w / Math.max(1, days.length - 1);
  const pts = days.map((d, i) => {
    const x = i * stepX;
    const y = h - (d.count / max) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastY = days.length ? (h - (days[days.length - 1].count / max) * (h - 4) - 2) : h / 2;
  return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="7-day activity">`
    + `<polyline fill="none" stroke="var(--purple)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`
    + `<circle cx="${(days.length - 1) * stepX}" cy="${lastY.toFixed(1)}" r="2.5" fill="var(--purple)"/>`
    + `</svg>`;
}

function _dashTimeSince(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diff = Math.max(0, Date.now() - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + 'm ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h ago';
  const day = Math.floor(hr / 24);
  if (day < 7) return day + 'd ago';
  return Math.floor(day / 7) + 'w ago';
}

function _renderDash() {
  const tot = Object.values(S.ex).reduce((a, b) => a + b.t, 0);
  const cor = Object.values(S.ex).reduce((a, b) => a + b.c, 0);
  const accuracy = tot ? Math.round(cor / tot * 100) + '%' : '—';
  const lastActive = _dashTimeSince(S.lastActiveAt);
  const dailyTokens = _getDailyTokens();
  const tokenWarn = dailyTokens > 50000 ? `<div style="background:rgba(245,158,11,.12);border:1.5px solid rgba(245,158,11,.3);border-radius:10px;padding:8px;margin-bottom:8px;font-size:11px;font-weight:700;color:#D97706;text-align:center">High usage today: ~${Math.round(dailyTokens / 1000)}k tokens</div>` : '';
  document.getElementById('d-stats').innerHTML = tokenWarn
    + `<div class="sc2"><div class="sn2">${tot}</div><div class="sl2">Exercises</div></div>`
    + `<div class="sc2"><div class="sn2">${accuracy}</div><div class="sl2">Accuracy</div></div>`
    + `<div class="sc2"><div class="sn2">${S.earnedBadges.length}</div><div class="sl2">Badges</div></div>`
    + `<div class="sc2"><div class="sn2">${S.bestStreak}</div><div class="sl2">Best Streak</div></div>`
    + `<div class="sc2"><div class="sn2">Gr.${S.grade}</div><div class="sl2">Grade</div></div>`
    + `<div class="sc2"><div class="sn2">${lastActive}</div><div class="sl2">Last Active</div></div>`;
  document.querySelectorAll('#mpr [data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === (S.mode || 'normal')));
  document.querySelectorAll('#dpr [data-d]').forEach(e => e.classList.toggle('on', e.dataset.d === S.diff));
  document.querySelectorAll('#lwr [data-lw]').forEach(e => e.classList.toggle('on', parseInt(e.dataset.lw, 10) === (S.listenWait || 60)));
  // Subject performance: accuracy% where available, raw count otherwise.
  // Compute weakest subject (≥3 tries) so we can flag it for parent.
  let weakest = null; let worstAcc = 101;
  for (const sub of SUBS) {
    const ex = S.ex[sub] || { c: 0, t: 0 };
    if (ex.t < 3) continue;
    const acc = (ex.c / ex.t) * 100;
    if (acc < worstAcc) { worstAcc = acc; weakest = sub; }
  }
  const mx = Math.max(...SUBS.map(s => Math.max((S.cnt && S.cnt[s]) || 0, (S.ex[s] || { t: 0 }).t)), 1);
  // 7-day activity sparkline header above the per-subject bars.
  const days7 = _last14Days(S).slice(-7);
  const total7 = days7.reduce((a, d) => a + d.count, 0);
  const sparkHTML = `<div class="dash-spark"><div class="spark-row"><span class="spark-lbl">Last 7 days</span><span class="spark-tot">${total7} action${total7 === 1 ? '' : 's'}</span></div>${_renderSparkline(S, 280, 32)}</div>`;
  document.getElementById('d-bars').innerHTML = sparkHTML + SUBS.map(sub => {
    const ex = S.ex[sub] || { c: 0, t: 0 };
    const activity = Math.max((S.cnt && S.cnt[sub]) || 0, ex.t);
    const acc = ex.t ? Math.round(ex.c / ex.t * 100) + '%' : (activity ? activity + '×' : '—');
    const pill = (sub === weakest) ? ' <span class="needs-prac">💪 needs practice</span>' : '';
    return `<div class="brc"><div class="brn">${sub}${pill}</div><div class="brt"><div class="brf" style="width:${Math.round(activity / mx * 100)}%;background:${SCOL[sub]}"></div></div><div class="brv">${acc}</div></div>`;
  }).join('');
  // Math skill drilldown — only render when the child has touched any math.
  const mskBox = document.getElementById('d-math');
  if (mskBox) {
    const mskCnt = (S.cnt && S.cnt.MathSkills) || {};
    const mskTotal = MATH_SKILLS.reduce((a, k) => a + (mskCnt[k] || 0), 0);
    if (mskTotal > 0) {
      const mskMax = Math.max(...MATH_SKILLS.map(k => mskCnt[k] || 0), 1);
      mskBox.innerHTML = `<div class="ds" style="margin-top:8px">🔢 Math skills</div>` + MATH_SKILLS.map(skill => {
        const n = mskCnt[skill] || 0;
        const w = Math.round((n / mskMax) * 100);
        return `<div class="brc msk-row" data-skill="${esc(skill)}" tabindex="0" role="button" aria-label="Practice ${esc(skill)} now"><div class="brn">${MATH_EMOJI[skill] || ''} ${skill}</div><div class="brt"><div class="brf" style="width:${w}%;background:${SCOL.Math}"></div></div><div class="brv">${n || '—'}</div></div>`;
      }).join('');
    } else {
      mskBox.innerHTML = '';
    }
  }
}

function openDash() {
  _renderDash();
  document.getElementById('ov-dash').classList.add('open');
  // Live sync: re-render whenever an activity event fires while the
  // dashboard is open. Captured to a handle on the modal so we can
  // unsubscribe cleanly when it closes.
  if (typeof progBus !== 'undefined') {
    const dash = document.getElementById('ov-dash');
    if (dash && !dash.__progSub) {
      dash.__progSub = _renderDash;
      progBus.on('activity', dash.__progSub);
    }
  }
}

// closeAll() above releases the dashboard's progBus subscription before
// hiding the modal — see the inline comment in closeAll for details.

/* ══ STREAK HISTORY MODAL ══
 * Tap the streak number on the Progress tab → see last 14 days as
 * filled/empty circles. Pulls from S.dailyCnt (populated by progBus
 * recordActivity).
 */
function openStreakHistory() {
  const grid = document.getElementById('streak-grid');
  if (!grid) return;
  const days = _last14Days(S);
  grid.innerHTML = days.map(d => {
    const date = new Date(d.day);
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const dn = date.getDate();
    const cls = d.count > 0 ? 'sk-day sk-on' : 'sk-day sk-off';
    return `<div class="${cls}"><div class="sk-circle">${d.count > 0 ? '🔥' : '·'}</div><div class="sk-wd">${wd}</div><div class="sk-dn">${dn}</div></div>`;
  }).join('');
  document.getElementById('ov-streak').classList.add('open');
}

// Delegated click handler for the math-skill drilldown rows in the parent
// dashboard. Tapping a row routes the child into Exercises with that
// skill preselected — same bidirectional pattern as the kid Progress tab.
document.addEventListener('click', function (ev) {
  const row = ev.target.closest('#d-math .msk-row[data-skill]');
  if (!row) return;
  const skill = row.dataset.skill;
  if (typeof pickExSub === 'function') pickExSub('Math');
  if (typeof pickMathSkill === 'function') pickMathSkill(skill);
  if (typeof showTab === 'function') showTab('ex');
  closeAll();
});

/* ══ HEADER STREAK INDICATOR + PULSE ══
 * Updates whenever an activity event fires. Shown as soon as streak >= 1;
 * pulses on every correct answer when streak >= 5 (gives the child a
 * dopamine cue without spamming).
 */
function _updateHeaderStreak(payload) {
  const wrap = document.getElementById('hdr-strk');
  const num = document.getElementById('hdr-strk-num');
  if (!wrap || !num) return;
  num.textContent = String(S.streak || 0);
  if ((S.streak || 0) >= 1) wrap.style.display = 'flex'; else wrap.style.display = 'none';
  if (payload && payload.correct && (S.streak || 0) >= 5) {
    wrap.classList.remove('pulse'); // restart animation if already running
    void wrap.offsetWidth; // force reflow
    wrap.classList.add('pulse');
  }
}

/* ══ TOAST RAIL ══
 * Lightweight transient banner for "5 wrong in a row" hints and similar.
 * Auto-dismisses after `ms` (default 4500). Multiple toasts stack.
 */
function showToast(text, opts) {
  const rail = document.getElementById('toast-rail');
  if (!rail) return;
  const ms = (opts && opts.ms) || 4500;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = text;
  rail.appendChild(node);
  // Force a reflow so the entry transition fires.
  void node.offsetWidth;
  node.classList.add('toast-in');
  setTimeout(() => {
    node.classList.remove('toast-in');
    node.classList.add('toast-out');
    setTimeout(() => node.remove(), 350);
  }, ms);
}

/* ══ 5-WRONG-IN-A-ROW HINT ══
 * Consecutive-wrong tracker per subject. progBus emits 'activity' with
 * { sub, kind, correct } from finishEx. We increment _wrongStreak[sub]
 * on wrong (kind=='exercise'), reset on correct. Hitting 5 fires a
 * single toast — _toastShown[sub] tracks the last-shown timestamp so
 * we don't re-fire within 5 minutes (avoid spamming a struggling child).
 */
(function _wireWrongStreakToast() {
  if (typeof progBus === 'undefined' || progBus._wrongStreakBound) return;
  const COOLDOWN_MS = 5 * 60 * 1000;
  progBus.on('activity', function (p) {
    if (!p || p.kind !== 'exercise') return;
    const sub = p.sub || 'this subject';
    S._wrongStreak = S._wrongStreak || {};
    S._toastShown = S._toastShown || {};
    if (p.correct) {
      S._wrongStreak[sub] = 0;
      return;
    }
    S._wrongStreak[sub] = (S._wrongStreak[sub] || 0) + 1;
    if (S._wrongStreak[sub] >= 5) {
      const now = Date.now();
      const last = S._toastShown[sub] || 0;
      if (now - last >= COOLDOWN_MS) {
        S._toastShown[sub] = now;
        showToast(`Let's try a different ${sub} angle — tap "New Exercise" for a fresh question!`, { ms: 5500 });
        S._wrongStreak[sub] = 0; // reset so we don't fire on every wrong after 5
      }
    }
  });
  progBus._wrongStreakBound = true;
})();

/* ══ HEADER STREAK BUS WIRING ══ */
(function _wireHeaderStreak() {
  if (typeof progBus === 'undefined' || progBus._hdrStreakBound) return;
  progBus.on('activity', _updateHeaderStreak);
  progBus._hdrStreakBound = true;
  // Also seed it once on load so a cold open with persisted streak shows
  // the indicator immediately.
  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') _updateHeaderStreak({});
    else document.addEventListener('DOMContentLoaded', () => _updateHeaderStreak({}));
  }
})();
function openChgPin() { closeAll(); document.getElementById('p1').value = ''; document.getElementById('p2').value = ''; document.getElementById('chpe').textContent = ''; document.getElementById('ov-chpin').classList.add('open'); }

async function saveChgPin() {
  const a = document.getElementById('p1').value, b = document.getElementById('p2').value;
  if (a.length !== 4) { document.getElementById('chpe').textContent = 'PIN must be 4 digits.'; return; }
  if (a !== b) { document.getElementById('chpe').textContent = 'PINs do not match!'; return; }
  S.pin = await hashPin(a);
  saveS(); closeAll(); addBub('ai', 'Parent PIN updated!', {});
}

/* ══ TYPED MESSAGE (Learn tab) ══ */
async function sendTyped() {
  const inp = document.getElementById('linp');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  // Typed spelling requests should use the deterministic spell flow even when
  // the Learn websocket is already warm.
  if (SpellTools.extractSpellTarget(txt)) {
    sendL(txt);
    return;
  }
  // Send through Live API if connected, otherwise REST fallback
  if (sendLiveText(txt, { userVisibleText: txt })) return;
  // REST fallback
  sendL(txt);
}

/* ══ SPELL CENTER ══ */
let _spellHistory = [];
(function _loadSpellHistory() { try { _spellHistory = JSON.parse(localStorage.getItem('kai5_spell') || '[]'); } catch (_e) { _spellHistory = []; } })();
function _saveSpellHistory() { try { localStorage.setItem('kai5_spell', JSON.stringify(_spellHistory.slice(0, 20))); } catch (_e) { /* quota */ } }

// Generation counter — incremented every time a new spell ceremony starts.
// A running ceremony captures its own generation; if a newer one starts,
// the older one bails on its next await tick. Prevents a double-tap from
// queueing two overlapping audio sequences.
let _spellSpeechGen = 0;

// Letter NAMES (polysyllabic English pronunciations) for the spell phase.
// Sending raw single letters to TTS — even comma-separated — causes the
// engine to collapse them back into the spelled word ("L, A, D, D, E, R."
// came out as "ladder"). Letter names like "ell" and "dee" can't be
// merged that way, so the child actually hears the spelling.
// Comma separators still let adjacent names bleed into English ("bee,
// you" → "beauty"; "ee, ar" → "ear"), so the ceremony joins names with
// periods inside a single TTS call. Gemini treats each period-terminated
// name as its own utterance and inserts ~600ms of silence between them
// — measured at 10 silence gaps for a 9-letter word — which separates
// the letters without the per-letter HTTP fetch pulsing that slow:true
// produces.
const _LETTER_NAMES = {
  a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee',
  h: 'aitch', i: 'eye', j: 'jay', k: 'kay', l: 'ell', m: 'em', n: 'en',
  o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you',
  v: 'vee', w: 'double you', x: 'ex', y: 'why', z: 'zee'
};

async function lookupSpellWord(inputWord) {
  const word = SpellTools.cleanSpellWord(inputWord);
  if (!word) throw new Error('Invalid spell word');
  const grade = S.grade === 'K' ? 'kindergartner' : 'grade ' + S.grade + ' student';
  const prompt = `The child wants to learn how to spell the word "${word}". Return ONLY JSON: {"word":"${word}","letters":["c","a","t"],"meaning":"A short kid-friendly definition for the exact word ${word}. Do not misspell or rename the word. Do not start the definition with '${word} is' or '${word} means'."}`;
  const raw = await aiGenerate(prompt, '', 200);
  return SpellTools.parseSpellLookup(raw, word);
}

// Pre-recorded letter-name clips live at audio/letters/{a..z}.wav — one
// file per letter, generated with Google Translate TTS (gTTS) and
// Gemini-multimodal-verified. Playing static files removes TTS from the
// spelling loop entirely: zero possibility of phonetic merging
// ("bee, you" → "beauty"), zero network dependency, zero prompt-engineer
// gambling. The Kore voice still speaks the whole word + meaning; only
// the letter-recital uses these clips.
function _playLetterClip(letter) {
  return new Promise((resolve) => {
    const ch = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(ch)) { resolve(false); return; }
    const a = new Audio('audio/letters/' + ch + '.wav');
    let done = false;
    const finish = (ok) => { if (done) return; done = true; resolve(ok); };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    // Safety net: a 4s watchdog in case the element never fires end (each
    // clip is <1.1s, so 4s is very generous and prevents wedging on an
    // unexpected playback error).
    setTimeout(() => finish(true), 4000);
    try { const p = a.play(); if (p && typeof p.then === 'function') p.catch(() => finish(false)); }
    catch (_e) { finish(false); }
  });
}

async function _playLetterClips(canonicalLetters, alive) {
  let anyPlayed = false;
  for (const letter of canonicalLetters) {
    if (!alive()) return anyPlayed;
    const ok = await _playLetterClip(letter);
    if (ok) { anyPlayed = true; await new Promise(r => setTimeout(r, 120)); }
    else {
      // Single clip failed to load — break and let caller fall back to
      // Gemini TTS for the remainder. Keeps spelling working even on a
      // partially corrupt asset bundle.
      return anyPlayed;
    }
  }
  return anyPlayed;
}

// Spell ceremony — minimal, deterministic, three steps:
//   1. SPELL the word — static pre-recorded letter clips (gTTS voice,
//      Google-verified). Falls back to Gemini TTS if clips unavailable.
//   2. SAY the word once at normal cadence (Gemini, Kore voice).
//   3. DEFINE: speak the brief meaning (Gemini, Kore voice).
// Calling this also stops any in-flight audio so a re-tap always starts fresh.
async function runSpellCeremony(word, letters, meaningPromise) {
  try { stopAll(); } catch (_e) { /* noop */ }
  const myGen = ++_spellSpeechGen;
  const alive = () => myGen === _spellSpeechGen;
  const canonicalLetters = Array.isArray(letters) && letters.length
    ? letters.map(letter => String(letter || '').toLowerCase()).filter(Boolean)
    : String(word).toLowerCase().split('').filter(Boolean);
  const names = canonicalLetters.map(ch => _LETTER_NAMES[ch]).filter(Boolean);
  if (canonicalLetters.length) {
    const playedAll = await _playLetterClips(canonicalLetters, alive);
    // If clip playback started but didn't finish the whole word (a clip
    // was missing mid-way), let the user at least hear SOMETHING for the
    // remaining letters via Gemini TTS. If nothing played at all, assume
    // the static bundle is missing entirely and fall back in full.
    if (!playedAll && names.length && alive()) {
      await speakDirect(names.join('. ') + '.');
    }
    if (!alive()) return;
    await new Promise(r => setTimeout(r, 250));
  }
  if (!alive()) return;
  await speakDirect(word);
  let meaning = '';
  if (meaningPromise) {
    try { meaning = await meaningPromise; } catch (_e) { meaning = ''; }
  }
  if (meaning && alive()) {
    await new Promise(r => setTimeout(r, 250));
    if (!alive()) return;
    await speakDirect('It means: ' + meaning);
  }
}

async function spellWord() {
  const inp = document.getElementById('spell-inp');
  const word = SpellTools.cleanSpellWord(inp.value);
  if (!word) return;
  inp.value = '';
  const btn = document.getElementById('spell-btn'); btn.disabled = true;
  document.getElementById('spell-load').textContent = 'Ollie is saying it...';
  document.getElementById('spell-load').style.display = 'block';
  document.getElementById('spell-result').style.display = 'none';
  try { stopAll(); } catch (_e) { /* noop */ }

  try {
    const baseResult = SpellTools.buildSpellResult(word, '');
    _showSpellResult(baseResult, word, { pendingMeaning: true });
    const resultPromise = lookupSpellWord(word).catch((err) => {
      console.error('[Ollie] lookupSpellWord error:', err.message);
      return SpellTools.buildSpellResult(word, '');
    });
    const meaningPromise = resultPromise.then(result => {
      _showSpellResult(result, word);
      return result.meaning;
    });
    await runSpellCeremony(baseResult.word, baseResult.letters, meaningPromise);
    const result = await resultPromise;
    _spellHistory.unshift({ word: result.word || word, letters: result.letters || word.split(''), meaning: result.meaning || '' });
    if (_spellHistory.length > 20) _spellHistory.pop();
    _saveSpellHistory(); _renderSpellHistory();
    S.cnt.Spelling = (S.cnt.Spelling || 0) + 1;
    if (typeof progBus !== 'undefined') progBus.recordActivity(S, 'Spelling', 'spell');
    saveS(); checkBadges();
  } catch (e) {
    console.error('[Ollie] spellWord error:', e.message);
    document.getElementById('spell-meaning').textContent = 'Oops! Could not look up that word. Try again!';
    document.getElementById('spell-result').style.display = 'block';
  }
  document.getElementById('spell-load').style.display = 'none';
  btn.disabled = false;
}

function _showSpellResult(result, fallbackWord, opts) {
  const word = result.word || fallbackWord;
  document.getElementById('spell-word').textContent = word;
  document.getElementById('spell-letters').innerHTML = (result.letters || word.split('')).map(l => `<div class="sp-letter">${esc(l)}</div>`).join('');
  const pendingMeaning = opts && opts.pendingMeaning;
  document.getElementById('spell-meaning').innerHTML = pendingMeaning
    ? '<strong>📖 Meaning:</strong> Ollie is finding the meaning...'
    : '<strong>📖 Meaning:</strong> ' + esc(result.meaning || '');
  // Phonics row is no longer shown — the spell ceremony is intentionally
  // limited to spell + say + define. Hide unconditionally so any old
  // history entry that still has a phonics field doesn't render it.
  const ph = document.getElementById('spell-phonics');
  if (ph) { ph.innerHTML = ''; ph.style.display = 'none'; }
  document.getElementById('spell-result').style.display = 'block';
}

async function showSpellResult(idx) {
  if (idx < 0 || idx >= _spellHistory.length) return;
  const h = _spellHistory[idx];
  document.getElementById('spell-inp').value = '';
  _showSpellResult(h, h.word);
  await runSpellCeremony(h.word, h.letters, Promise.resolve(h.meaning));
}

// Lightweight replay — tapped from the 🔊 icon on a history tile. Same
// minimal ceremony: spell, say, define.
async function sayItAgain(idx) {
  if (idx < 0 || idx >= _spellHistory.length) return;
  const h = _spellHistory[idx];
  await runSpellCeremony(h.word, h.letters, Promise.resolve(h.meaning));
}

/* ══ SPELL MIC — say a word out loud ══
 * Holds the mic open for the full 60-second talk window. Accumulates the
 * Spell mic was removed in favor of the system keyboard's voice button —
 * the Android SpeechRecognizer plays an unsuppressable system tone on each
 * start, and the on-end auto-restart pattern compounded that into a beep
 * loop the child heard while the countdown ran. The placeholder on the
 * spell input now points kids at the keyboard mic icon as the voice path.
 *
 * Stubs for togSpellMic + window state below keep any straggling external
 * references (third-party scripts, accidental cap-sync residue) from
 * crashing — they're no-ops.
 */
window._spellMicOn = false;
window._spellMicActive = false;
window._spellFinalized = true;
window._spellTranscript = '';
window._spellRestarts = 0;
window._SPELL_MAX_RESTARTS = 0;
window._finalizeSpell = function () { /* noop — spell mic removed */ };
function togSpellMic() { /* noop — spell mic removed */ }

function _deleteSpellWord(idx) {
  if (idx < 0 || idx >= _spellHistory.length) return;
  const word = _spellHistory[idx].word || '';
  if (!window.confirm(`Delete "${word}" from your word list?`)) return;
  _spellHistory.splice(idx, 1);
  _saveSpellHistory();
  _renderSpellHistory();
}

function _clearSpellHistory() {
  if (!_spellHistory.length) return;
  if (!window.confirm(`Delete ALL ${_spellHistory.length} word${_spellHistory.length === 1 ? '' : 's'} from your word list? This cannot be undone.`)) return;
  _spellHistory = [];
  _saveSpellHistory();
  _renderSpellHistory();
}

function _renderSpellHistory() {
  const el = document.getElementById('spell-history');
  if (!_spellHistory.length) { el.innerHTML = '<p style="color:var(--muted);font-size:12px;padding:6px 0">Type a word above to get started!</p>'; return; }
  const tiles = _spellHistory.map((h, i) => `<div class="sp-hist"><div class="sp-hist-body" data-sp-action="show" data-sp-idx="${i}" role="button" tabindex="0"><div class="sp-hw">${esc(h.word)}</div><div class="sp-hm">${esc(h.meaning)}</div></div><button type="button" class="sp-hist-play" data-sp-action="say" data-sp-idx="${i}" aria-label="Say ${esc(h.word)} again">🔊</button><button type="button" class="sp-hist-del" data-sp-action="delete" data-sp-idx="${i}" aria-label="Delete ${esc(h.word)}">✕</button></div>`).join('');
  const clearBtn = `<button type="button" class="sp-hist-clear" data-sp-action="clear-all" aria-label="Delete all words">🗑 Clear all</button>`;
  el.innerHTML = tiles + clearBtn;
  // Delegated click listener — attached once, survives re-renders.
  if (!el._delegateInstalled) {
    el.addEventListener('click', (ev) => {
      const trg = ev.target.closest('[data-sp-action]');
      if (!trg) return;
      const action = trg.getAttribute('data-sp-action');
      if (action === 'clear-all') { ev.stopPropagation(); _clearSpellHistory(); return; }
      const idx = parseInt(trg.getAttribute('data-sp-idx'), 10);
      if (isNaN(idx)) return;
      if (action === 'say') { ev.stopPropagation(); sayItAgain(idx); }
      else if (action === 'delete') { ev.stopPropagation(); _deleteSpellWord(idx); }
      else if (action === 'show') { showSpellResult(idx); }
    });
    el._delegateInstalled = true;
  }
}

/* ══ COPPA CONSENT ══ */
document.getElementById('coppa-chk').addEventListener('change', function () {
  const btn = document.getElementById('coppa-btn'); btn.disabled = !this.checked; btn.style.opacity = this.checked ? '1' : '.5';
});
function acceptCoppa() { if (!document.getElementById('coppa-chk').checked) return; S.coppaConsent = true; saveS(); document.getElementById('ov-coppa').classList.remove('open'); startApp(); }

/* ══ INIT ══ */
async function startApp() {
  document.getElementById('glbl').textContent = S.grade;
  document.querySelectorAll('[data-d]').forEach(e => e.classList.toggle('on', e.dataset.d === S.diff));
  VIZ.ini(); updScoreBar(); updProg(); _renderSpellHistory(); renderExSubs();
  setMode(S.mode || 'normal');
  // Instant readiness — no API call on startup, no waiting for Ollie to greet
  document.getElementById('slbl').textContent = 'Tap 🎤 to talk to Ollie';
  addBub('ai', 'Hi! I\'m Ollie the Owl! Tap the 🎤 button to talk to me, or go to Exercises and Spell for fun practice!', { lessonType: 'Welcome' });
}
(function init() {
  if (S.coppaConsent) { startApp(); }
  else { document.getElementById('ov-coppa').classList.add('open'); }
})();
