import { describe, it, expect } from 'vitest';

// Simulate the JSON parsing logic from callAI in index.html
function parseAIResponse(raw) {
  let p;
  try {
    p = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    p = { message: raw, phonics: [], passage: '', lessonType: 'Teaching', detectedSubject: 'Comprehension' };
  }
  return p;
}

const SUBS = ['Spelling', 'Grammar', 'Comprehension', 'Science', 'Technology', 'Engineering', 'Math'];

describe('AI response parsing', () => {
  it('parses valid JSON response', () => {
    const raw = '{"message":"Great job!","phonics":["h","e","l","l","o"],"passage":"","lessonType":"Spelling","detectedSubject":"Spelling"}';
    const p = parseAIResponse(raw);
    expect(p.message).toBe('Great job!');
    expect(p.phonics).toEqual(['h', 'e', 'l', 'l', 'o']);
    expect(p.detectedSubject).toBe('Spelling');
  });

  it('handles JSON wrapped in markdown code fences', () => {
    const raw = '```json\n{"message":"Hello!","phonics":[],"passage":"","lessonType":"Teaching","detectedSubject":"Math"}\n```';
    const p = parseAIResponse(raw);
    expect(p.message).toBe('Hello!');
    expect(p.detectedSubject).toBe('Math');
  });

  it('falls back to raw text on invalid JSON', () => {
    const raw = 'Just a plain text response from the AI.';
    const p = parseAIResponse(raw);
    expect(p.message).toBe(raw);
    expect(p.lessonType).toBe('Teaching');
    expect(p.detectedSubject).toBe('Comprehension');
    expect(p.phonics).toEqual([]);
  });

  it('handles empty response', () => {
    const p = parseAIResponse('');
    expect(p.message).toBe('');
    expect(p.phonics).toEqual([]);
  });

  it('validates detectedSubject against known subjects', () => {
    const raw = '{"message":"hi","phonics":[],"passage":"","lessonType":"Teaching","detectedSubject":"Spelling"}';
    const p = parseAIResponse(raw);
    const detSub = (p.detectedSubject && SUBS.includes(p.detectedSubject)) ? p.detectedSubject : 'Comprehension';
    expect(SUBS).toContain(detSub);
  });

  it('defaults invalid detectedSubject to Comprehension', () => {
    const raw = '{"message":"hi","phonics":[],"passage":"","lessonType":"Teaching","detectedSubject":"InvalidSubject"}';
    const p = parseAIResponse(raw);
    const detSub = (p.detectedSubject && SUBS.includes(p.detectedSubject)) ? p.detectedSubject : 'Comprehension';
    expect(detSub).toBe('Comprehension');
  });
});
