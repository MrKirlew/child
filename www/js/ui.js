/* ══ UI ══ */
/* globals: S, SUBS, SCOL, saveS, updProg, updScoreBar, addBub, speak, speakDirect, VIZ, hashPin, esc, sendLiveText, connectLive, sendL, aiGenerate, checkBadges */

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
  document.querySelectorAll('#lwr [data-lw]').forEach(e => e.classList.toggle('on', parseInt(e.dataset.lw, 10) === (S.listenWait || 30)));
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
  // Send through Live API if connected, otherwise REST fallback
  if (sendLiveText(txt, { userVisibleText: txt })) return;
  // REST fallback
  sendL(txt);
}

/* ══ SPELL CENTER ══ */
let _spellHistory = [];
(function _loadSpellHistory() { try { _spellHistory = JSON.parse(localStorage.getItem('kai5_spell') || '[]'); } catch (_e) { _spellHistory = []; } })();
function _saveSpellHistory() { try { localStorage.setItem('kai5_spell', JSON.stringify(_spellHistory.slice(0, 20))); } catch (_e) { /* quota */ } }

async function spellWord() {
  const inp = document.getElementById('spell-inp');
  const word = inp.value.trim().toLowerCase();
  if (!word) return;
  inp.value = '';
  const btn = document.getElementById('spell-btn'); btn.disabled = true;
  document.getElementById('spell-load').style.display = 'block';
  document.getElementById('spell-result').style.display = 'none';

  // Kick off the "word + letters + That's word" TTS immediately, in parallel
  // with the AI call. Child hears audio within ~1s, not 3–4s. Everything in
  // this initial clip is derivable from the word alone — no AI needed.
  const _t0 = performance.now();
  console.warn('[KiddoAI][timing] spellWord start word=' + word);
  const initialLetters = word.split('').join(', ');
  const initialSpeechPromise = speakDirect(`${word}. ${initialLetters}. That's ${word}.`).then(() => { console.warn('[KiddoAI][timing] initialSpeech done +' + Math.round(performance.now() - _t0) + 'ms'); });

  try {
    const grade = S.grade === 'K' ? 'kindergartner' : 'grade ' + S.grade + ' student';
    const prompt = `The child wants to learn the word "${word}". Return ONLY JSON: {"word":"${word}","letters":["c","a","t"],"meaning":"A short kid-friendly definition (1 sentence for a ${grade}).","phonics":"Break it into sounds with pronunciation guide, e.g. cat: k-ae-t (KAT). Show syllables and how to sound it out."}`;
    const raw = await aiGenerate(prompt, '', 250);
    console.warn('[KiddoAI][timing] aiGenerate done +' + Math.round(performance.now() - _t0) + 'ms');
    let result;
    try { result = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_e) { result = { word: word, letters: word.split(''), meaning: 'A great word to learn!', phonics: '' }; }
    _showSpellResult(result, word);
    // Save to history + badge count now that we have the full result.
    _spellHistory.unshift({ word: result.word || word, letters: result.letters || word.split(''), meaning: result.meaning || '', phonics: result.phonics || '' });
    if (_spellHistory.length > 20) _spellHistory.pop();
    _saveSpellHistory(); _renderSpellHistory();
    S.cnt.Spelling = (S.cnt.Spelling || 0) + 1; saveS(); checkBadges();
    // Wait for the initial speech to finish, then speak phonics + meaning
    // as a natural continuation. If the tail is empty (AI failed, no phonics
    // and no meaning), we silently skip — the initial speech already
    // delivered the core spelling ceremony.
    await initialSpeechPromise;
    const parts = [];
    if (result.phonics) parts.push(result.phonics + '.');
    if (result.meaning) parts.push('It means: ' + result.meaning);
    if (parts.length) speakDirect(parts.join(' '));
  } catch (e) {
    console.error('[KiddoAI] spellWord error:', e.message);
    document.getElementById('spell-meaning').textContent = 'Oops! Could not look up that word. Try again!';
    document.getElementById('spell-phonics').textContent = '';
    document.getElementById('spell-result').style.display = 'block';
  }
  document.getElementById('spell-load').style.display = 'none';
  btn.disabled = false;
}

function _showSpellResult(result, fallbackWord) {
  const word = result.word || fallbackWord;
  document.getElementById('spell-word').textContent = word;
  document.getElementById('spell-letters').innerHTML = (result.letters || word.split('')).map(l => `<div class="sp-letter">${esc(l)}</div>`).join('');
  document.getElementById('spell-meaning').innerHTML = '<strong>📖 Meaning:</strong> ' + esc(result.meaning || '');
  document.getElementById('spell-phonics').innerHTML = (result.phonics) ? '<strong>🔤 How to say it:</strong> ' + esc(result.phonics) : '';
  document.getElementById('spell-phonics').style.display = result.phonics ? 'block' : 'none';
  document.getElementById('spell-result').style.display = 'block';
}

function showSpellResult(idx) {
  if (idx < 0 || idx >= _spellHistory.length) return;
  const h = _spellHistory[idx];
  document.getElementById('spell-inp').value = '';
  _showSpellResult(h, h.word);
  const letters = (h.letters || h.word.split('')).join(', ');
  const phonicsLine = h.phonics ? ` ${h.phonics}.` : '';
  const meaningLine = h.meaning ? ` It means: ${h.meaning}` : '';
  speakDirect(`${h.word}. ${letters}. That's ${h.word}.${phonicsLine}${meaningLine}`);
}

// Lightweight replay — tapped from the 🔊 icon on a history tile.
// Speaks word + pronunciation + brief meaning from cached data. Does not
// re-render the detail view above.
function sayItAgain(idx) {
  if (idx < 0 || idx >= _spellHistory.length) return;
  const h = _spellHistory[idx];
  const phonicsLine = h.phonics ? ` ${h.phonics}.` : '';
  const meaningLine = h.meaning ? ` It means: ${h.meaning}` : '';
  speakDirect(`${h.word}.${phonicsLine}${meaningLine}`);
}

/* ══ SPELL MIC — say a word out loud ══ */
let _spellSR = null, _spellMicOn = false;
function togSpellMic() {
  if (_spellMicOn) { _stopSpellMic(); return; }
  // Android native
  if (NB.ok) {
    _spellMicOn = true;
    document.getElementById('spell-mic').textContent = '⏹';
    document.getElementById('spell-listening').style.display = 'block';
    window._spellMicActive = true;
    NB.call('startListening');
    return;
  }
  // Web Speech API fallback
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { document.getElementById('spell-listening').textContent = 'Speech not available on this device'; document.getElementById('spell-listening').style.display = 'block'; return; }
  _spellSR = new SR(); _spellSR.lang = 'en-US'; _spellSR.interimResults = true;
  _spellMicOn = true;
  document.getElementById('spell-mic').textContent = '⏹';
  document.getElementById('spell-listening').style.display = 'block';
  _spellSR.onresult = e => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('spell-listening').textContent = '🎤 Heard: ' + t;
    if (e.results[e.results.length - 1].isFinal) {
      _stopSpellMic();
      const word = t.trim();
      if (word) { document.getElementById('spell-inp').value = word; spellWord(); }
    }
  };
  _spellSR.onend = () => _stopSpellMic();
  _spellSR.onerror = () => { _stopSpellMic(); document.getElementById('spell-listening').textContent = ''; };
  _spellSR.start();
}
function _stopSpellMic() {
  if (_spellSR) _spellSR.stop(); _spellSR = null;
  _spellMicOn = false;
  window._spellMicActive = false;
  document.getElementById('spell-mic').textContent = '🎤';
  document.getElementById('spell-listening').style.display = 'none';
}

function _renderSpellHistory() {
  const el = document.getElementById('spell-history');
  if (!_spellHistory.length) { el.innerHTML = '<p style="color:var(--muted);font-size:12px;padding:6px 0">Type a word above to get started!</p>'; return; }
  el.innerHTML = _spellHistory.map((h, i) => `<div class="sp-hist"><div class="sp-hist-body" data-sp-action="show" data-sp-idx="${i}" role="button" tabindex="0"><div class="sp-hw">${esc(h.word)}</div><div class="sp-hm">${esc(h.meaning)}</div></div><button type="button" class="sp-hist-play" data-sp-action="say" data-sp-idx="${i}" aria-label="Say ${esc(h.word)} again">🔊</button></div>`).join('');
  // Delegated click listener — attached once, survives re-renders. Cleaner
  // than inline onclick per tile (no string-eval inside attributes, easier
  // to extend with keyboard activation, single source of truth for actions).
  if (!el._delegateInstalled) {
    el.addEventListener('click', (ev) => {
      const trg = ev.target.closest('[data-sp-action]');
      if (!trg) return;
      const idx = parseInt(trg.getAttribute('data-sp-idx'), 10);
      if (isNaN(idx)) return;
      const action = trg.getAttribute('data-sp-action');
      if (action === 'say') { ev.stopPropagation(); sayItAgain(idx); }
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
