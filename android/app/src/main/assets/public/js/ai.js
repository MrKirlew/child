/* ══ AI ENGINE ══ */
/* globals: S, SUBS, GN, DN, SN, SCOL, saveS, esc, fmt, addBub, addTyp, rmTyp, reportError, speak, checkBadges, NB, VIZ, hashPin */

/* ══ PROMPT CACHE (sessionStorage, 10-min TTL) ══ */
async function _cacheKey(model, sys, user, diff) {
  const str = (model || '') + (sys || '') + (user || '') + (diff || '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function _cacheGet(hash) {
  try {
    const raw = sessionStorage.getItem(hash);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts < 600000) return entry.text;
    sessionStorage.removeItem(hash);
  } catch (_e) { /* corrupt entry */ }
  return null;
}
function _cacheSet(hash, text) {
  try { sessionStorage.setItem(hash, JSON.stringify({ text, ts: Date.now() })); } catch (_e) { /* quota */ }
}

/* ══ TOKEN USAGE TRACKING ══ */
function _trackTokens(data) {
  try {
    const count = data?.usageMetadata?.totalTokenCount || 0;
    if (!count) return;
    const key = 'tokenCount_' + new Date().toISOString().slice(0, 10);
    const prev = parseInt(sessionStorage.getItem(key) || '0', 10);
    sessionStorage.setItem(key, String(prev + count));
  } catch (_e) { /* sessionStorage unavailable */ }
}
function _getDailyTokens() {
  try {
    const key = 'tokenCount_' + new Date().toISOString().slice(0, 10);
    return parseInt(sessionStorage.getItem(key) || '0', 10);
  } catch (_e) { return 0; }
}

async function aiGenerate(prompt, systemPrompt, maxTokens) {
  // Prompt cache check
  const cHash = await _cacheKey('gemini', systemPrompt, prompt, S.diff);
  const cached = _cacheGet(cHash);
  if (cached) return cached;

  // Tier 1: On-device Gemma via Capacitor plugin
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GemmaPlugin) {
    try {
      const res = await window.Capacitor.Plugins.GemmaPlugin.generate({ prompt, system: systemPrompt || '', maxTokens: maxTokens || 300 });
      if (res && res.text) { _cacheSet(cHash, res.text); return res.text; }
    } catch (_e) { /* on-device unavailable, fall through to proxy */ }
  }
  // Tier 2: Backend proxy — API key stays server-side
  const proxy = window.AI_PROXY;
  if (!proxy) throw new Error('No AI proxy configured');
  const r = await fetch(proxy + '/ai/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens || 300, temperature: 0.7 }
    })
  });
  const data = await r.json();
  if (data.error) { reportError('api', data.error.message || JSON.stringify(data.error), 'aiGenerate'); throw new Error(data.error.message || data.error); }

  // Track token usage
  _trackTokens(data);

  const text = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
  if (text) _cacheSet(cHash, text);
  return text;
}

function rememberConversationTurn(role, content) {
  const text = String(content || '').trim();
  if (!text) return;
  if (!Array.isArray(S.chatHist)) S.chatHist = [];
  S.chatHist.push({ role, content: text });
  if (S.chatHist.length > 24) S.chatHist.splice(0, S.chatHist.length - 24);
}

function recordLearnActivity(subject, userMsg) {
  const detSub = (subject && SUBS.includes(subject)) ? subject : 'Comprehension';
  S.cnt[detSub] = (S.cnt[detSub] || 0) + 1;
  const prompt = String(userMsg || '').trim();
  if (prompt) {
    S.recentQ.unshift({ sub: detSub, grade: S.grade, q: prompt.substring(0, 55) });
    if (S.recentQ.length > 12) S.recentQ.pop();
  }
  saveS();
  checkBadges();
  return detSub;
}

/* ══ AI — LEARN ══ */
function sysPmt() {
  const tones = {
    normal: 'Talk like a friendly teacher having a normal conversation. Warm and encouraging but at a regular speaking volume. No whispering, no yelling. Just be natural and kind.',
    excited: 'Be upbeat and enthusiastic! Use playful language, fun reactions ("Ooh!", "Nice one!", "You got it!"). Energetic but not over-the-top — like a teacher who genuinely loves their job.',
    calm: 'Speak in a gentle, relaxed tone. Calm and patient. Shorter sentences. Peaceful energy — like a patient librarian helping a child.',
    night: 'Speak very softly and slowly, like reading a bedtime story. Quiet, soothing, and gentle. No excitement.'
  };
  const modeInstr = tones[S.mode] || tones.normal;
  return `You are Ollie the Owl, a warm, patient AI tutor for children. You are talking to a real child through voice on a phone. The child speaks and you speak back. You CANNOT see each other.
TONE: ${modeInstr}

Grade: ${S.grade} | Difficulty: ${S.diff}
${GN[S.grade]} Difficulty: ${DN[S.diff]}

CRITICAL RULES — NEVER BREAK THESE:
1. ACCURACY FIRST. Double-check every fact, especially math. Humans have 5 fingers per hand, 10 total. 7+7=14. If unsure, say "Let me think..." then give the correct answer. NEVER give wrong information to a child.
2. VOICE-ONLY — YOU ARE BLIND AND SO IS THE CHILD. You cannot see the child. The child cannot see you. There is no screen content you can reference. You are two people talking on the phone.
   NEVER say: "show me", "look at this", "point to", "draw this", "hold up", "write it down", "can you see", "in the picture", "on the screen", "click", "tap", "look at", "watch this", "let me show you".
   INSTEAD say: "tell me", "say it out loud", "think about", "imagine", "listen", "what do you think", "try saying".
   Every instruction must work with ONLY your voice and the child's voice. Nothing else exists.
3. ONE IDEA AT A TIME. Keep responses to 2-3 short sentences max. Long responses lose kids. Be concise.
4. NEVER ask the child for personal info — no name, age, location, school, or family details.
5. Stay on educational topics. If the child goes off-topic, gently redirect: "That's fun! But let's get back to learning — want to try some math?"

TEACHING APPROACH:
- Be like a real, caring teacher — not a textbook. Use contractions (you're, let's, that's) and natural language.
- Vary your praise — don't repeat the same phrase every time. Mix it up.
- When teaching math: use simple verbal strategies like counting up or breaking numbers apart. Example for 7+7: "7 plus 7? Think of it as 7 plus 3 is 10, then plus 4 more makes 14!"
- When the child is wrong, be encouraging: "Almost! Let's try together..." then walk through it step by step.
- Ask ONE follow-up question to keep them engaged.
- Give directions as if you are talking on the phone — describe everything with words, never reference anything visual.

SUBJECTS — detect from what the child says:
- Spelling: ${SN.Spelling}
- Grammar: ${SN.Grammar}
- Comprehension: ${SN.Comprehension}
- Science: ${SN.Science}
- Technology: ${SN.Technology}
- Engineering: ${SN.Engineering}
- Math: ${SN.Math}

Just speak naturally to the child. Do NOT return JSON. Do NOT use markdown. Just talk.`;
} // sysPmt v8 — 2026-04-10

// REST API version of the system prompt — includes JSON format requirement for exercise generation
function sysPmtJSON() {
  return sysPmt().replace(
    'Just speak naturally to the child. Do NOT return JSON. Do NOT use markdown. Just talk.',
    'Return ONLY valid JSON: {"message":"your spoken response","phonics":[],"passage":"","lessonType":"Teaching|Practice|Quiz|Comprehension|Spelling|Math","detectedSubject":"Spelling|Grammar|Comprehension|Science|Technology|Engineering|Math"}'
  );
}

async function callAI(userMsg, hist) {
  rememberConversationTurn('user', userMsg);
  addTyp();
  try {
    const histStr = hist.map(m => (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content).join('\n');
    const raw = await aiGenerate(histStr, sysPmtJSON(), 300);
    if (!raw || !raw.trim()) throw new Error('Empty AI response');
    let p; try { p = JSON.parse(raw.replace(/```json|```/g, '').trim()); } catch (_e) { p = { message: raw, phonics: [], passage: '', lessonType: 'Teaching', detectedSubject: 'Comprehension' }; }
    rmTyp();
    const msg = p.message || raw;
    if (!msg || !msg.trim()) throw new Error('Empty message in AI response');
    rememberConversationTurn('assistant', msg);
    const el = addBub('ai', msg, p); speak(msg, el);
    const detSub = (p.detectedSubject && SUBS.includes(p.detectedSubject)) ? p.detectedSubject : 'Comprehension';
    recordLearnActivity(detSub, userMsg);
  } catch (e) { rmTyp(); addBub('ai', 'Hmm, I had a hiccup! Tap the mic and try again!', {}); speak('Hmm, I had a hiccup! Tap the mic and try again!'); reportError('callAI', e.message, 'learn'); }
  S.busy = false;
}
function sendL(txt, opts) {
  const showUserBubble = !opts || opts.showUserBubble !== false;
  if (!txt || !txt.trim() || S.busy) return false;
  S.busy = true;
  if (showUserBubble) addBub('user', txt, {});
  callAI(txt, S.chatHist);
  return true;
}
function startLesson() { if (S.busy) return; S.busy = true; const p = ["Hi Ollie! I'm ready to learn!", "Teach me something fun!", "I want to learn something new!", "What can we learn today?"]; callAI(p[Math.floor(Math.random() * p.length)], S.chatHist); }
