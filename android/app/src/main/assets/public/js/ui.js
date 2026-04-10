/* ══ UI ══ */
/* globals: S, SUBS, SCOL, saveS, updProg, updScoreBar, addBub, speak, VIZ, hashPin */

function showTab(t) { ['learn', 'ex', 'spell', 'prog'].forEach(id => { document.getElementById('tab-' + id).classList.toggle('on', id === t); document.getElementById('tb-' + id).classList.toggle('on', id === t); }); if (t === 'prog') updProg(); }
function setMode(m) { S.mode = m; saveS(); document.body.className = m === 'exciting' ? '' : 'mode-' + m; document.querySelectorAll('[data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === m)); }
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
  document.querySelectorAll('#mpr [data-mode]').forEach(e => e.classList.toggle('on', e.dataset.mode === (S.mode || 'exciting')));
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
  try {
    const prompt = `The child typed the word "${word}". Spell it out letter by letter and give a short kid-friendly meaning (1 sentence for a ${S.grade === 'K' ? 'kindergartner' : 'grade ' + S.grade + ' student'}). Return ONLY JSON: {"word":"${word}","letters":["c","a","t"],"meaning":"A small furry pet that purrs."}`;
    const raw = await aiGenerate(prompt, '', 200);
    let result;
    try { result = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_e) { result = { word: word, letters: word.split(''), meaning: 'A great word to learn!' }; }
    // Display result
    document.getElementById('spell-word').textContent = result.word || word;
    document.getElementById('spell-letters').innerHTML = (result.letters || word.split('')).map(l => `<div class="sp-letter">${esc(l)}</div>`).join('');
    document.getElementById('spell-meaning').textContent = result.meaning || '';
    document.getElementById('spell-result').style.display = 'block';
    // Speak it
    speak(`${word}. ${(result.letters || word.split('')).join(', ')}. ${word}. ${result.meaning || ''}`);
    // Add to history
    _spellHistory.unshift({ word: result.word || word, meaning: result.meaning || '' });
    if (_spellHistory.length > 20) _spellHistory.pop();
    _saveSpellHistory();
    _renderSpellHistory();
    // Track for badges
    S.cnt.Spelling = (S.cnt.Spelling || 0) + 1; saveS(); checkBadges();
  } catch (e) {
    console.error('[KiddoAI] spellWord error:', e.message);
    document.getElementById('spell-meaning').textContent = 'Oops! Could not look up that word. Try again!';
    document.getElementById('spell-result').style.display = 'block';
  }
  document.getElementById('spell-load').style.display = 'none';
  btn.disabled = false;
}

function _renderSpellHistory() {
  const el = document.getElementById('spell-history');
  if (!_spellHistory.length) { el.innerHTML = '<p style="color:var(--muted);font-size:12px;padding:6px 0">Type a word above to get started!</p>'; return; }
  el.innerHTML = _spellHistory.map(h => `<div class="sp-hist" onclick="document.getElementById('spell-inp').value='${esc(h.word)}';spellWord()"><div class="sp-hw">${esc(h.word)}</div><div class="sp-hm">${esc(h.meaning)}</div></div>`).join('');
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
  VIZ.ini(); updScoreBar(); updProg(); _renderSpellHistory();
  setMode(S.mode || 'exciting');
  const welcomeMsg = 'Hi superstar! I\'m Ollie the Owl! Tap the microphone button to talk to me about anything, or go to Exercises for fun quizzes!';
  // Connect Live API and have Ollie speak — transcript creates the single chat bubble
  try {
    document.getElementById('slbl').textContent = 'Connecting to Ollie...';
    await connectLive();
    document.getElementById('slbl').textContent = 'Tap 🎤 to talk to Ollie';
    sendLiveText('Read this message exactly to the child, word for word: ' + welcomeMsg, { addUserBubble: false, trackHistory: false });
  } catch (_e) {
    document.getElementById('slbl').textContent = 'Tap 🎤 to talk to Ollie';
    addBub('ai', welcomeMsg, { lessonType: 'Welcome' });
    speak(welcomeMsg);
  }
}
(function init() {
  if (S.coppaConsent) { startApp(); }
  else { document.getElementById('ov-coppa').classList.add('open'); }
})();
