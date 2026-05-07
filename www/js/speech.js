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
let _speechDebugEntries = [];

function _speechDebugTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function _speechDebugText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function _renderSpeechDebug() {
  const nowEl = document.getElementById('speech-debug-now');
  const listEl = document.getElementById('speech-debug-list');
  if (!nowEl || !listEl) return;
  if (!_speechDebugEntries.length) {
    nowEl.textContent = 'Waiting for Ollie to speak...';
    listEl.innerHTML = '';
    return;
  }
  nowEl.textContent = _speechDebugEntries[0].text;
  listEl.innerHTML = _speechDebugEntries.map(entry =>
    `<div class="speech-debug-item"><div class="speech-debug-meta">${esc(entry.source)}<br>${esc(entry.time)}</div><div class="speech-debug-text">${esc(entry.text)}</div></div>`
  ).join('');
}

function _recordSpeechDebug(source, text) {
  const clean = _speechDebugText(text);
  if (!clean) return;
  _speechDebugEntries.unshift({ source: source || 'Speech', text: clean, time: _speechDebugTime() });
  if (_speechDebugEntries.length > 8) _speechDebugEntries = _speechDebugEntries.slice(0, 8);
  _renderSpeechDebug();
}

function clearSpeechDebug() {
  _speechDebugEntries = [];
  _renderSpeechDebug();
}

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  return _audioCtx;
}

/* ══ GET WEBSOCKET URL (API key stays server-side) ══ */
async function _getLiveUrl() {
  console.warn('[Ollie] _getLiveUrl: fetching from ' + window.AI_PROXY + '/ai/live-token');
  const r = await fetch(window.AI_PROXY + '/ai/live-token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  const d = await r.json();
  console.warn('[Ollie] _getLiveUrl: status=' + r.status + ' hasUrl=' + !!d.url);
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
      console.warn('[Ollie] WebSocket OPEN, sending setup...');
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
            // 60s silence floor before VAD ends the child's turn. The child
            // must always be allowed to think/pause without being cut off,
            // so end-of-speech sensitivity is set to LOW. activityHandling
            // stays at START_OF_ACTIVITY_INTERRUPTS — that lets the CHILD
            // interrupt Ollie (desired), it does not let Ollie interrupt
            // the child.
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
              silenceDurationMs: 60000,
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
          console.warn('[Ollie] setupComplete received!');
          clearTimeout(timeout);
          _ws = ws;
          ws.onmessage = _handleServerMsg;
          ws.onerror = () => { reportError('live-ws', 'WebSocket error', 'session'); };
          ws.onclose = (cev) => {
            // Surface the close code + reason so we can tell intentional server-side
            // session ends from protocol/contract failures (e.g. realtime input
            // schema rejected). Without this, reconnect loops are invisible.
            console.warn('[Ollie] live-ws closed code=' + cev.code + ' reason="' + (cev.reason || '') + '" wasClean=' + cev.wasClean);
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
      _recordSpeechDebug('Learn reply', displayText);
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
    console.warn('[Ollie] Requesting mic permission via SpeechPlugin.requestMic...');
    const result = await window.Capacitor.Plugins.SpeechPlugin.requestMic({});
    if (!result || !result.granted) throw new Error('Microphone permission denied');
    console.warn('[Ollie] Mic permission granted!');
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
  console.warn('[Ollie] connectLive: starting...');
  for (let mi = 0; mi < LIVE_MODELS.length; mi++) {
    _liveModelIdx = mi;
    try {
      console.warn('[Ollie] connectLive: trying model ' + LIVE_MODELS[mi]);
      await _connectLive();
      console.warn('[Ollie] connectLive: SUCCESS with ' + LIVE_MODELS[mi]);
      return; // connected
    } catch (e) {
      console.error('[Ollie] connectLive: FAILED ' + LIVE_MODELS[mi] + ': ' + e.message);
      reportError('live', e.message, 'connectOnly model=' + LIVE_MODELS[mi]);
      _disconnectLive();
    }
  }
  throw new Error('All Live API models failed to connect');
}

// Reset listen timer — called on every activity so conversation stays alive
// during back-and-forth. Default window is 60s (the child's full speak slot).
// When activity is detected the visible countdown also resets so the ring
// drains from 60 again, keeping the on-screen number aligned with the
// hard-max disconnect timer.
function _resetListenTimer() {
  if (!_conversing) return;
  clearTimeout(_listenTimer);
  const seconds = (S.listenWait || 60);
  _listenTimer = setTimeout(() => {
    if (_conversing) { stopConversation(); document.getElementById('slbl').textContent = 'Tap 🎤 if you need anything!'; }
  }, seconds * 1000);
  if (typeof Countdown !== 'undefined' && Countdown.isRunning()) Countdown.reset();
}

// Start/stop conversation (Learn tab mic button)
async function togLMic() {
  if (_conversing) { stopConversation(); return; }
  startConversation();
}

async function startConversation() {
  _conversing = true;
  micUI('lmic', true);
  const stage = document.getElementById('lmic-stage');
  if (stage) stage.classList.add('active');
  document.body.classList.add('listening-mode');
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
    if (typeof Countdown !== 'undefined' && stage) {
      Countdown.start({ seconds: (S.listenWait || 60), mountEl: stage, variant: 'learn',
        onExpire: () => { if (_conversing) stopConversation(); } });
    }
  } catch (e) {
    reportError('live', e.message, 'startConversation');
    const isPermission = e.message && (e.message.includes('Permission') || e.message.includes('NotAllowed') || e.message.includes('permission'));
    document.getElementById('slbl').textContent = isPermission ? 'Mic permission needed — tap 🎤 to retry' : 'Connection failed — tap 🎤 to retry';
    _conversing = false; micUI('lmic', false);
    if (typeof Countdown !== 'undefined') Countdown.stop();
    if (stage) stage.classList.remove('active');
    document.body.classList.remove('listening-mode');
  }
}

function stopConversation() {
  _conversing = false;
  clearTimeout(_listenTimer); _listenTimer = null;
  _stopMicStream();
  if (typeof Countdown !== 'undefined') Countdown.stop();
  const stage = document.getElementById('lmic-stage');
  if (stage) stage.classList.remove('active');
  document.body.classList.remove('listening-mode');
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
    _recordSpeechDebug('Live exact', txt);
    _ws.send(JSON.stringify({
      clientContent: { turns: [{ role: 'user', parts: [{ text: 'Please say this exactly to the child: ' + txt }] }], turnComplete: true }
    }));
    return;
  }
  // Gemini REST TTS only — no robotic fallback
  const clean = txt.replace(/[*_~`#]/g, '').substring(0, 800);
  _recordSpeechDebug('REST exact', clean);
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
  console.warn('[Ollie] _fetchTTS failed: ' + lastErr + ' chunk="' + chunk.slice(0, 40) + '"');
  return null;
}

async function speakDirect(txt, opts) {
  const slow = !!(opts && opts.slow);
  const debugSource = (opts && opts.debugSource) || 'Direct TTS';
  const clean = txt.replace(/[*_~`#]/g, '').substring(0, 800);
  const rawSentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  // Pre-split any over-budget sentences at commas so the 150-token TTS cap
  // doesn't truncate mid-sentence.
  const sentences = [];
  for (const s of rawSentences) { for (const piece of _splitLongSentence(s.trim())) if (piece) sentences.push(piece); }
  // Bundle up to 2 short pieces per TTS call; never bundle an over-budget piece.
  // Chunk-0 priority: emit the very first sentence ALONE if short — its TTS
  // inference round-trip dominates first-audio latency (measured warm-path:
  // 7-char chunk returns in ~1.7s vs ~5s for a 26-char bundled chunk).
  // Subsequent chunks pipeline while chunk 0 plays, so the user doesn't feel
  // extra gaps from the split.
  // In slow mode (phonics), every syllable gets its own TTS call so each
  // chunk's natural start/stop envelope separates the sounds for the child.
  const _FIRST_CHUNK_FAST_BUDGET = slow ? 16 : 40;
  const chunks = [];
  let i = 0;
  if (slow) {
    while (i < sentences.length) { chunks.push(sentences[i]); i += 1; }
  } else {
    if (sentences.length > 1 && sentences[0].length <= _FIRST_CHUNK_FAST_BUDGET) {
      chunks.push(sentences[0]); i = 1;
    }
    while (i < sentences.length) {
      if (sentences[i].length > _TTS_CHUNK_CHAR_BUDGET || i + 1 >= sentences.length || (sentences[i].length + 1 + sentences[i + 1].length) > _TTS_CHUNK_CHAR_BUDGET) {
        chunks.push(sentences[i]); i += 1;
      } else {
        chunks.push((sentences[i] + ' ' + sentences[i + 1]).trim()); i += 2;
      }
    }
  }
  if (!chunks.length) { VIZ.stop(); return; }

  VIZ.start();
  chunks.forEach((chunk, idx) => _recordSpeechDebug(chunks.length > 1 ? `${debugSource} ${idx + 1}` : debugSource, chunk));
  // Pipeline: kick off first fetch before the loop; on each iteration
  // prefetch the NEXT chunk while we await+play the CURRENT one. A single
  // failed chunk no longer aborts the whole utterance — we skip it and
  // keep playing so the rest of the message still reaches the child.
  let inflight = _fetchTTS(chunks[0]);
  for (let idx = 0; idx < chunks.length; idx++) {
    const current = inflight;
    inflight = (idx + 1 < chunks.length) ? _fetchTTS(chunks[idx + 1]) : null;
    const audio = await current;
    if (!audio) { console.warn('[Ollie] speakDirect skipping failed chunk ' + idx); continue; }
    await _playPCMChunk(audio);
  }
  VIZ.stop();
}

function stopAll() {
  _stopPlayback();
  VIZ.stop();
}

window.clearSpeechDebug = clearSpeechDebug;

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
let _exTranscript = '', _exFinalized = false, _exRestarts = 0;
const _EX_MAX_RESTARTS = 3;
const _EX_TALK_SECONDS = 60;

function _exCountdownStart(opts) {
  if (typeof Countdown === 'undefined') return;
  const stage = document.getElementById('exmic-stage');
  if (!stage) return;
  Countdown.start({
    seconds: _EX_TALK_SECONDS,
    mountEl: stage,
    variant: 'exercise',
    onExpire: () => { _finalizeEx(opts && opts.android); }
  });
}

function _finalizeEx(isAndroid) {
  if (_exFinalized) return;
  _exFinalized = true;
  const text = (_exTranscript || '').trim();
  if (isAndroid) NB.call('stopListening');
  stopEMic();
  if (text) handleVoiceAns(text);
  else document.getElementById('vatr').textContent = '';
}

function togExMic() {
  if (_emic) { _finalizeEx(NB.ok); return; }
  _speechTarget = 'exercise';
  _exTranscript = ''; _exFinalized = false; _exRestarts = 0;
  const stage = document.getElementById('exmic-stage');
  if (stage) stage.classList.add('active');
  document.body.classList.add('listening-mode');
  if (NB.ok) {
    _emic = true; micUI('exmic', true);
    document.getElementById('vatr').textContent = '🎤 Listening...';
    NB.call('startListening');
    _exCountdownStart({ android: true });
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('vatr').textContent = 'Speech not available';
    if (stage) stage.classList.remove('active');
    document.body.classList.remove('listening-mode');
    return;
  }
  _emic = true; micUI('exmic', true);
  document.getElementById('vatr').textContent = '🎤 Listening...';
  _exStartRecognizer(SR);
  _exCountdownStart({ android: false });
}

function _exStartRecognizer(SR) {
  _esr = new SR();
  _esr.lang = 'en-US';
  _esr.interimResults = true;
  _esr.continuous = true;
  // Accumulate transcript across all results. Do NOT finalize on isFinal —
  // the child gets the full 60s window and we stitch their utterances
  // together. Finalization only happens on countdown expiry or manual stop.
  _esr.onresult = e => {
    let combined = '';
    for (let i = 0; i < e.results.length; i++) combined += e.results[i][0].transcript;
    _exTranscript = combined;
    document.getElementById('vatr').textContent = combined;
  };
  // Some Android WebViews emit onend after ~30s of silence even with
  // continuous=true. Restart up to 3 times so the child keeps their
  // 60s window. Hard cap prevents runaway loops.
  _esr.onend = () => {
    if (_emic && !_exFinalized && _exRestarts < _EX_MAX_RESTARTS) {
      _exRestarts += 1;
      try { _esr.start(); } catch (_e) { _finalizeEx(false); }
    }
  };
  _esr.onerror = () => { _finalizeEx(false); };
  try { _esr.start(); } catch (_e) { _finalizeEx(false); }
}

function stopEMic() {
  if (_esr) { try { _esr.stop(); } catch (_e) { /* recognizer already stopped */ } }
  _esr = null;
  _emic = false;
  micUI('exmic', false);
  if (typeof Countdown !== 'undefined') Countdown.stop();
  const stage = document.getElementById('exmic-stage');
  if (stage) stage.classList.remove('active');
  document.body.classList.remove('listening-mode');
}

// Android speech callbacks
function onAndroidSpeechResult(t) {
  // Spell tab mic — finalize/restart logic lives on window so ui.js owns it.
  if (window._spellMicActive) {
    if (window._spellFinalized) return;
    const word = (t || '').trim();
    if (word) window._spellTranscript = word;
    const lblEl = document.getElementById('spell-listening');
    if (lblEl) lblEl.textContent = '🎤 Heard: ' + (word || '');
    if (window._spellMicOn && !window._spellFinalized && (window._spellRestarts || 0) < (window._SPELL_MAX_RESTARTS || 3)) {
      window._spellRestarts = (window._spellRestarts || 0) + 1;
      try { NB.call('startListening'); } catch (_e) { if (typeof window._finalizeSpell === 'function') window._finalizeSpell(true); }
    } else if (typeof window._finalizeSpell === 'function') {
      window._finalizeSpell(true);
    }
    return;
  }
  if (_speechTarget === 'exercise') {
    if (_exFinalized) return;
    if (t) _exTranscript = t;
    document.getElementById('vatr').textContent = t || '';
    if (_emic && !_exFinalized && _exRestarts < _EX_MAX_RESTARTS) {
      _exRestarts += 1;
      try { NB.call('startListening'); } catch (_e) { _finalizeEx(true); }
    } else {
      _finalizeEx(true);
    }
  }
}
function onAndroidSpeechError(reason) {
  const msg = reason || "Couldn't hear you";
  reportError('speech', msg, _speechTarget);
  if (window._spellMicActive) {
    if (window._spellMicOn && !window._spellFinalized && (window._spellRestarts || 0) < (window._SPELL_MAX_RESTARTS || 3)) {
      window._spellRestarts = (window._spellRestarts || 0) + 1;
      try { NB.call('startListening'); } catch (_e) { if (typeof window._finalizeSpell === 'function') window._finalizeSpell(true); }
      return;
    }
    if (typeof window._finalizeSpell === 'function') window._finalizeSpell(true);
    return;
  }
  if (_speechTarget === 'exercise') {
    if (_emic && !_exFinalized && _exRestarts < _EX_MAX_RESTARTS) {
      _exRestarts += 1;
      try { NB.call('startListening'); } catch (_e) { _finalizeEx(true); }
      return;
    }
    document.getElementById('vatr').textContent = msg;
    _finalizeEx(true);
  }
}
