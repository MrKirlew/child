/* ══ HOMEWORK HELPER — photo → Socratic guidance (Learn area) ══
 *
 * Premium-only feature. The child photographs a (possibly multi-page) paper
 * assignment; Gemini reads it ONCE (multimodal), then Ollie coaches the child
 * question-by-question. The answer stays LOCKED until the child has answered
 * every guiding question Ollie asked (checkpoints) for the current problem.
 *
 * Two-phase LLM flow — extract-once, then coach on text:
 *   1) analyze  : compressed page images → structured problem list (one vision call)
 *   2) coach    : cheap text turns, one guiding question at a time, answer-gated
 *
 * Images ride the existing /ai/generate Gemini pass-through (no new endpoint —
 * the project sits at the Vercel Hobby 12-function cap). A `feature:'homework'`
 * marker on the body triggers a server-side premium/entitlement check.
 *
 * Pure builders/guards are exported for unit tests (Node) via module.exports;
 * the DOM flow object is attached to window.HW for the browser.
 */
/* globals: S, GN, DN, AI_PROXY, esc, fmt, addBub, saveS, speak, stopAll, isPremium, showUpgrade, showToast, Safety, Logger, progBus, reportError */

(function () {
  'use strict';

  const MAX_PAGES = 6;
  const MAX_DIM = 1280;      // longest edge, px — keeps base64 payload under Vercel's body limit
  const JPEG_Q = 0.6;

  /* ── Pure builders / guards (testable) ───────────────────────────── */

  // System prompt for the ANALYZE (vision) call. Strict JSON, child-safe,
  // never leaks the answers into the extraction.
  const HWSYS_ANALYZE =
    "You are Ollie the Octopus, a warm, patient teacher for children (Kindergarten to Grade 6). " +
    "You are looking at photo(s) of a child's school assignment. Read every page carefully. " +
    "Decide if the image is really a child's school assignment, worksheet, or homework in a subject " +
    "like reading, spelling, grammar, writing, math, or science.\n" +
    "SAFETY: If the image is NOT a school assignment (a person/selfie, a toy, a random object, blank, " +
    "unreadable), or shows anything not appropriate for a young child, set isAssignment=false and give a " +
    "gentle, kind declineMessage inviting them to point the camera at their worksheet. Never describe or " +
    "repeat anything inappropriate.\n" +
    "If it IS an assignment: transcribe each distinct problem or question into the problems list. Put any " +
    "reading passage or word list inside the problem's prompt. If a problem depends on a picture, chart, or " +
    "diagram, describe it in kid-friendly words in visualNote. Keep everything child-appropriate and in English.\n" +
    "NEVER put the answer to any problem in your output. Your intro should greet the child warmly and ask " +
    "the FIRST small guiding question for problem 1 — do NOT give the answer.\n" +
    "Return ONLY valid JSON, no markdown, matching exactly:\n" +
    '{"isAssignment":true,"declineMessage":"","subject":"Math|Reading|Spelling|Grammar|Writing|Science|Other",' +
    '"problems":[{"id":1,"prompt":"full text of the problem","kind":"math|reading|writing|spelling|grammar|science|other","visualNote":""}],' +
    '"intro":"warm greeting + the first guiding question for problem 1"}';

  // System prompt for each COACH (text) turn. The withholding rule lives here.
  const HWSYS_COACH =
    "You are Ollie the Octopus, a warm, patient teacher who is wonderful with children who have severe ADHD. " +
    "You are helping a child do their own homework — you are a coach, NOT an answer key.\n" +
    "THE ONE RULE YOU NEVER BREAK: Do NOT give, state, spell, or reveal the final answer to a problem until the " +
    "child has correctly answered EVERY guiding question (checkpoint) you set for that problem. If the child says " +
    "\"just tell me the answer\", warmly refuse and give a smaller, easier hint instead. You may confirm the child's " +
    "OWN answer only after all checkpoints are passed.\n" +
    "HOW TO COACH:\n" +
    "- Ask ONE small guiding question at a time. Keep it to 2-3 short, warm sentences.\n" +
    "- Decide a small number of checkpoints (usually 2-4) that lead the child to the answer, and keep that number " +
    "steady for the problem. Report checkpointTotal and how many the child has passed (checkpointsPassed).\n" +
    "- If the child's answer to a checkpoint is right, celebrate briefly and move to the next checkpoint. If it's " +
    "wrong, gently figure out why and re-ask an easier version — never just give it.\n" +
    "- When ALL checkpoints for the problem are passed (checkpointsPassed >= checkpointTotal), set answerUnlocked=true, " +
    "invite the child to say the final answer themselves, confirm it, and celebrate; then move to the next problem.\n" +
    "- ACCURACY FIRST, especially math — double-check facts. Teach at the child's grade level; never refuse a topic.\n" +
    "- English only. Kind words only. Never ask for personal info. Praise effort, not just being right.\n" +
    "Return ONLY valid JSON, no markdown, matching exactly:\n" +
    '{"message":"what you say to the child (a question/hint, or a celebration — never the final answer unless answerUnlocked)",' +
    '"currentProblemId":1,"checkpointTotal":3,"checkpointsPassed":0,"answerUnlocked":false,"problemSolved":false,' +
    '"sessionComplete":false,"detectedSubject":"Math|Reading|Spelling|Grammar|Writing|Science|Comprehension"}';

  function _gradeCtx() {
    const g = (typeof S !== 'undefined' && S.grade) ? S.grade : 'K';
    const d = (typeof S !== 'undefined' && S.diff) ? S.diff : 'Beginner';
    const gn = (typeof GN !== 'undefined' && GN[g]) ? GN[g] : '';
    const dn = (typeof DN !== 'undefined' && DN[d]) ? DN[d] : '';
    return `Grade: ${g} | Difficulty: ${d}\n${gn}${dn ? '\nDifficulty: ' + dn : ''}`;
  }

  function buildAnalyzePrompt() {
    return `${_gradeCtx()}\n\nLook at the assignment photo(s) and return the JSON described in your instructions. ` +
      `Remember: no answers in your output, and your intro must ask the first guiding question, not give the answer.`;
  }

  function buildCoachPrompt(childMsg, problems, state, transcript) {
    const probs = Array.isArray(problems) ? problems : [];
    const st = state || {};
    const hist = Array.isArray(transcript) ? transcript.slice(-14) : [];
    const histStr = hist.map(m => (m.role === 'user' ? 'Child' : 'Ollie') + ': ' + m.content).join('\n');
    return `${_gradeCtx()}

THE ASSIGNMENT (already read from the child's photo):
${JSON.stringify(probs)}

You are currently helping with problem id ${st.curProblemId || 1}.
Checkpoints passed so far for this problem: ${st.checkpointsPassed || 0} of ${st.checkpointTotal || '(you decide)'}.

Conversation so far:
${histStr || '(none yet)'}

The child just said: "${String(childMsg || '').trim()}"

Coach the child per your rules and return ONLY the JSON. Do NOT reveal the final answer unless the child has passed every checkpoint for this problem.`;
  }

  function parseJSON(raw, fallback) {
    const s = String(raw || '').replace(/```json|```/g, '').trim();
    try { return JSON.parse(s); } catch (_e) { return fallback; }
  }

  // Sanity net around the model's self-reported gate: the answer can only be
  // "unlocked" once every checkpoint is passed. Never trust answerUnlocked=true
  // while checkpoints remain. (The real withholding is prompt-enforced; this
  // keeps the progress UI honest and blocks an accidental early unlock.)
  function enforceGate(p) {
    const o = p || {};
    const total = Math.max(0, parseInt(o.checkpointTotal, 10) || 0);
    const passed = Math.max(0, Math.min(total || Infinity, parseInt(o.checkpointsPassed, 10) || 0));
    const unlocked = total > 0 ? (passed >= total) : !!o.answerUnlocked;
    return {
      message: String(o.message || '').trim(),
      currentProblemId: parseInt(o.currentProblemId, 10) || 1,
      checkpointTotal: total,
      checkpointsPassed: passed,
      answerUnlocked: unlocked,
      problemSolved: !!o.problemSolved && unlocked,   // cannot be "solved" before the answer is unlocked
      sessionComplete: !!o.sessionComplete,
      detectedSubject: (o.detectedSubject && String(o.detectedSubject).trim()) || null
    };
  }

  // Build the multimodal `parts` array: image inline_data parts, then the text prompt.
  function assembleParts(promptText, pages) {
    const parts = (Array.isArray(pages) ? pages : []).map(pg => ({
      inline_data: { mime_type: pg.mime || 'image/jpeg', data: pg.data }
    }));
    parts.push({ text: String(promptText || '') });
    return parts;
  }

  // The POST body sent to /ai/generate. `feature:'homework'` triggers the
  // server-side premium check; sessionToken proves entitlement.
  function buildRequestBody(opts) {
    const o = opts || {};
    return {
      system_instruction: { parts: [{ text: o.systemPrompt || '' }] },
      contents: [{ role: 'user', parts: o.parts || [] }],
      generationConfig: {
        maxOutputTokens: o.maxTokens || 400,
        temperature: (o.temperature === null || o.temperature === undefined) ? 0.6 : o.temperature,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json'
      },
      feature: 'homework',
      sessionToken: o.sessionToken || null
    };
  }

  /* ── Network ─────────────────────────────────────────────────────── */

  // Returns { text } on success, or { blocked } / { premium } / throws on error.
  // Retries transient upstream failures (network drop, HTTP 5xx — including the
  // server's "All models unavailable" when a Gemini model briefly overloads)
  // TWICE with a short backoff before giving up, so a single blip doesn't
  // dead-end the child with a "hiccup". premium_required (→ upgrade) and safety
  // blocks are terminal and never retried; a genuine failure throws with the
  // HTTP status + server error so reportError → /api/errors → Sentry pinpoints it.
  async function callGenerate(body) {
    const proxy = (typeof AI_PROXY !== 'undefined' && AI_PROXY) ||
      (typeof window !== 'undefined' && window.AI_PROXY);
    if (!proxy) throw new Error('No AI proxy configured');
    let lastErr = 'request failed';
    for (let attempt = 0; attempt < 3; attempt++) {
      let r;
      try {
        r = await fetch(proxy + '/ai/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      } catch (netErr) {
        // Network drop / WebView connection reset — transient, retry.
        lastErr = 'network: ' + ((netErr && netErr.message) || netErr);
        if (attempt < 2) { await new Promise(res => setTimeout(res, 400 * (attempt + 1))); continue; }
        throw new Error(lastErr);
      }
      const data = await r.json().catch(() => ({}));
      if (data && data.error === 'premium_required') return { premium: true };
      if (data && data.blocked) return { blocked: true, reason: data.reason };
      if (r.ok && data && !data.error) {
        const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        return { text: text || '' };
      }
      // Error response — capture a precise, greppable reason (status + server error).
      const serverMsg = (data && data.error && (data.error.message || data.error)) || ('http-' + r.status);
      lastErr = 'http-' + r.status + ': ' + serverMsg;
      // Retry only transient upstream failures (5xx); 4xx (bad request / safety)
      // is terminal — the server's fallback model would reject it identically.
      if (r.status >= 500 && attempt < 2) { await new Promise(res => setTimeout(res, 400 * (attempt + 1))); continue; }
      throw new Error(lastErr);
    }
    throw new Error(lastErr);
  }

  /* ── Image capture / compression (browser only) ──────────────────── */

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = c.toDataURL('image/jpeg', JPEG_Q);
        resolve({ mime: 'image/jpeg', data: dataUrl.split(',')[1] || '', thumb: dataUrl });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  /* ── Voice answers (Web Speech STT) ──────────────────────────────── */

  function _getSR() {
    return (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // Android WebView needs the app's RECORD_AUDIO granted before Web Speech works.
  // Mirror speech.js's pattern (SpeechPlugin.requestMic). No-op on web browsers.
  async function _ensureMicPermission() {
    if (typeof window !== 'undefined' && window.IS_ANDROID && window.Capacitor &&
        window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechPlugin) {
      const r = await window.Capacitor.Plugins.SpeechPlugin.requestMic({});
      if (!r || !r.granted) throw new Error('mic denied');
    }
  }

  /* ── DOM helpers (scoped to the homework panel) ──────────────────── */

  function $(id) { return document.getElementById(id); }

  function hwTyp() {
    const sc = $('hw-chat'); if (!sc) return;
    const d = document.createElement('div');
    d.className = 'mr'; d.id = 'hw-td';
    d.innerHTML = '<div class="mav">🐙</div><div class="mb ai"><div class="tdots"><span></span><span></span><span></span></div></div>';
    sc.appendChild(d); sc.scrollTop = sc.scrollHeight;
  }
  function hwRmTyp() { const e = $('hw-td'); if (e) e.remove(); }

  function renderTray() {
    const tray = $('hw-tray'); if (!tray) return;
    tray.innerHTML = HW.pages.map((p, i) =>
      `<div class="hw-thumb"><img src="${p.thumb}" alt="Assignment page ${i + 1}"/>` +
      `<button class="hw-rm" onclick="HW.removePage(${i})" aria-label="Remove page ${i + 1}">✕</button>` +
      `<span class="hw-pg">${i + 1}</span></div>`
    ).join('');
    const start = $('hw-start');
    if (start) start.disabled = HW.pages.length < 1;
    const add = $('hw-add');
    if (add) add.disabled = HW.pages.length >= MAX_PAGES;
  }

  function renderProgress() {
    const el = $('hw-progress'); if (!el) return;
    const st = HW.state;
    const totalP = HW.problems.length || 1;
    const dots = [];
    for (let i = 0; i < st.checkpointTotal; i++) dots.push(i < st.checkpointsPassed ? '✅' : '◻️');
    const lock = st.answerUnlocked ? '🔓 Answer unlocked!' : '🔒 Answer locked until you finish Ollie\'s questions';
    el.innerHTML =
      `<div class="hw-prog-row"><strong>Problem ${Math.min(st.curProblemId, totalP)} of ${totalP}</strong>` +
      `<span class="hw-dots">${dots.join(' ')}</span></div>` +
      `<div class="hw-lock ${st.answerUnlocked ? 'open' : ''}">${lock}</div>`;
  }

  function showPhase(phase) {
    const cap = $('hw-capture'); const co = $('hw-coach'); const lbot = $('lbot');
    if (cap) cap.hidden = phase !== 'capture';
    if (co) co.hidden = phase !== 'coach';
    // Reuse the Learn input bar for typing answers during coaching; hide it (and
    // the Live mic, which isn't wired to homework) during capture.
    if (lbot) lbot.style.display = phase === 'coach' ? '' : 'none';
    const mic = $('lmic-stage'); if (mic) mic.style.display = phase === 'coach' ? 'none' : '';
    const hwmic = $('hw-mic'); if (hwmic) hwmic.hidden = phase !== 'coach';
  }

  /* ── Flow object (browser) ───────────────────────────────────────── */

  const HW = {
    active: false,
    pages: [],
    problems: [],
    subject: null,
    transcript: [],
    state: { curProblemId: 1, checkpointTotal: 0, checkpointsPassed: 0, answerUnlocked: false },
    micActive: false,
    _recog: null,
    _micText: '',
    _suppressMicSend: false,

    open() {
      if (typeof isPremium === 'function' && !isPremium()) {
        if (typeof showUpgrade === 'function') showUpgrade();
        return;
      }
      this.active = true;
      this.pages = []; this.problems = []; this.subject = null; this.transcript = [];
      this.state = { curProblemId: 1, checkpointTotal: 0, checkpointsPassed: 0, answerUnlocked: false };
      const chat = $('chat'); const viz = $('viz-card'); const open = $('hw-open'); const hw = $('hw');
      if (viz) viz.style.display = 'none';
      if (chat) chat.style.display = 'none';
      if (open) open.style.display = 'none';
      if (hw) hw.hidden = false;
      const hc = $('hw-chat'); if (hc) hc.innerHTML = '';
      const pr = $('hw-progress'); if (pr) pr.innerHTML = '';
      const dm = $('hw-decline'); if (dm) { dm.textContent = ''; dm.hidden = true; }
      renderTray();
      showPhase('capture');
    },

    close() {
      this.active = false;
      if (this.micActive) { this._suppressMicSend = true; this._stopMic(); this._finishMic(); }
      if (typeof stopAll === 'function') { try { stopAll(); } catch (_e) { /* ignore */ } }
      const chat = $('chat'); const viz = $('viz-card'); const open = $('hw-open'); const hw = $('hw');
      const lbot = $('lbot'); const mic = $('lmic-stage');
      if (hw) hw.hidden = true;
      if (viz) viz.style.display = '';
      if (chat) chat.style.display = '';
      if (open) open.style.display = '';
      if (lbot) lbot.style.display = '';
      if (mic) mic.style.display = '';
      const inp = $('linp'); if (inp) inp.placeholder = 'Type a message...';
    },

    pickPage() {
      if (this.pages.length >= MAX_PAGES) {
        if (typeof showToast === 'function') showToast(`That's the most pages (${MAX_PAGES})! Tap Start.`);
        return;
      }
      const f = $('hw-file'); if (f) { f.value = ''; f.click(); }
    },

    async onFiles(e) {
      const files = (e && e.target && e.target.files) ? Array.from(e.target.files) : [];
      for (const file of files) {
        if (this.pages.length >= MAX_PAGES) break;
        try { this.pages.push(await compressImage(file)); }
        catch (_err) { if (typeof showToast === 'function') showToast("That photo didn't work — try again."); }
      }
      renderTray();
    },

    removePage(i) { this.pages.splice(i, 1); renderTray(); },

    async start() {
      if (this.pages.length < 1) return;
      if (typeof isPremium === 'function' && !isPremium()) { if (typeof showUpgrade === 'function') showUpgrade(); return; }
      const start = $('hw-start'); const add = $('hw-add');
      const dm = $('hw-decline'); if (dm) { dm.textContent = ''; dm.hidden = true; }
      if (start) { start.disabled = true; start.textContent = 'Ollie is reading… 📖'; }
      if (add) add.disabled = true;
      try {
        const body = buildRequestBody({
          systemPrompt: HWSYS_ANALYZE,
          parts: assembleParts(buildAnalyzePrompt(), this.pages),
          sessionToken: (typeof S !== 'undefined' && S.sessionToken) || null,
          maxTokens: 1200, temperature: 0.2
        });
        const res = await callGenerate(body);
        if (res.premium) { if (typeof showUpgrade === 'function') showUpgrade(); return this._resetStart(); }
        if (res.blocked) return this._decline("Let's point the camera at your worksheet so I can help! 📄");
        const parsed = parseJSON(res.text, { isAssignment: false, declineMessage: '' });
        if (!parsed || !parsed.isAssignment) {
          return this._decline(parsed && parsed.declineMessage
            ? parsed.declineMessage
            : "Hmm, that doesn't look like a school assignment! Point the camera at your worksheet and try again. 📄");
        }
        this.problems = Array.isArray(parsed.problems) ? parsed.problems : [];
        this.subject = parsed.subject || 'Comprehension';
        this.state = { curProblemId: 1, checkpointTotal: 0, checkpointsPassed: 0, answerUnlocked: false };
        showPhase('coach');
        const intro = String(parsed.intro || "Let's start! What do you think we should do first?").trim();
        this.transcript.push({ role: 'assistant', content: intro });
        if (typeof addBub === 'function') addBub('ai', intro, {}, 'hw-chat');
        renderProgress();
        if (typeof speak === 'function') speak(intro);
        this._logActivity();
      } catch (err) {
        if (typeof reportError === 'function') reportError('homework', err.message, 'analyze');
        this._decline("Oops, I had a hiccup reading that. Let's try the photo again! 🐙");
      } finally {
        this._resetStart();
      }
    },

    _resetStart() {
      const start = $('hw-start'); const add = $('hw-add');
      if (start) { start.disabled = this.pages.length < 1; start.textContent = 'Start — help me! 🚀'; }
      if (add) add.disabled = this.pages.length >= MAX_PAGES;
    },

    _decline(msg) {
      showPhase('capture');
      const dm = $('hw-decline');
      if (dm) { dm.textContent = msg; dm.hidden = false; }
      else if (typeof showToast === 'function') showToast(msg);
    },

    async sendAnswer(txt) {
      const msg = String(txt || '').trim();
      if (!msg) return;
      // If a voice capture is still open (child tapped send mid-listen), close it
      // without letting its onend re-submit the same answer.
      if (this.micActive) { this._suppressMicSend = true; this._stopMic(); }
      // Pre-model input filter — never echo or send inappropriate words.
      if (typeof Safety !== 'undefined' && !Safety.checkInput(msg).allowed) {
        if (typeof Logger !== 'undefined') Logger.warn('safety.input_filtered', { path: 'homework' });
        if (typeof addBub === 'function') addBub('ai', Safety.safeNudge(), {}, 'hw-chat');
        return;
      }
      if (typeof addBub === 'function') addBub('user', msg, {}, 'hw-chat');
      this.transcript.push({ role: 'user', content: msg });
      hwTyp();
      try {
        const body = buildRequestBody({
          systemPrompt: HWSYS_COACH,
          parts: assembleParts(buildCoachPrompt(msg, this.problems, this.state, this.transcript), []),
          sessionToken: (typeof S !== 'undefined' && S.sessionToken) || null,
          maxTokens: 400, temperature: 0.6
        });
        const res = await callGenerate(body);
        hwRmTyp();
        if (res.premium) { if (typeof showUpgrade === 'function') showUpgrade(); return; }
        if (res.blocked) {
          const redirect = (typeof Safety !== 'undefined') ? Safety.safeRedirect() : "Let's try a different way! 🐙";
          if (typeof addBub === 'function') addBub('ai', redirect, {}, 'hw-chat');
          if (typeof speak === 'function') speak(redirect);
          return;
        }
        const gated = enforceGate(parseJSON(res.text, { message: res.text }));
        let out = gated.message;
        // Output moderation — defense in depth around Gemini safetySettings.
        if (out && typeof Safety !== 'undefined' && !Safety.checkOutput(out).safe) {
          if (typeof Logger !== 'undefined') Logger.warn('safety.output_filtered', { path: 'homework' });
          out = Safety.safeRedirect();
        }
        if (!out) out = "Let's keep going! What do you think the next step is?";
        this.state = {
          curProblemId: gated.currentProblemId,
          checkpointTotal: gated.checkpointTotal,
          checkpointsPassed: gated.checkpointsPassed,
          answerUnlocked: gated.answerUnlocked
        };
        this.transcript.push({ role: 'assistant', content: out });
        if (this.transcript.length > 20) this.transcript.splice(0, this.transcript.length - 20);
        if (typeof addBub === 'function') addBub('ai', out, {}, 'hw-chat');
        renderProgress();
        if (typeof speak === 'function') speak(out);
        this._logActivity();
        if (gated.sessionComplete) {
          const done = "🎉 You did it — you finished your homework all by yourself! I'm so proud of you!";
          if (typeof addBub === 'function') addBub('ai', done, {}, 'hw-chat');
          if (typeof speak === 'function') speak(done);
        }
      } catch (err) {
        hwRmTyp();
        if (typeof reportError === 'function') reportError('homework', err.message, 'coach');
        if (typeof addBub === 'function') addBub('ai', "Hmm, I had a hiccup! Try telling me again. 🐙", {}, 'hw-chat');
      }
    },

    // Tap-to-speak: capture ONE spoken answer via Web Speech, mirror the interim
    // transcript into the answer box, and on end route it through sendAnswer (same
    // path as typing → the answer-withholding gate is unchanged). Single-utterance,
    // no countdown auto-restart — that avoids the multi-beep bug the recognizer had.
    async toggleMic() {
      if (this.micActive) { this._stopMic(); return; }
      const SR = _getSR();
      if (!SR) {
        if (typeof showToast === 'function') showToast("Voice isn't available here — you can type your answer! 😊");
        return;
      }
      try { await _ensureMicPermission(); }
      catch (_e) {
        if (typeof showToast === 'function') showToast('I need permission to hear you — you can type instead! 😊');
        return;
      }
      // Stop Ollie's voice so the mic doesn't hear the TTS.
      if (typeof stopAll === 'function') { try { stopAll(); } catch (_e2) { /* ignore */ } }
      const inp = $('linp');
      let recog;
      try { recog = new SR(); } catch (_e) { return; }
      this._micText = '';
      this._suppressMicSend = false;
      recog.lang = 'en-US';
      recog.interimResults = true;
      recog.continuous = false;   // one answer at a time — no auto-restart
      recog.onresult = (e) => {
        let combined = '';
        for (let i = 0; i < e.results.length; i++) combined += e.results[i][0].transcript;
        this._micText = combined;
        if (inp) inp.value = combined;   // live feedback in the answer box
      };
      recog.onerror = (ev) => {
        this._finishMic();
        if (inp) inp.value = '';
        if (ev && ev.error === 'no-speech' && typeof showToast === 'function') {
          showToast("I didn't catch that — tap 🎤 and try again!");
        }
      };
      recog.onend = () => {
        const send = !this._suppressMicSend;
        const text = (this._micText || '').trim();
        this._finishMic();
        if (inp) inp.value = '';
        if (send && text) this.sendAnswer(text);
      };
      this._recog = recog;
      this.micActive = true;
      if (typeof micUI === 'function') micUI('hw-mic', true);
      try { recog.start(); } catch (_e) { this._finishMic(); }
    },

    _stopMic() { if (this._recog) { try { this._recog.stop(); } catch (_e) { /* already stopped */ } } },

    _finishMic() {
      this.micActive = false;
      this._recog = null;
      if (typeof micUI === 'function') micUI('hw-mic', false);
    },

    _logActivity() {
      try {
        const sub = this.subject || 'Comprehension';
        if (typeof progBus !== 'undefined' && progBus.recordActivity && typeof S !== 'undefined') {
          progBus.recordActivity(S, sub, 'learn');
        }
        if (typeof saveS === 'function') saveS();
      } catch (_e) { /* non-fatal */ }
    }
  };

  /* ── Exports ─────────────────────────────────────────────────────── */

  if (typeof window !== 'undefined') window.HW = HW;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      HWSYS_ANALYZE, HWSYS_COACH,
      buildAnalyzePrompt, buildCoachPrompt, parseJSON, enforceGate, assembleParts, buildRequestBody,
      callGenerate,
      MAX_PAGES
    };
  }
})();
