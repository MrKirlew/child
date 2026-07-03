import { describe, it, expect } from 'vitest';
import Safety from '../www/js/safety.js';

describe('Safety.checkInput — blocks inappropriate input', () => {
  const bad = ['you are stupid', 'that is so dumb', 'I want a gun', 'kill it', 'you idiot', 'shut up', 'this sucks'];
  bad.forEach((t) => {
    it(`blocks: "${t}"`, () => {
      expect(Safety.checkInput(t).allowed).toBe(false);
      expect(Safety.checkInput(t).reason).toBe('blocked_term');
    });
  });

  it('catches leet / spacing evasion', () => {
    expect(Safety.checkInput('stup1d').allowed).toBe(false);    // 1 -> i
    expect(Safety.checkInput('stuuupid').allowed).toBe(false);  // repeat collapse
    expect(Safety.checkInput('id10t').allowed).toBe(false);     // 1->i, 0->o
  });
});

describe('Safety.checkInput — allows normal K-6 content (no false positives)', () => {
  const good = [
    'What is 7 plus 7?',
    'Tell me about the solar system',
    'How do plants grow?',
    'I passed my class today and got a good grade',
    'The grass is green and the shell is on the beach',
    'Say hello to Ollie',
    'My assignment is about volcanoes',
    'Can you help me spell elephant?',
    'What is photosynthesis?',
    'I love reading stories about space'
  ];
  good.forEach((t) => {
    it(`allows: "${t}"`, () => {
      expect(Safety.checkInput(t).allowed).toBe(true);
    });
  });
});

describe('Safety.checkOutput', () => {
  it('flags unsafe model output', () => {
    expect(Safety.checkOutput('you are stupid').safe).toBe(false);
  });
  it('passes clean educational output', () => {
    expect(Safety.checkOutput('Great job! 7 plus 7 equals 14. Want to try another?').safe).toBe(true);
  });
});

describe('Safety.isBlocked — detects Gemini safety blocks', () => {
  it('detects promptFeedback.blockReason', () => {
    const v = Safety.isBlocked({ promptFeedback: { blockReason: 'SAFETY' } });
    expect(v.blocked).toBe(true);
    expect(v.reason).toBe('SAFETY');
  });
  it('detects finishReason SAFETY', () => {
    const v = Safety.isBlocked({ candidates: [{ finishReason: 'SAFETY' }] });
    expect(v.blocked).toBe(true);
    expect(v.reason).toBe('SAFETY');
  });
  it('detects null/empty payload', () => {
    expect(Safety.isBlocked(null).blocked).toBe(true);
  });
  it('passes a normal successful response', () => {
    const ok = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Hello!' }] } }] };
    expect(Safety.isBlocked(ok).blocked).toBe(false);
  });
});

describe('Safety redirect/nudge messages', () => {
  it('provides non-empty, child-friendly strings', () => {
    expect(typeof Safety.safeRedirect()).toBe('string');
    expect(Safety.safeRedirect().length).toBeGreaterThan(10);
    expect(Safety.safeNudge().length).toBeGreaterThan(10);
    // must not themselves contain blocked terms
    expect(Safety.checkOutput(Safety.safeRedirect()).safe).toBe(true);
    expect(Safety.checkOutput(Safety.safeNudge()).safe).toBe(true);
  });
});

describe('Safety.SAFETY_SETTINGS', () => {
  it('covers all 5 harm categories at BLOCK_LOW_AND_ABOVE', () => {
    const cats = Safety.SAFETY_SETTINGS.map((s) => s.category);
    expect(cats).toContain('HARM_CATEGORY_HARASSMENT');
    expect(cats).toContain('HARM_CATEGORY_HATE_SPEECH');
    expect(cats).toContain('HARM_CATEGORY_SEXUALLY_EXPLICIT');
    expect(cats).toContain('HARM_CATEGORY_DANGEROUS_CONTENT');
    expect(cats).toContain('HARM_CATEGORY_CIVIC_INTEGRITY');
    Safety.SAFETY_SETTINGS.forEach((s) => expect(s.threshold).toBe('BLOCK_LOW_AND_ABOVE'));
  });
});
