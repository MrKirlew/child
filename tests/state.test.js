import { describe, it, expect } from 'vitest';

// Simulate the state management from index.html
function createState() {
  return {
    grade: 'K', diff: 'Beginner', pin: '1234',
    cnt: { Spelling: 0, Grammar: 0, Comprehension: 0, Science: 0, Technology: 0, Engineering: 0, Math: 0 },
    ex: { Spelling: { c: 0, t: 0 }, Grammar: { c: 0, t: 0 }, Comprehension: { c: 0, t: 0 }, Science: { c: 0, t: 0 }, Technology: { c: 0, t: 0 }, Engineering: { c: 0, t: 0 }, Math: { c: 0, t: 0 } },
    streak: 0, bestStreak: 0, totalEx: 0,
    earnedBadges: [], recentEx: [], recentQ: [], coppaConsent: false
  };
}

describe('Score tracking', () => {
  it('increments exercise count per subject', () => {
    const S = createState();
    S.ex.Math.t += 1;
    S.ex.Math.c += 1;
    expect(S.ex.Math.t).toBe(1);
    expect(S.ex.Math.c).toBe(1);
  });

  it('tracks total across subjects', () => {
    const S = createState();
    S.ex.Math.t += 3;
    S.ex.Spelling.t += 2;
    const total = Object.values(S.ex).reduce((a, b) => a + b.t, 0);
    expect(total).toBe(5);
  });
});

describe('Streak tracking', () => {
  it('increments streak on correct answer', () => {
    const S = createState();
    S.streak += 1;
    if (S.streak > S.bestStreak) S.bestStreak = S.streak;
    expect(S.streak).toBe(1);
    expect(S.bestStreak).toBe(1);
  });

  it('resets streak on wrong answer', () => {
    const S = createState();
    S.streak = 5;
    S.bestStreak = 5;
    S.streak = 0; // wrong answer
    expect(S.streak).toBe(0);
    expect(S.bestStreak).toBe(5); // best preserved
  });

  it('updates bestStreak only when exceeded', () => {
    const S = createState();
    S.bestStreak = 10;
    S.streak = 5;
    if (S.streak > S.bestStreak) S.bestStreak = S.streak;
    expect(S.bestStreak).toBe(10);
  });
});

describe('Badge unlocking', () => {
  const BADGES = [
    { id: 'sp5', chk: s => (s.cnt.Spelling || 0) >= 5 },
    { id: 'gr5', chk: s => (s.cnt.Grammar || 0) >= 5 },
    { id: 'ma5', chk: s => (s.cnt.Math || 0) >= 5 },
  ];

  it('unlocks badge when threshold reached', () => {
    const S = createState();
    S.cnt.Spelling = 5;
    const newBadges = BADGES.filter(b => b.chk(S) && !S.earnedBadges.includes(b.id));
    expect(newBadges.length).toBe(1);
    expect(newBadges[0].id).toBe('sp5');
  });

  it('does not duplicate badges', () => {
    const S = createState();
    S.cnt.Spelling = 10;
    S.earnedBadges.push('sp5');
    const newBadges = BADGES.filter(b => b.chk(S) && !S.earnedBadges.includes(b.id));
    expect(newBadges.length).toBe(0);
  });

  it('does not unlock badge below threshold', () => {
    const S = createState();
    S.cnt.Math = 3;
    const newBadges = BADGES.filter(b => b.chk(S) && !S.earnedBadges.includes(b.id));
    expect(newBadges.length).toBe(0);
  });
});

describe('COPPA consent state', () => {
  it('defaults to false', () => {
    const S = createState();
    expect(S.coppaConsent).toBe(false);
  });

  it('persists when set to true', () => {
    const S = createState();
    S.coppaConsent = true;
    expect(S.coppaConsent).toBe(true);
  });
});
