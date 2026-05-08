// Tiny event bus for live syncing Progress + Parent Dashboard with the
// rest of the app. Writers (exercises.finishEx, ai.recordLearnActivity,
// ui.spellWord) call progBus.emit('activity', { sub, kind, correct })
// after saveS(). Readers (progress.updProg, ui.openDash) subscribe with
// progBus.on('activity', fn).
//
// Persisted state still flows through saveS() — this bus is only for
// notification of changes so the visible numbers refresh without the
// child having to navigate to/from a tab to trigger updProg() manually.
//
// Loaded as a plain <script> after logger.js, before progress.js so the
// writer modules can reference it via the global.

(function () {
  const _listeners = Object.create(null);

  function on(event, fn) {
    if (!event || typeof fn !== 'function') return;
    const list = _listeners[event] || (_listeners[event] = []);
    list.push(fn);
  }

  function off(event, fn) {
    const list = _listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  }

  function emit(event, data) {
    const list = _listeners[event];
    if (!list || !list.length) return;
    // Snapshot so listeners that subscribe/unsubscribe during dispatch
    // don't shift the iteration index. Each listener is wrapped in
    // try/catch so one bad subscriber doesn't kill the rest.
    const snapshot = list.slice();
    for (let i = 0; i < snapshot.length; i++) {
      try { snapshot[i](data); } catch (e) {
        // Surface to console; don't swallow silently. Don't re-throw —
        // readers shouldn't be able to crash writers.
        if (typeof console !== 'undefined') console.warn('[progBus]', event, e);
      }
    }
  }

  function once(event, fn) {
    const wrapper = (data) => { off(event, wrapper); fn(data); };
    on(event, wrapper);
  }

  // Convenience for writers: stamp `lastActiveAt`, roll the day's count
  // into `dailyCnt`, and emit an 'activity' event in one call. Caller
  // still needs to call saveS() afterwards to persist to localStorage.
  // dailyCnt is capped at 14 most-recent days so it stays tiny in
  // localStorage and bounds the parent-dash sparkline window.
  function recordActivity(state, sub, kind, correct) {
    if (!state) {
      emit('activity', { sub: sub || 'Comprehension', kind: kind || 'unknown', correct: correct === true });
      return;
    }
    state.lastActiveAt = new Date().toISOString();
    const day = state.lastActiveAt.slice(0, 10); // YYYY-MM-DD
    state.dailyCnt = state.dailyCnt || {};
    state.dailyCnt[day] = state.dailyCnt[day] || {};
    const s = sub || 'Comprehension';
    state.dailyCnt[day][s] = (state.dailyCnt[day][s] || 0) + 1;
    // Trim to the 14 most recent days so the map doesn't grow unbounded.
    const days = Object.keys(state.dailyCnt).sort();
    while (days.length > 14) {
      delete state.dailyCnt[days.shift()];
    }
    emit('activity', { sub: s, kind: kind || 'unknown', correct: correct === true });
  }

  const progBus = { on, off, emit, once, recordActivity };
  // Dual export so the module is testable in Node (Vitest CommonJS) and
  // usable in the browser (script-tag global). `module` is undefined in
  // the browser; the typeof guard makes the export branch a safe no-op.
  if (typeof module !== 'undefined' && module.exports) module.exports = progBus;
  if (typeof globalThis !== 'undefined') globalThis.progBus = progBus;
})();
