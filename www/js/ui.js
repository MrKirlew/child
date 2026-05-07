/* ══ UI ══ */
/* globals: S, SUBS, SCOL, saveS, updProg, updScoreBar, addBub, speak, speakDirect, VIZ, hashPin, esc, sendLiveText, connectLive, sendL, aiGenerate, checkBadges, SpellTools */

function showTab(t) { ['learn', 'ex', 'spell', 'prog'].forEach(id => { document.getElementById('tab-' + id).classList.toggle('on', id === t); document.getElementById('tb-' + id).classList.toggle('on', id === t); }); if (t === 'prog') updProg(); }
function setMode(m) { S.mode = m; saveS(); document.body.className = (m === 'normal' || m === 'excited') ? '' : 'mode-' + m; document.querySelectorAll('[data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === m)); }
function setDiff(d) { S.diff = d; saveS(); document.querySelectorAll('[data-d]').forEach(e => e.classList.toggle('on', e.dataset.d === d)); }
function setListenWait(s) { S.listenWait = s; saveS(); document.querySelectorAll('[data-lw]').forEach(e => e.classList.toggle('on', parseInt(e.dataset.lw, 10) === s)); }
function pickGrade(g) { S.grade = g; S.chatHist = []; saveS(); document.getElementById('glbl').textContent = g; document.querySelectorAll('#gpr .pl').forEach(e => e.classList.toggle('on', e.dataset.g === g)); }
function closeAll() { document.querySelectorAll('.ov').forEach(o => o.classList.remove('open')); }
function openGrade() { document.querySelectorAll('#gpr .pl').forEach(e => e.classList.toggle('on', e.dataset.g === S.grade)); document.getElementById('ov-grade').classList.add('open'); }
function openPin() { document.getElementById('pin-inp').value = ''; document.getElementById('pin-err').textContent = ''; document.getElementById('ov-pin').classList.add('open'); }

async function chkPin() {
  const entered = document.getElementById('pin-inp').value;
  const enteredHash = await hashPin(entered);
  if (enteredHash === S.pin) { closeAll(); openDash(); }
  else document.getElementById('pin-err').textContent = 'Wrong PIN. Try again!';
}

function openDash() {
  const tot = Object.values(S.ex).reduce((a, b) => a + b.t, 0);
  const dailyTokens = _getDailyTokens();
  const tokenWarn = dailyTokens > 50000 ? `<div style="background:rgba(245,158,11,.12);border:1.5px solid rgba(245,158,11,.3);border-radius:10px;padding:8px;margin-bottom:8px;font-size:11px;font-weight:700;color:#D97706;text-align:center">High usage today: ~${Math.round(dailyTokens / 1000)}k tokens</div>` : '';
  document.getElementById('d-stats').innerHTML = tokenWarn + `<div class="sc2"><div class="sn2">${tot}</div><div class="sl2">Exercises</div></div><div class="sc2"><div class="sn2">${S.earnedBadges.length}</div><div class="sl2">Badges</div></div><div class="sc2"><div class="sn2">${S.bestStreak}</div><div class="sl2">Best Streak</div></div><div class="sc2"><div class="sn2">Gr.${S.grade}</div><div class="sl2">Grade</div></div>`;
  document.querySelectorAll('#mpr [data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === (S.mode || 'normal')));
  document.querySelectorAll('#dpr [data-d]').forEach(e => e.classList.toggle('on', e.dataset.d === S.diff));
  document.querySelectorAll('#lwr [data-lw]').forEach(e => e.classList.toggle('on', parseInt(e.dataset.lw, 10) === (S.listenWait || 60)));
  const mx = Math.max(...Object.values(S.ex).map(e => e.t), 1);
  document.getElementById('d-bars').innerHTML = SUBS.map(sub => { const d = S.ex[sub] || { c: 0, t: 0 }; return `<div class="brc"><div class="brn">${sub}</div><div class="brt"><div class="brf" style="width:${Math.round(d.t / mx * 100)}%;background:${SCOL[sub]}"></div></div><div class="brv">${d.t}</div></div>`; }).join('');
  document.getElementById('ov-dash').classList.add('open');
}
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
      await speakDirect(names.join('. ') + '.', { debugSource: 'Spell letters (fallback)' });
    }
    if (!alive()) return;
    await new Promise(r => setTimeout(r, 250));
  }
  if (!alive()) return;
  await speakDirect(word, { debugSource: 'Spell word' });
  let meaning = '';
  if (meaningPromise) {
    try { meaning = await meaningPromise; } catch (_e) { meaning = ''; }
  }
  if (meaning && alive()) {
    await new Promise(r => setTimeout(r, 250));
    if (!alive()) return;
    await speakDirect('It means: ' + meaning, { debugSource: 'Spell meaning' });
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
    S.cnt.Spelling = (S.cnt.Spelling || 0) + 1; saveS(); checkBadges();
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
 * recognizer transcript; only finalizes on countdown expiry, manual tap-stop,
 * or fatal recognizer error. State lives on `window` so speech.js's Android
 * callbacks can reach it without cross-script `let` issues.
 */
let _spellSR = null;
window._spellMicOn = false;
window._spellTranscript = '';
window._spellFinalized = false;
window._spellRestarts = 0;
window._SPELL_MAX_RESTARTS = 3;
const _SPELL_TALK_SECONDS = 60;

function _spellCountdownStart(isAndroid) {
  if (typeof Countdown === 'undefined') return;
  const stage = document.getElementById('spell-mic-stage');
  if (!stage) return;
  Countdown.start({
    seconds: _SPELL_TALK_SECONDS,
    mountEl: stage,
    variant: 'spell',
    onExpire: () => { window._finalizeSpell(isAndroid); }
  });
}

window._finalizeSpell = function (isAndroid) {
  if (window._spellFinalized) return;
  window._spellFinalized = true;
  const word = (window._spellTranscript || '').trim();
  if (isAndroid) NB.call('stopListening');
  window._spellMicActive = false;
  _stopSpellMic();
  if (word) {
    document.getElementById('spell-inp').value = word;
    spellWord();
  }
};

function togSpellMic() {
  if (window._spellMicOn) { window._finalizeSpell(NB.ok); return; }
  window._spellTranscript = '';
  window._spellFinalized = false;
  window._spellRestarts = 0;
  const stage = document.getElementById('spell-mic-stage');
  if (stage) stage.classList.add('active');
  document.body.classList.add('listening-mode');
  // Android native
  if (NB.ok) {
    window._spellMicOn = true;
    document.getElementById('spell-mic').textContent = '⏹';
    document.getElementById('spell-listening').style.display = 'block';
    document.getElementById('spell-listening').textContent = '🎤 Listening...';
    window._spellMicActive = true;
    NB.call('startListening');
    _spellCountdownStart(true);
    return;
  }
  // Web Speech API fallback
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('spell-listening').textContent = 'Speech not available on this device';
    document.getElementById('spell-listening').style.display = 'block';
    if (stage) stage.classList.remove('active');
    document.body.classList.remove('listening-mode');
    return;
  }
  _spellSR = new SR();
  _spellSR.lang = 'en-US';
  _spellSR.interimResults = true;
  _spellSR.continuous = true;
  window._spellMicOn = true;
  document.getElementById('spell-mic').textContent = '⏹';
  document.getElementById('spell-listening').style.display = 'block';
  document.getElementById('spell-listening').textContent = '🎤 Listening...';
  _spellSR.onresult = e => {
    let combined = '';
    for (let i = 0; i < e.results.length; i++) combined += e.results[i][0].transcript;
    window._spellTranscript = combined;
    document.getElementById('spell-listening').textContent = '🎤 Heard: ' + combined;
  };
  _spellSR.onend = () => {
    if (window._spellMicOn && !window._spellFinalized && window._spellRestarts < window._SPELL_MAX_RESTARTS) {
      window._spellRestarts += 1;
      try { _spellSR.start(); } catch (_e) { window._finalizeSpell(false); }
    }
  };
  _spellSR.onerror = () => { window._finalizeSpell(false); };
  try { _spellSR.start(); } catch (_e) { window._finalizeSpell(false); }
  _spellCountdownStart(false);
}

function _stopSpellMic() {
  if (_spellSR) { try { _spellSR.stop(); } catch (_e) { /* recognizer already stopped */ } }
  _spellSR = null;
  window._spellMicOn = false;
  window._spellMicActive = false;
  document.getElementById('spell-mic').textContent = '🎤';
  document.getElementById('spell-listening').style.display = 'none';
  if (typeof Countdown !== 'undefined') Countdown.stop();
  const stage = document.getElementById('spell-mic-stage');
  if (stage) stage.classList.remove('active');
  document.body.classList.remove('listening-mode');
}

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
