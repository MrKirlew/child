import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// progress.js is browser-side and references DOM globals like
// document.getElementById. The pure helpers (_accuracyForSub,
// _weakestSubject, _timeSince) are exported via module.exports for
// testing — they don't touch the DOM.
const { _accuracyForSub, _weakestSubject, _timeSince } = require('../www/js/progress.js');

describe('_accuracyForSub', () => {
  it('returns null when subject has no tries', () => {
    const state = { ex: { Math: { c: 0, t: 0 } } };
    expect(_accuracyForSub(state, 'Math')).toBeNull();
  });

  it('returns rounded percentage when subject has tries', () => {
    const state = { ex: { Math: { c: 7, t: 10 } } };
    expect(_accuracyForSub(state, 'Math')).toBe(70);
  });

  it('handles a missing subject gracefully', () => {
    const state = { ex: {} };
    expect(_accuracyForSub(state, 'Astrology')).toBeNull();
  });

  it('handles a missing ex object', () => {
    expect(_accuracyForSub({}, 'Math')).toBeNull();
  });
});

describe('_weakestSubject', () => {
  it('returns null when no subject has the minimum tries (default 3)', () => {
    const state = { ex: { Math: { c: 0, t: 2 }, Spelling: { c: 0, t: 1 } } };
    expect(_weakestSubject(state)).toBeNull();
  });

  it('returns the subject with the lowest accuracy among those that qualify', () => {
    const state = {
      ex: {
        Math: { c: 1, t: 5 },         // 20%
        Spelling: { c: 4, t: 5 },     // 80%
        Comprehension: { c: 2, t: 4 } // 50%
      }
    };
    expect(_weakestSubject(state)).toBe('Math');
  });

  it('honors a custom min-tries threshold', () => {
    const state = {
      ex: {
        Math: { c: 0, t: 2 },         // not enough samples even though 0%
        Spelling: { c: 4, t: 10 }     // 40%
      }
    };
    // With MIN_TRIES=3 only Spelling qualifies, so it's the weakest.
    expect(_weakestSubject(state, 3)).toBe('Spelling');
    // Lowering the threshold to 2 lets Math qualify and beat Spelling.
    expect(_weakestSubject(state, 2)).toBe('Math');
  });
});

describe('_timeSince', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-07T18:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns "—" for null or invalid input', () => {
    expect(_timeSince(null)).toBe('—');
    expect(_timeSince('not-a-date')).toBe('—');
    expect(_timeSince(undefined)).toBe('—');
  });

  it('returns "just now" for under 60 seconds', () => {
    expect(_timeSince('2026-05-07T17:59:30Z')).toBe('just now');
  });

  it('returns minutes for under 1 hour', () => {
    expect(_timeSince('2026-05-07T17:42:00Z')).toBe('18m ago');
  });

  it('returns hours for under 1 day', () => {
    expect(_timeSince('2026-05-07T10:00:00Z')).toBe('8h ago');
  });

  it('returns days for under 1 week', () => {
    expect(_timeSince('2026-05-04T18:00:00Z')).toBe('3d ago');
  });

  it('returns weeks for older than 7 days', () => {
    expect(_timeSince('2026-04-15T18:00:00Z')).toBe('3w ago');
  });
});
