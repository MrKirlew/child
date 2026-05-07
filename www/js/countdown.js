/* ══ COUNTDOWN — visible 60s talk window for every mic surface ══
 *
 * One reusable timer that drives Learn / Exercise / Spell mics. Renders an
 * SVG ring + numeric seconds inside a caller-provided element. Honors
 * prefers-reduced-motion (skips ring drain animation, keeps numeric ticks).
 * Idempotent — repeated start() calls cancel and replace the active timer;
 * stop() is safe to call when nothing is running.
 *
 * Usage:
 *   Countdown.start({ seconds: 60, mountEl, variant: 'learn',
 *                     onTick: n => {}, onExpire: () => {} });
 *   Countdown.stop();
 *   Countdown.isRunning();
 *   Countdown.reset();      // restart current timer back to its initial seconds
 */
(function (global) {
  const RING_R = 30;
  const RING_C = 2 * Math.PI * RING_R;
  const REDUCE_MOTION = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let _interval = null;
  let _mountEl = null;
  let _wrapEl = null;
  let _ringEl = null;
  let _numEl = null;
  let _labelEl = null;
  let _seconds = 60;
  let _initial = 60;
  let _onTick = null;
  let _onExpire = null;

  function _render(variant) {
    const wrap = document.createElement('div');
    wrap.className = 'kai-cd ' + (variant === 'warm' ? 'kai-cd warm' : 'kai-cd ' + (variant || 'learn'));
    wrap.setAttribute('role', 'timer');
    wrap.setAttribute('aria-live', 'off');
    wrap.innerHTML = ''
      + '<svg class="kai-cd-ring" viewBox="0 0 72 72" aria-hidden="true">'
      +   '<circle class="kai-cd-track" cx="36" cy="36" r="' + RING_R + '"></circle>'
      +   '<circle class="kai-cd-bar"   cx="36" cy="36" r="' + RING_R + '"'
      +     ' stroke-dasharray="' + RING_C.toFixed(2) + '"'
      +     ' stroke-dashoffset="0"></circle>'
      + '</svg>'
      + '<span class="kai-cd-n">' + _seconds + '</span>'
      + '<span class="kai-cd-lbl">Take your time — I\'m listening</span>';
    return wrap;
  }

  function _updateUI() {
    if (!_wrapEl) return;
    if (_numEl) _numEl.textContent = String(_seconds);
    if (_ringEl && !REDUCE_MOTION) {
      const drained = ((_initial - _seconds) / _initial) * RING_C;
      _ringEl.setAttribute('stroke-dashoffset', drained.toFixed(2));
    }
    if (_labelEl) {
      if (_seconds === 0) _labelEl.textContent = 'All done! Great job talking.';
      else if (_seconds <= 10) _labelEl.textContent = 'Almost done — no rush';
      else _labelEl.textContent = "Take your time — I'm listening";
    }
  }

  function _tick() {
    _seconds = Math.max(0, _seconds - 1);
    _updateUI();
    if (typeof _onTick === 'function') { try { _onTick(_seconds); } catch (_e) { /* swallow */ } }
    if (_seconds <= 0) {
      const cb = _onExpire;
      stop();
      if (typeof cb === 'function') { try { cb(); } catch (_e) { /* swallow */ } }
    }
  }

  function start(opts) {
    stop();
    _initial = Math.max(1, (opts && opts.seconds) || 60);
    _seconds = _initial;
    _onTick = (opts && opts.onTick) || null;
    _onExpire = (opts && opts.onExpire) || null;
    _mountEl = (opts && opts.mountEl) || null;
    if (!_mountEl) return;
    _wrapEl = _render(opts && opts.variant);
    _ringEl = _wrapEl.querySelector('.kai-cd-bar');
    _numEl = _wrapEl.querySelector('.kai-cd-n');
    _labelEl = _wrapEl.querySelector('.kai-cd-lbl');
    _mountEl.appendChild(_wrapEl);
    _updateUI();
    _interval = setInterval(_tick, 1000);
  }

  function stop() {
    if (_interval) { clearInterval(_interval); _interval = null; }
    if (_wrapEl && _wrapEl.parentNode) _wrapEl.parentNode.removeChild(_wrapEl);
    _wrapEl = _ringEl = _numEl = _labelEl = null;
    _onTick = _onExpire = null;
  }

  function reset() {
    if (!_interval) return;
    _seconds = _initial;
    _updateUI();
  }

  function isRunning() { return !!_interval; }

  global.Countdown = { start: start, stop: stop, reset: reset, isRunning: isRunning };
})(typeof window !== 'undefined' ? window : this);
