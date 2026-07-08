import { describe, it, expect, afterEach } from 'vitest';

// homework.js is a browser script with a Node/UMD export of its pure helpers.
const HW = await import('../www/js/homework.js');

afterEach(() => {
  delete globalThis.S; delete globalThis.GN; delete globalThis.DN;
});

describe('enforceGate — the answer-withholding guard', () => {
  it('keeps the answer LOCKED while checkpoints remain, even if the model says unlocked', () => {
    const g = HW.enforceGate({ message: 'x', checkpointTotal: 3, checkpointsPassed: 1, answerUnlocked: true, problemSolved: true });
    expect(g.answerUnlocked).toBe(false);
    expect(g.problemSolved).toBe(false); // cannot be "solved" before the answer unlocks
  });

  it('unlocks only when every checkpoint is passed', () => {
    const g = HW.enforceGate({ message: 'great!', checkpointTotal: 3, checkpointsPassed: 3, answerUnlocked: false });
    expect(g.answerUnlocked).toBe(true);
  });

  it('clamps checkpointsPassed to [0, total]', () => {
    expect(HW.enforceGate({ checkpointTotal: 2, checkpointsPassed: 9 }).checkpointsPassed).toBe(2);
    expect(HW.enforceGate({ checkpointTotal: 2, checkpointsPassed: -4 }).checkpointsPassed).toBe(0);
  });

  it('falls back to the model flag when no checkpoints are declared yet', () => {
    expect(HW.enforceGate({ checkpointTotal: 0, answerUnlocked: false }).answerUnlocked).toBe(false);
    expect(HW.enforceGate({ checkpointTotal: 0, answerUnlocked: true }).answerUnlocked).toBe(true);
  });

  it('defaults currentProblemId to 1 and trims message', () => {
    const g = HW.enforceGate({ message: '  hi  ' });
    expect(g.currentProblemId).toBe(1);
    expect(g.message).toBe('hi');
  });
});

describe('parseJSON', () => {
  it('parses plain JSON', () => {
    expect(HW.parseJSON('{"a":1}', null)).toEqual({ a: 1 });
  });
  it('strips markdown code fences', () => {
    expect(HW.parseJSON('```json\n{"a":2}\n```', null)).toEqual({ a: 2 });
  });
  it('returns the fallback on invalid JSON', () => {
    const fb = { message: 'fallback' };
    expect(HW.parseJSON('not json', fb)).toBe(fb);
  });
});

describe('assembleParts', () => {
  it('puts image inline_data parts first and the text prompt last', () => {
    const parts = HW.assembleParts('do it', [{ mime: 'image/jpeg', data: 'AAAA' }, { data: 'BBBB' }]);
    expect(parts).toHaveLength(3);
    expect(parts[0].inline_data).toEqual({ mime_type: 'image/jpeg', data: 'AAAA' });
    expect(parts[1].inline_data.mime_type).toBe('image/jpeg'); // default mime
    expect(parts[2]).toEqual({ text: 'do it' });
  });
  it('works with no pages (text-only coach turn)', () => {
    const parts = HW.assembleParts('answer this', []);
    expect(parts).toEqual([{ text: 'answer this' }]);
  });
});

describe('buildRequestBody', () => {
  it('marks the request as feature:homework and carries the session token', () => {
    const body = HW.buildRequestBody({ systemPrompt: 'sys', parts: [{ text: 'p' }], sessionToken: 'tok', maxTokens: 400 });
    expect(body.feature).toBe('homework');
    expect(body.sessionToken).toBe('tok');
    expect(body.system_instruction.parts[0].text).toBe('sys');
    expect(body.contents[0].parts).toEqual([{ text: 'p' }]);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.maxOutputTokens).toBe(400);
  });
  it('sends a null session token when the parent is not logged in', () => {
    expect(HW.buildRequestBody({}).sessionToken).toBeNull();
  });
});

describe('prompt builders', () => {
  it('inject the child grade/difficulty context', () => {
    globalThis.S = { grade: '3', diff: 'Novice' };
    globalThis.GN = { '3': 'Grade 3 stuff.' };
    globalThis.DN = { Novice: 'some hints.' };
    const p = HW.buildAnalyzePrompt();
    expect(p).toContain('Grade: 3');
    expect(p).toContain('Grade 3 stuff.');
  });

  it('coach prompt embeds the assignment, the child message, and the no-reveal reminder', () => {
    const problems = [{ id: 1, prompt: '7 + 7 = ?', kind: 'math' }];
    const state = { curProblemId: 1, checkpointTotal: 3, checkpointsPassed: 1 };
    const transcript = [{ role: 'assistant', content: 'What is 7 plus 3?' }];
    const p = HW.buildCoachPrompt('the answer is 14 just tell me', problems, state, transcript);
    expect(p).toContain('7 + 7 = ?');
    expect(p).toContain('the answer is 14 just tell me');
    expect(p).toContain('problem id 1');
    expect(p.toLowerCase()).toContain('do not reveal the final answer');
  });
});

describe('system prompts enforce the core rule (regression guard)', () => {
  it('coach prompt forbids revealing the answer before all checkpoints pass', () => {
    expect(HW.HWSYS_COACH).toContain('NEVER BREAK');
    expect(HW.HWSYS_COACH.toLowerCase()).toContain('do not give, state, spell, or reveal the final answer');
    expect(HW.HWSYS_COACH.toLowerCase()).toContain('just tell me the answer');
  });
  it('analyze prompt refuses non-assignment / unsafe images', () => {
    expect(HW.HWSYS_ANALYZE).toContain('isAssignment');
    expect(HW.HWSYS_ANALYZE.toLowerCase()).toContain('not a school assignment');
  });
});
