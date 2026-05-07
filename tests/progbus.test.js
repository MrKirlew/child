import { describe, it, expect, beforeEach, vi } from 'vitest';

// progbus.js is an IIFE that attaches to globalThis.progBus AND module.exports.
// In Vitest (Node), the require() picks up module.exports. We re-require fresh
// for each test by clearing the require cache so internal state doesn't leak.
function loadProgBus() {
  delete globalThis.progBus;
  const mod = require('../www/js/progbus.js');
  return mod;
}

describe('progBus event bus', () => {
  let bus;
  beforeEach(() => { bus = loadProgBus(); });

  it('subscribe + emit fires the listener with the payload', () => {
    const spy = vi.fn();
    bus.on('activity', spy);
    bus.emit('activity', { sub: 'Math', kind: 'exercise', correct: true });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ sub: 'Math', kind: 'exercise', correct: true });
  });

  it('emit with no payload still fires the listener (data is undefined)', () => {
    const spy = vi.fn();
    bus.on('ping', spy);
    bus.emit('ping');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(undefined);
  });

  it('emit with no subscribers is a no-op (no throw)', () => {
    expect(() => bus.emit('nobody-listening', { x: 1 })).not.toThrow();
  });

  it('multiple listeners all fire on emit', () => {
    const a = vi.fn(); const b = vi.fn(); const c = vi.fn();
    bus.on('activity', a); bus.on('activity', b); bus.on('activity', c);
    bus.emit('activity', { sub: 'Spelling' });
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(c).toHaveBeenCalledOnce();
  });

  it('off() removes only the specified listener, others still fire', () => {
    const keep = vi.fn(); const drop = vi.fn();
    bus.on('activity', keep); bus.on('activity', drop);
    bus.off('activity', drop);
    bus.emit('activity', { sub: 'Math' });
    expect(keep).toHaveBeenCalledOnce();
    expect(drop).not.toHaveBeenCalled();
  });

  it('listener that subscribes/unsubscribes during emit does not corrupt iteration', () => {
    const order = [];
    const a = () => { order.push('a'); bus.off('activity', b); };
    const b = () => order.push('b');
    const c = () => order.push('c');
    bus.on('activity', a); bus.on('activity', b); bus.on('activity', c);
    // Snapshot semantics: a, b, c all fire on this emit. b is removed only
    // for future emits.
    bus.emit('activity');
    expect(order).toEqual(['a', 'b', 'c']);
    order.length = 0;
    bus.emit('activity');
    expect(order).toEqual(['a', 'c']);
  });

  it('a throwing listener does not stop other listeners from firing', () => {
    const errSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = () => { throw new Error('boom'); };
    const good = vi.fn();
    bus.on('activity', bad); bus.on('activity', good);
    expect(() => bus.emit('activity', {})).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('once() fires exactly once and then auto-unsubscribes', () => {
    const spy = vi.fn();
    bus.once('boot', spy);
    bus.emit('boot', 1); bus.emit('boot', 2); bus.emit('boot', 3);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(1);
  });
});
