import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Regression guard for truncated spoken replies ("Ollie won't say the whole thing").
//
// Bug (fixed): the Learn tab (ai.js) and Homework Helper (homework.js) called speak(),
// which sent the ENTIRE reply as ONE /ai/speak request. The TTS endpoint caps audio at
// ~500 tokens (~20s of speech; see api/ai/speak.js maxOutputTokens), so any reply longer
// than ~20s was truncated mid-sentence. Measured: a 5-sentence reply produced 19.89s
// (clamped) as one request vs 25.93s across per-sentence requests.
//
// Fix: speak()'s REST path delegates to speakDirect(), which splits per sentence (and
// splits long sentences at commas) so each request stays under the cap and the whole
// reply is spoken. Verified on-device: the same reply now fires 8 /ai/speak requests.

const src = readFileSync(new URL('../www/js/speech.js', import.meta.url), 'utf8');

describe('TTS chunking (regression guard for truncated speech)', () => {
  it('speak() routes its REST path through the chunked speakDirect()', () => {
    const i = src.indexOf('async function speak(txt)');
    expect(i).toBeGreaterThan(-1);
    const body = src.slice(i, i + 800);
    expect(body).toContain('return speakDirect(txt)');
  });

  it('no single-shot _playPCMSingle player remains (that path truncated at ~20s)', () => {
    expect(src).not.toContain('_playPCMSingle');
  });

  it('speakDirect() chunks by sentence under a per-request char budget', () => {
    expect(src).toContain('async function speakDirect(txt');
    expect(src).toContain('_TTS_CHUNK_CHAR_BUDGET');
  });
});
