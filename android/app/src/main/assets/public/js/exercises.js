/* ══ EXERCISE SYSTEM ══ */
/* globals: S, SUBS, EX_SUBS, EX_EMOJI, SCOL, GN, CUREX, aiGenerate, speakDirect, esc, reportError, saveS, checkBadges */
let CUREX = null;

// System prompt for exercise generation — gives AI context about the educational app
const EXSYS = 'You are an exercise generator for a STEM tutoring app for children. Generate age-appropriate, curriculum-aligned exercises. The child cannot see images or diagrams — all content must work as spoken text. Return ONLY valid JSON, no markdown, no explanation.';

// System prompt for answer checking — generous and encouraging
const CHKSYS = 'You are an answer checker for a children\'s STEM tutoring app. Be generous with minor spelling, capitalization, and wording differences. The child may have spoken their answer aloud, so phonetic misspellings count as correct. Return ONLY valid JSON.';

/* ══ SUBJECT SELECTOR ══ */
function renderExSubs() {
  const el = document.getElementById('ex-subs');
  el.innerHTML = EX_SUBS.map(sub =>
    `<div class="exs${sub === S.exSubject ? ' on' : ''}" data-sub="${sub}" onclick="pickExSub('${sub}')" style="${sub === S.exSubject ? 'background:' + SCOL[sub] : ''}">${EX_EMOJI[sub]} ${sub}</div>`
  ).join('');
}
function pickExSub(sub) {
  S.exSubject = sub; saveS(); renderExSubs();
}

const EXPM = () => {
  const sub = S.exSubject || 'Math';
  const typeHint = (sub === 'Comprehension' || sub === 'Grammar') ? 'prefer "voice_answer" or "fill_blank"'
    : sub === 'Math' ? 'prefer "multiple_choice" or "fill_blank"'
    : 'prefer "multiple_choice" or "voice_answer"';
  return `Generate ONE ${sub} exercise for Grade ${S.grade}, difficulty ${S.diff}.
${GN[S.grade]}
Subject: ${sub}. ${typeHint}.
IMPORTANT: All questions must work when read aloud. No diagrams, no images, no "look at" references.
Return ONLY this JSON (include ALL fields for the chosen type):
For multiple_choice: {"type":"multiple_choice","question":"clear question","options":["A","B","C","D"],"correct_index":0,"correct_answer":"the correct option text","hint":"short hint","explanation":"encouraging explanation","subject_emoji":"${EX_EMOJI[sub] || '🎯'}","detectedSubject":"${sub}"}
For fill_blank: {"type":"fill_blank","question":"context question","sentence":"The ___ sat on the mat.","blank_word":"cat","correct_answer":"cat","hint":"short hint","explanation":"encouraging explanation","subject_emoji":"${EX_EMOJI[sub] || '🎯'}","detectedSubject":"${sub}"}
For voice_answer: {"type":"voice_answer","question":"clear question to answer verbally","correct_answer":"expected answer","hint":"short hint","explanation":"encouraging explanation","passage":"optional reading passage for comprehension","subject_emoji":"${EX_EMOJI[sub] || '🎯'}","detectedSubject":"${sub}"}`;
}; // EXPM v5 — 2026-04-11

const CHKPM = (q, correct, given) => `Grade ${S.grade} ${(CUREX && CUREX.detectedSubject) || 'General'}. Question: ${q}. Correct answer: ${correct}. Child's answer: ${given}.
Is the child's answer essentially correct? Accept minor spelling, phrasing, and synonym differences.
Return ONLY JSON: {"correct":true,"feedback":"1-2 encouraging sentences","explanation":"brief teaching note if wrong"}`; // CHKPM v3 — 2026-04-11

async function newEx() {
  CUREX = null;
  const nb = document.getElementById('exnew'); nb.disabled = true;
  document.getElementById('exload').style.display = 'block';
  document.getElementById('exfb').style.display = 'none';
  ['mcopts', 'fbwrap', 'vawrap'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('exsubmit').style.display = 'none';
  document.getElementById('exnext').style.display = 'none';
  document.getElementById('vatr').textContent = ''; document.getElementById('fbinp').value = '';
  [0, 1, 2, 3].forEach(i => { const e = document.getElementById('o' + i); e.className = 'mco'; e.textContent = ''; });
  try {
    const raw = await aiGenerate(EXPM(), EXSYS, 400);
    let ex; try { ex = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_e) { document.getElementById('exq').textContent = 'Could not generate exercise. Check connection.'; nb.disabled = false; document.getElementById('exload').style.display = 'none'; return; }
    CUREX = ex; renderEx(ex);
  } catch (_e) { document.getElementById('exq').textContent = 'Connection error. Check your API key.'; }
  nb.disabled = false; document.getElementById('exload').style.display = 'none';
}

function renderEx(ex) {
  if (!ex || !ex.type || !ex.question) {
    document.getElementById('exq').textContent = 'Exercise failed to load. Try again!';
    document.getElementById('exnew').style.display = 'block'; return;
  }
  if (ex.type === 'multiple_choice' && (!Array.isArray(ex.options) || ex.options.length < 2 || typeof ex.correct_index !== 'number')) {
    document.getElementById('exq').textContent = 'Exercise failed to load. Try again!';
    document.getElementById('exnew').style.display = 'block'; return;
  }
  const exSub = (ex.detectedSubject && SUBS.includes(ex.detectedSubject)) ? ex.detectedSubject : 'Comprehension';
  const tag = document.getElementById('extag');
  tag.textContent = (ex.subject_emoji || '🎯') + ' ' + exSub + ' · Grade ' + S.grade + ' · ' + S.diff;
  tag.style.background = SCOL[exSub] || '#7C3AED';
  document.getElementById('expassage').style.display = 'none';
  if (ex.passage) { const ep = document.getElementById('expassage'); ep.textContent = ex.passage; ep.style.display = 'block'; }
  document.getElementById('exfb').style.display = 'none';
  document.getElementById('exnext').style.display = 'none';
  document.getElementById('exnew').style.display = 'block';
  if (ex.type === 'multiple_choice') {
    document.getElementById('exq').textContent = ex.question;
    document.getElementById('mcopts').style.display = 'grid';
    ex.options.forEach((opt, i) => { const e = document.getElementById('o' + i); e.className = 'mco'; e.textContent = String.fromCharCode(65 + i) + '. ' + opt; });
    document.getElementById('exsubmit').style.display = 'none';
    speakDirect(ex.question);
  } else if (ex.type === 'fill_blank') {
    document.getElementById('exq').textContent = ex.sentence || ex.question;
    document.getElementById('fbwrap').style.display = 'block';
    document.getElementById('vawrap').style.display = 'block';
    document.getElementById('vahint').textContent = 'Type or speak the missing word 🎤';
    document.getElementById('exsubmit').style.display = 'block';
    speakDirect(ex.sentence || ex.question);
  } else {
    document.getElementById('exq').textContent = ex.question;
    document.getElementById('fbwrap').style.display = 'block';
    document.getElementById('vawrap').style.display = 'block';
    document.getElementById('vahint').textContent = 'Speak or type your answer 🎤';
    document.getElementById('exsubmit').style.display = 'block';
    speakDirect(ex.question);
  }
}

function pickMC(idx) {
  if (!CUREX || CUREX.type !== 'multiple_choice') return;
  const ok = CUREX.correct_index === idx;
  [0, 1, 2, 3].forEach(i => {
    const e = document.getElementById('o' + i);
    if (i === idx) e.classList.add(ok ? 'ok' : 'ng');
    else if (i === CUREX.correct_index && !ok) e.classList.add('rv');
  });
  finishEx(ok, CUREX.explanation || '', CUREX.options[CUREX.correct_index]);
}

function submitFB() {
  if (!CUREX) return;
  const ans = document.getElementById('fbinp').value.trim() || document.getElementById('vatr').textContent.trim();
  if (!ans) { speakDirect('Please type or say your answer first!'); return; }
  checkVoice(ans);
}

function handleVoiceAns(txt) {
  if (!CUREX) return;
  if (CUREX.type === 'multiple_choice') {
    const t = txt.toLowerCase(); const letters = ['a', 'b', 'c', 'd']; let idx = -1;
    for (let i = 0; i < 4; i++) { if (t.includes(letters[i]) || (CUREX.options[i] && t.includes(CUREX.options[i].toLowerCase()))) idx = i; }
    if (idx >= 0) pickMC(idx); else speakDirect('I heard: ' + txt + '. Try saying A, B, C, or D!');
  } else checkVoice(txt);
}

async function checkVoice(given) {
  const sb = document.getElementById('exsubmit'); if (sb) sb.disabled = true;
  document.getElementById('exload').style.display = 'block';
  const ca = CUREX.correct_answer || CUREX.blank_word || '';
  try {
    const raw = await aiGenerate(CHKPM(CUREX.question || CUREX.sentence, ca, given), CHKSYS, 100);
    let chk; try { chk = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_e) { chk = { correct: false, feedback: 'Could not check answer.', explanation: '' }; }
    finishEx(chk.correct, chk.explanation || chk.feedback || '', ca);
  } catch (_e) { finishEx(false, 'Connection error. Try again!', ca); }
  document.getElementById('exload').style.display = 'none';
  if (sb) sb.disabled = false;
}

function finishEx(ok, explanation, correctAns) {
  if (ok) { S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); } else { S.streak = 0; }
  // Hide input areas — exercise is answered, show only feedback + next
  document.getElementById('exsubmit').style.display = 'none';
  document.getElementById('fbwrap').style.display = 'none';
  document.getElementById('vawrap').style.display = 'none';
  const fb = document.getElementById('exfb');
  fb.className = ok ? 'ok' : 'ng';
  fb.innerHTML = ok ? ('✅ ' + (S.streak >= 5 ? '🔥 On fire! ' : '') + 'Correct! ' + (explanation || 'Great job!'))
    : ('❌ Not quite! Answer: <strong>' + esc(String(correctAns)) + '</strong>. ' + (explanation || 'Keep trying! You\'re doing great!'));
  fb.style.display = 'block';
  const exSub = (CUREX && CUREX.detectedSubject && SUBS.includes(CUREX.detectedSubject)) ? CUREX.detectedSubject : 'Comprehension';
  if (!S.ex[exSub]) S.ex[exSub] = { c: 0, t: 0 };
  S.ex[exSub].t++; S.totalEx++; if (ok) S.ex[exSub].c++;
  S.cnt[exSub] = (S.cnt[exSub] || 0) + 1;
  S.recentEx.unshift({ sub: exSub, correct: ok, q: (CUREX.question || CUREX.sentence || '').substring(0, 45) });
  if (S.recentEx.length > 12) S.recentEx.pop();
  saveS(); checkBadges(); updScoreBar();
  speakDirect(fb.textContent.replace(/[✅❌🔥💪]/g, '').substring(0, 200));
  document.getElementById('exnext').style.display = 'block';
  document.getElementById('exnew').style.display = 'none';
}

function nextEx() { document.getElementById('exnext').style.display = 'none'; document.getElementById('exnew').style.display = 'block'; newEx(); }
function resetSess() { if (!confirm('Reset all exercise scores?')) return; SUBS.forEach(s => S.ex[s] = { c: 0, t: 0 }); S.streak = 0; S.bestStreak = 0; S.totalEx = 0; S.recentEx = []; saveS(); updScoreBar(); updProg(); }

function updScoreBar() {
  const tot = Object.values(S.ex).reduce((a, b) => a + b.t, 0), cor = Object.values(S.ex).reduce((a, b) => a + b.c, 0);
  document.getElementById('sc-c').textContent = cor; document.getElementById('sc-t').textContent = tot;
  document.getElementById('sc-p').textContent = tot ? Math.round(cor / tot * 100) + '%' : '—'; document.getElementById('sc-b').textContent = S.bestStreak;
  document.getElementById('ss').textContent = S.streak;
  const sb = document.getElementById('strk-badge'); sb.className = S.streak >= 5 ? 'hot' : '';
  sb.innerHTML = (S.streak >= 15 ? '🔥🔥🔥' : S.streak >= 5 ? '🔥🔥' : '🔥') + ' <span id="ss">' + S.streak + '</span>';
}
