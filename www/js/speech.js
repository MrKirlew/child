/* ══ GEMINI LIVE API — WebSocket voice conversation ══ */
/* globals: S, VIZ, reportError, esc, addBub, addTyp, rmTyp, saveS, checkBadges, SUBS, sysPmt, handleVoiceAns, stopEMic, rememberConversationTurn, recordLearnActivity */

// Single Live API model. The earlier `gemini-2.5-flash-native-audio-preview-12-2025`
// was deprecated by Google on/before 2026-04-17 and never returned setupComplete,
// causing every Learn-tab mic tap to wait the full setup timeout before falling
// through. Array shape kept so future fallbacks are a one-line edit.
const LIVE_MODELS = ['models/gemini-3.1-flash-live-preview'];
let _liveModelIdx = 0;

let _ws = null, _micStream = null, _micProcessor = null, _audioCtx = null;
let _conversing = false, _lmic = false, _playQueue = [], _playing = false, _audioSrc = null, _nextPlayTime = 0, _scheduledSrcs = [];
let _listenTimer = null;
let _transcript = ''; // accumulates model's spoken text for chat bubble
let _inputTranscript = ''; // accumulates child's speech for chat bubble
let _lastUserTurn = '';

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  return _audioCtx;
}

/* ══ GET WEBSOCKET URL (API key stays server-side) ══ */
async function _getLiveUrl() {
  console.warn('[KiddoAI] _getLiveUrl: fetching from ' + window.AI_PROXY + '/ai/live-token');
  const r = await fetch(window.AI_PROXY + '/ai/live-token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  const d = await r.json();
  console.warn('[KiddoAI] _getLiveUrl: status=' + r.status + ' hasUrl=' + !!d.url);
  if (!r.ok || !d.url) throw new Error(d.error || 'No WebSocket URL');
  return d.url;
}

/* ══ WEBSOCKET CONNECTION ══ */
async function _connectLive() {
  if (_ws && _ws.readyState === WebSocket.OPEN) return;
  const url = await _getLiveUrl();

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => { ws.close(); reject(new Error('Setup timeout')); }, 8000);

    ws.onopen = () => {
      console.warn('[KiddoAI] WebSocket OPEN, sending setup...');
      ws.send(JSON.stringify({
        setup: {
          model: LIVE_MODELS[_liveModelIdx],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
          },
          systemInstruction: { parts: [{ text: sysPmt() }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
              silenceDurationMs: 1500,
              prefixPaddingMs: 300
            },
            activityHandling: 'START_OF_ACTIVITY_INTERRUPTS'
          }
        }
      }));
    };

    ws.onmessage = async (ev) => {
      // Handle both string and Blob data (WebView may send Blob)
      let text = ev.data;
      if (typeof text !== 'string') {
        try { text = await ev.data.text(); } catch (_e) { return; }
      }
      try {
        const msg = JSON.parse(text);
        if (msg.setupComplete) {
          console.warn('[KiddoAI] setupComplete received!');
          clearTimeout(timeout);
          _ws = ws;
          ws.onmessage = _handleServerMsg;
          ws.onerror = () => { reportError('live-ws', 'WebSocket error', 'session'); };
          ws.onclose = (cev) => {
            // Surface the close code + reason so we can tell intentional server-side
            // session ends from protocol/contract failures (e.g. realtime input
            // schema rejected). Without this, reconnect loops are invisible.
            console.warn('[KiddoAI] live-ws closed code=' + cev.code + ' reason="' + (cev.reason || '') + '" wasClean=' + cev.wasClean);
            _ws = null;
            if (_conversing) {
              setTimeout(() => { if (_conversing) _connectLive().then(_startMicStream).catch(() => {}); }, 1000);
            }
          };
          resolve();
          return;
        }
      } catch (_e) { /* not JSON */ }
    };

    ws.onerror = () => { clearTimeout(timeout); reject(new Error('WebSocket error')); };
    ws.onclose = (ev2) => { if (!_ws) { clearTimeout(timeout); reject(new Error('WebSocket closed: ' + ev2.code)); } };
  });
}

/* ══ SERVER MESSAGE HANDLER ══ */
async function _handleServerMsg(ev) {
  let text = ev.data;
  if (typeof text !== 'string') { try { text = await ev.data.text(); } catch (_e) { return; } }
  let msg;
  try { msg = JSON.parse(text); } catch (_e) { return; }

  // Interruption — child started speaking while Ollie was talking
  if (msg.serverContent && msg.serverContent.interrupted) {
    _stopPlayback();
    VIZ.stop();
    return;
  }

  // Child's speech transcription — show in chat + reset listen timer (child is active)
  if (msg.serverContent && msg.serverContent.inputTranscription && msg.serverContent.inputTranscription.text) {
    _inputTranscript += msg.serverContent.inputTranscription.text;
    _resetListenTimer();
  }

  // Audio response from model — flush child's speech bubble first, reset timer (Ollie is responding)
  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
    _resetListenTimer();
    if (_inputTranscript.trim()) {
      const userText = _inputTranscript.trim();
      addBub('user', userText, {});
      rememberConversationTurn('user', userText);
      _lastUserTurn = userText;
      _inputTranscript = '';
    }
    for (const part of msg.serverContent.modelTurn.parts) {
      if (part.inlineData && part.inlineData.data) {
        _queueAudio(part.inlineData.data);
      }
    }
  }

  // Text transcription of model's speech
  if (msg.serverContent && msg.serverContent.outputTranscription && msg.serverContent.outputTranscription.text) {
    _transcript += msg.serverContent.outputTranscription.text;
  }

  // Turn complete — model finished speaking, reset listen timer (Ollie just finished, child's turn)
  if (msg.serverContent && msg.serverContent.turnComplete) {
    _resetListenTimer();
    if (_transcript.trim()) {
      // Parse JSON if the model returned it (from system prompt), otherwise use raw text
      let displayText = _transcript.trim();
      try { const parsed = JSON.parse(displayText); if (parsed.message) displayText = parsed.message; } catch (_e) { /* not JSON, use as-is */ }
      rememberConversationTurn('assistant', displayText);
      addBub('ai', displayText, { lessonType: 'Teaching' });
      recordLearnActivity(_detectSubject(displayText), _lastUserTurn);
      _lastUserTurn = '';
    }
    _transcript = '';
  }

  // Session ending warning
  if (msg.goAway) {
    // Reconnect before session expires
    setTimeout(() => { if (_conversing) { _disconnectLive(); _connectLive().then(_startMicStream).catch(() => {}); } }, 2000);
  }
}

function _detectSubject(text) {
  const t = text.toLowerCase();
  if (/spell|phonics|letter|sound|word/.test(t)) return 'Spelling';
  if (/grammar|sentence|punctuat|noun|verb/.test(t)) return 'Grammar';
  if (/read|passage|story|compre/.test(t)) return 'Comprehension';
  if (/star|planet|constellation|solar|moon|space|orbit|galaxy/.test(t)) return 'Astrology';
  if (/rock|mineral|volcano|earthquake|fossil|layer|mountain|soil/.test(t)) return 'Geology';
  if (/plant|animal|body|cell|ecosystem|habitat|life cycle|species/.test(t)) return 'Biology';
  if (/tech|computer|code|internet/.test(t)) return 'Technology';
  if (/engineer|build|design|structure/.test(t)) return 'Engineering';
  if (/math|number|count|add|subtract|multiply|divide|plus|minus/.test(t)) return 'Math';
  return 'Comprehension';
}

/* ══ AUDIO PLAYBACK — gapless scheduled playback via AudioContext clock ══ */
function _queueAudio(base64) {
  if (!_playing) { _playing = true; VIZ.start(); }
  _scheduleChunk(base64);
}

async function _scheduleChunk(base64) {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume();
  const float = _decodePCM(base64);
  const ab = ctx.createBuffer(1, float.length, 24000);
  ab.getChannelData(0).set(float);
  const src = ctx.createBufferSource();
  src.buffer = ab;
  src.connect(ctx.destination);
  // Schedule precisely on the AudioContext timeline — no JS callback gaps
  const now = ctx.currentTime;
  const startAt = Math.max(now + 0.005, _nextPlayTime); // 5ms minimum lead time
  _nextPlayTime = startAt + ab.duration;
  src.onended = () => {
    _scheduledSrcs = _scheduledSrcs.filter(s => s !== src);
    // If no more scheduled sources and queue is empty, playback is done
    if (_scheduledSrcs.length === 0) { _playing = false; VIZ.stop(); }
  };
  _scheduledSrcs.push(src);
  src.start(startAt);
}

function _stopPlayback() {
  _playQueue = [];
  _playing = false;
  _nextPlayTime = 0;
  _scheduledSrcs.forEach(s => { try { s.stop(); } catch (_e) { /* already stopped */ } });
  _scheduledSrcs = [];
  if (_audioSrc) { try { _audioSrc.stop(); } catch (_e) { /* already stopped */ } _audioSrc = null; }
}

/* ══ MIC CAPTURE — raw PCM 16kHz → WebSocket ══ */
async function _requestMicPermission() {
  // On Android Capacitor, request RECORD_AUDIO via our custom requestMic method
  if (window.IS_ANDROID && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechPlugin) {
    console.warn('[KiddoAI] Requesting mic permission via SpeechPlugin.requestMic...');
    const result = await window.Capacitor.Plugins.SpeechPlugin.requestMic({});
    if (!result || !result.granted) throw new Error('Microphone permission denied');
    console.warn('[KiddoAI] Mic permission granted!');
  }
}

async function _startMicStream() {
  if (_micStream) return;
  await _requestMicPermission();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  _micStream = stream;
  const ctx = new AudioContext({ sampleRate: 16000 });
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessorNode for broad compatibility (AudioWorklet needs HTTPS + module)
  _micProcessor = ctx.createScriptProcessor(4096, 1, 1);
  _micProcessor.onaudioprocess = (e) => {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) return;
    const float32 = e.inputBuffer.getChannelData(0);
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32768)));
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    // gemini-3.1-flash-live-preview deprecated `mediaChunks` (close code 1007:
    // "realtime_input.media_chunks is deprecated. Use audio, video, or text
    // instead."). The replacement envelope is `realtimeInput.audio` with the
    // same Blob shape.
    _ws.send(JSON.stringify({
      realtimeInput: { audio: { mimeType: 'audio/pcm;rate=16000', data: b64 } }
    }));
  };
  source.connect(_micProcessor);
  // Connect to a silent gain node — ScriptProcessorNode needs a destination to fire, but we must NOT play mic audio through speakers (causes static/feedback)
  const silentGain = ctx.createGain();
  silentGain.gain.value = 0;
  silentGain.connect(ctx.destination);
  _micProcessor.connect(silentGain);
}

function _stopMicStream() {
  if (_micProcessor) { _micProcessor.disconnect(); _micProcessor = null; }
  if (_micStream) { _micStream.getTracks().forEach(t => t.stop()); _micStream = null; }
}

/* ══ DISCONNECT ══ */
function _flushPendingTranscripts() {
  // Flush any child speech that hasn't been shown
  if (_inputTranscript.trim()) {
    const userText = _inputTranscript.trim();
    addBub('user', userText, {});
    rememberConversationTurn('user', userText);
    _lastUserTurn = userText;
    _inputTranscript = '';
  }
  // Flush any Ollie speech that hasn't been shown
  if (_transcript.trim()) {
    let displayText = _transcript.trim();
    try { const parsed = JSON.parse(displayText); if (parsed.message) displayText = parsed.message; } catch (_e) { /* not JSON */ }
    rememberConversationTurn('assistant', displayText);
    addBub('ai', displayText, { lessonType: 'Teaching' });
    recordLearnActivity(_detectSubject(displayText), _lastUserTurn);
    _lastUserTurn = '';
    _transcript = '';
  }
}

function _disconnectLive() {
  _flushPendingTranscripts();
  _stopMicStream();
  _stopPlayback();
  VIZ.stop();
  if (_ws) { try { _ws.close(); } catch (_e) { /* already closed */ } _ws = null; }
}

/* ══ PUBLIC API — used by ui.js and ai.js ══ */

// Connect WebSocket only (no mic) — used on app startup for Ollie's greeting
async function connectLive() {
  console.warn('[KiddoAI] connectLive: starting...');
  for (let mi = 0; mi < LIVE_MODELS.length; mi++) {
    _liveModelIdx = mi;
    try {
      console.warn('[KiddoAI] connectLive: trying model ' + LIVE_MODELS[mi]);
      await _connectLive();
      console.warn('[KiddoAI] connectLive: SUCCESS with ' + LIVE_MODELS[mi]);
      return; // connected
    } catch (e) {
      console.error('[KiddoAI] connectLive: FAILED ' + LIVE_MODELS[mi] + ': ' + e.message);
      reportError('live', e.message, 'connectOnly model=' + LIVE_MODELS[mi]);
      _disconnectLive();
    }
  }
  throw new Error('All Live API models failed to connect');
}

// Reset listen timer — called on every activity so conversation stays alive during back-and-forth
function _resetListenTimer() {
  if (!_conversing) return;
  clearTimeout(_listenTimer);
  _listenTimer = setTimeout(() => {
    if (_conversing) { stopConversation(); document.getElementById('slbl').textContent = 'Tap 🎤 if you need anything!'; }
  }, (S.listenWait || 30) * 1000);
}

// Start/stop conversation (Learn tab mic button)
async function togLMic() {
  if (_conversing) { stopConversation(); return; }
  startConversation();
}

async function startConversation() {
  _conversing = true;
  micUI('lmic', true);
  try {
    // Connect WebSocket if not already open
    if (!_ws || _ws.readyState !== WebSocket.OPEN) {
      document.getElementById('slbl').textContent = 'Connecting...';
      await connectLive();
    }
    // Now start mic (this triggers permission prompt if needed)
    document.getElementById('slbl').textContent = 'Starting mic...';
    await _startMicStream();
    document.getElementById('slbl').textContent = 'Listening... tap 🎤 to stop';
    _resetListenTimer();
  } catch (e) {
    reportError('live', e.message, 'startConversation');
    const isPermission = e.message && (e.message.includes('Permission') || e.message.includes('NotAllowed') || e.message.includes('permission'));
    document.getElementById('slbl').textContent = isPermission ? 'Mic permission needed — tap 🎤 to retry' : 'Connection failed — tap 🎤 to retry';
    _conversing = false; micUI('lmic', false);
  }
}

function stopConversation() {
  _conversing = false;
  clearTimeout(_listenTimer); _listenTimer = null;
  _stopMicStream();
  // Do NOT stop playback — let Ollie finish speaking her current response
  // Do NOT close WebSocket — let turnComplete arrive so transcript gets flushed
  // Close WebSocket after 30s idle (enough time for Ollie to finish)
  setTimeout(() => { if (!_conversing && _ws) _disconnectLive(); }, 30000);
  micUI('lmic', false);
  document.getElementById('slbl').textContent = 'Tap 🎤 to talk to Ollie';
}

// Send text message through Live API (for startup greeting and text input)
function sendLiveText(text, opts) {
  if (!_ws || _ws.readyState !== WebSocket.OPEN) return false;
  const settings = opts || {};
  const visibleText = String(settings.userVisibleText ?? text ?? '').trim();
  if (settings.addUserBubble !== false && visibleText) addBub('user', visibleText, {});
  if (settings.trackHistory !== false && visibleText) {
    rememberConversationTurn('user', visibleText);
    _lastUserTurn = visibleText;
  }
  _ws.send(JSON.stringify({
    clientContent: { turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }
  }));
  return true;
}

// Speak text through Live API (for welcome message, badges, errors)
async function speak(txt) {
  // If Live API is connected, send as text and let model speak it
  if (_ws && _ws.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify({
      clientContent: { turns: [{ role: 'user', parts: [{ text: 'Please say this exactly to the child: ' + txt }] }], turnComplete: true }
    }));
    return;
  }
  // Gemini REST TTS only — no robotic fallback
  const clean = txt.replace(/[*_~`#]/g, '').substring(0, 800);
  VIZ.start();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(window.AI_PROXY + '/ai/speak', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: 'Kore' })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.audio) { await _playPCMSingle(d.audio); return; }
      }
    } catch (_e) { /* retry */ }
    if (attempt === 0) await new Promise(r => setTimeout(r, 500));
  }
  // TTS failed — show text only, no robotic voice
  VIZ.stop();
}

// Decode base64 PCM to Float32 with edge smoothing
function _decodePCM(base64) {
  const raw = atob(base64);
  const buf = new Int16Array(raw.length / 2);
  for (let i = 0; i < buf.length; i++) buf[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
  const float = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) float[i] = buf[i] / 32768;
  // 48-sample (~2ms) fade-in/fade-out to prevent clicks
  const fade = Math.min(48, float.length >> 1);
  for (let i = 0; i < fade; i++) { float[i] *= i / fade; float[float.length - 1 - i] *= i / fade; }
  return float;
}

async function _playPCMSingle(base64) {
  const ctx = getAudioCtx(); if (ctx.state === 'suspended') await ctx.resume();
  const float = _decodePCM(base64);
  const ab = ctx.createBuffer(1, float.length, 24000);
  ab.getChannelData(0).set(float);
  const src = ctx.createBufferSource(); src.buffer = ab; src.connect(ctx.destination);
  src.onended = () => VIZ.stop();
  src.start();
}

// Play PCM chunk — returns Promise, does NOT touch VIZ (caller manages visualizer)
function _playPCMChunk(base64) {
  return new Promise(async (resolve) => {
    const ctx = getAudioCtx(); if (ctx.state === 'suspended') await ctx.resume();
    const float = _decodePCM(base64);
    const ab = ctx.createBuffer(1, float.length, 24000);
    ab.getChannelData(0).set(float);
    const src = ctx.createBufferSource(); src.buffer = ab; src.connect(ctx.destination);
    src.onended = resolve;
    src.start();
  });
}

// REST-only TTS — bypasses Live API WebSocket. Use for Exercise, Spell, and Badge TTS.
// Chunks at sentence (and long-sentence comma) boundaries per CLAUDE.md TTS
// Chunking rule. Pipelines fetches so the next TTS call is already in flight
// while the current chunk is playing — eliminates audible gaps between chunks.
const _TTS_CHUNK_CHAR_BUDGET = 90;

// Splits a sentence at commas if it's long enough to risk 150-token audio
// truncation. Short sentences pass through unchanged.
function _splitLongSentence(sentence) {
  if (sentence.length <= _TTS_CHUNK_CHAR_BUDGET) return [sentence];
  if (!sentence.includes(',')) return [sentence];
  const out = [];
  let buf = '';
  for (const piece of sentence.split(/(,)/)) {
    if ((buf + piece).length > _TTS_CHUNK_CHAR_BUDGET && buf.trim()) { out.push(buf.trim()); buf = piece; }
    else { buf += piece; }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// Fetch one TTS chunk with 2-attempt retry + upstream error logging.
// Returns the base64 audio string or null on failure.
async function _fetchTTS(chunk) {
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(window.AI_PROXY + '/ai/speak', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, voice: 'Kore' })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.audio) return d.audio;
        lastErr = 'response-missing-audio';
      } else {
        lastErr = 'http-' + r.status;
        try { const eb = await r.json(); if (eb && eb.error) lastErr += ' ' + (typeof eb.error === 'string' ? eb.error : (eb.error.message || JSON.stringify(eb.error)).slice(0, 140)); } catch (_je) { /* non-JSON body */ }
      }
    } catch (netErr) { lastErr = 'network: ' + netErr.message; }
    if (attempt === 0) await new Promise(r => setTimeout(r, 500));
  }
  console.warn('[KiddoAI] _fetchTTS failed: ' + lastErr + ' chunk="' + chunk.slice(0, 40) + '"');
  return null;
}

async function speakDirect(txt) {
  const _sd0 = performance.now();
  const _sdLabel = (txt || '').slice(0, 30);
  console.warn('[KiddoAI][timing] speakDirect start "' + _sdLabel + '..."');
  const clean = txt.replace(/[*_~`#]/g, '').substring(0, 800);
  const rawSentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  // Pre-split any over-budget sentences at commas so the 150-token TTS cap
  // doesn't truncate mid-sentence.
  const sentences = [];
  for (const s of rawSentences) { for (const piece of _splitLongSentence(s.trim())) if (piece) sentences.push(piece); }
  // Bundle up to 2 short pieces per TTS call; never bundle an over-budget piece.
  const chunks = [];
  let i = 0;
  while (i < sentences.length) {
    if (sentences[i].length > _TTS_CHUNK_CHAR_BUDGET || i + 1 >= sentences.length || (sentences[i].length + 1 + sentences[i + 1].length) > _TTS_CHUNK_CHAR_BUDGET) {
      chunks.push(sentences[i]); i += 1;
    } else {
      chunks.push((sentences[i] + ' ' + sentences[i + 1]).trim()); i += 2;
    }
  }
  if (!chunks.length) { VIZ.stop(); return; }

  VIZ.start();
  console.warn('[KiddoAI][timing] speakDirect chunks=' + chunks.length + ' lens=[' + chunks.map(c => c.length).join(',') + '] +' + Math.round(performance.now() - _sd0) + 'ms');
  // Pipeline: kick off first fetch before the loop; on each iteration
  // prefetch the NEXT chunk while we await+play the CURRENT one.
  let inflight = _fetchTTS(chunks[0]);
  for (let idx = 0; idx < chunks.length; idx++) {
    const current = inflight;
    inflight = (idx + 1 < chunks.length) ? _fetchTTS(chunks[idx + 1]) : null;
    const audio = await current;
    if (!audio) { console.warn('[KiddoAI] speakDirect aborting at chunk ' + idx); break; }
    console.warn('[KiddoAI][timing] chunk ' + idx + ' audio-ready +' + Math.round(performance.now() - _sd0) + 'ms');
    await _playPCMChunk(audio);
    console.warn('[KiddoAI][timing] chunk ' + idx + ' playback-done +' + Math.round(performance.now() - _sd0) + 'ms');
  }
  VIZ.stop();
}

function stopAll() {
  _stopPlayback();
  VIZ.stop();
}

function micUI(id, on) {
  const b = document.getElementById(id); if (!b) return;
  if (id === 'lmic' && _conversing) { b.textContent = '\u23F9'; b.className = 'on'; return; }
  b.textContent = on ? '\u23F9' : '\uD83C\uDFA4'; b.className = on ? 'on' : '';
}

// Called by Android native TTS when done (for exercise tab fallback)
function onAndroidTTSDone() { VIZ.stop(); }

/* ══ STT — EXERCISE TAB (still uses SpeechRecognizer) ══ */
const NB = {
  get ok() { return window.IS_ANDROID && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SpeechPlugin; },
  call(method, args) { if (this.ok) try { window.Capacitor.Plugins.SpeechPlugin[method](args || {}).catch(() => {}); } catch (_e) { /* bridge unavailable */ } },
};

let _esr = null, _emic = false, _speechTarget = 'exercise';
function togExMic() {
  if (_emic) { stopEMic(); return; }
  _speechTarget = 'exercise';
  if (NB.ok) { _emic = true; micUI('exmic', true); document.getElementById('vatr').textContent = '🎤 Listening...'; NB.call('startListening'); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { document.getElementById('vatr').textContent = 'Speech not available'; return; }
  _esr = new SR(); _esr.lang = 'en-US'; _esr.interimResults = true;
  _emic = true; micUI('exmic', true);
  document.getElementById('vatr').textContent = '🎤 Listening...';
  _esr.onresult = e => {
    const t = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('vatr').textContent = t;
    if (e.results[e.results.length - 1].isFinal) { stopEMic(); handleVoiceAns(t); }
  };
  _esr.onend = () => stopEMic(); _esr.onerror = () => { stopEMic(); document.getElementById('vatr').textContent = ''; };
  _esr.start();
}
function stopEMic() { if (_esr) _esr.stop(); _esr = null; _emic = false; micUI('exmic', false); }

// Android speech callbacks
function onAndroidSpeechResult(t) {
  // Spell tab mic
  if (window._spellMicActive) {
    window._spellMicActive = false;
    const word = (t || '').trim();
    if (word) { document.getElementById('spell-inp').value = word; spellWord(); }
    return;
  }
  if (_speechTarget === 'exercise') { stopEMic(); document.getElementById('vatr').textContent = t; handleVoiceAns(t); }
}
function onAndroidSpeechError(reason) {
  const msg = reason || "Couldn't hear you";
  reportError('speech', msg, _speechTarget);
  if (window._spellMicActive) { window._spellMicActive = false; return; }
  if (_speechTarget === 'exercise') { stopEMic(); document.getElementById('vatr').textContent = msg; }
}
