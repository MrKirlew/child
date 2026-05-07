import { describe, it, expect } from 'vitest';
import '../www/js/spell-tools.js';

const { SpellTools } = globalThis;

describe('SpellTools.extractSpellTarget', () => {
  it('detects direct spell commands', () => {
    expect(SpellTools.extractSpellTarget('spell cat')).toBe('cat');
    expect(SpellTools.extractSpellTarget('Spell the word "because"')).toBe('because');
  });

  it('detects natural spelling questions', () => {
    expect(SpellTools.extractSpellTarget('How do you spell elephant?')).toBe('elephant');
    expect(SpellTools.extractSpellTarget('Can you spell giraffe for me?')).toBe('giraffe');
    expect(SpellTools.extractSpellTarget('Tell me how to spell school')).toBe('school');
  });

  it('ignores non-spelling prompts and vague pronouns', () => {
    expect(SpellTools.extractSpellTarget('Teach me something fun')).toBe('');
    expect(SpellTools.extractSpellTarget('How do you spell it?')).toBe('');
  });
});

describe('SpellTools.parseSpellLookup', () => {
  it('parses valid JSON spell lookups', () => {
    const raw = '{"word":"cat","letters":["c","a","t"],"meaning":"A small pet animal."}';
    expect(SpellTools.parseSpellLookup(raw, 'cat')).toEqual({
      word: 'cat',
      letters: ['c', 'a', 't'],
      meaning: 'A small pet animal.'
    });
  });

  it('handles fenced JSON spell lookups', () => {
    const raw = '```json\n{"word":"lion","letters":["l","i","o","n"],"meaning":"A big wild cat."}\n```';
    expect(SpellTools.parseSpellLookup(raw, 'lion')).toEqual({
      word: 'lion',
      letters: ['l', 'i', 'o', 'n'],
      meaning: 'A big wild cat.'
    });
  });

  it('falls back to cleaned word letters and default meaning on malformed JSON', () => {
    expect(SpellTools.parseSpellLookup('not json', 'apple')).toEqual({
      word: 'apple',
      letters: ['a', 'p', 'p', 'l', 'e'],
      meaning: 'A great word to learn!'
    });
  });

  it('keeps the requested word canonical even if the AI drifts', () => {
    const raw = '{"word":"trink","letters":["t","r","i","n","k"],"meaning":"A trunk is the thick stem of a tree."}';
    expect(SpellTools.parseSpellLookup(raw, 'trunk')).toEqual({
      word: 'trunk',
      letters: ['t', 'r', 'u', 'n', 'k'],
      meaning: 'the thick stem of a tree.'
    });
  });
});

describe('SpellTools.buildSpellTeachMessage', () => {
  it('builds the word-spell-define learn message', () => {
    const msg = SpellTools.buildSpellTeachMessage({
      word: 'otter',
      letters: ['o', 't', 't', 'e', 'r'],
      meaning: 'A playful animal that swims.'
    }, 'otter');
    expect(msg).toBe('Otter. Otter is spelled O, T, T, E, R. It means A playful animal that swims.');
  });

  it('spells every letter of a long word without dropping duplicates', () => {
    const msg = SpellTools.buildSpellTeachMessage({
      word: 'butterfly',
      letters: ['b', 'u', 't', 't', 'e', 'r', 'f', 'l', 'y'],
      meaning: 'A colorful flying insect with large wings.'
    }, 'butterfly');
    expect(msg).toBe('Butterfly. Butterfly is spelled B, U, T, T, E, R, F, L, Y. It means A colorful flying insect with large wings.');
  });
});

describe('SpellTools.buildSpellResult', () => {
  it('derives letters from the input word for multi-letter words (fallback path)', () => {
    // Guards the runSpellCeremony fallback: when the AI returns no letters,
    // the ceremony gets the full per-letter sequence from this builder.
    expect(SpellTools.buildSpellResult('butterfly', '').letters).toEqual(
      ['b', 'u', 't', 't', 'e', 'r', 'f', 'l', 'y']
    );
    expect(SpellTools.buildSpellResult('caterpillar', '').letters).toEqual(
      ['c', 'a', 't', 'e', 'r', 'p', 'i', 'l', 'l', 'a', 'r']
    );
  });
});

describe('SpellTools.cleanSpellMeaning', () => {
  it('removes leading target-word scaffolding from meanings', () => {
    expect(SpellTools.cleanSpellMeaning('trunk', 'Trunk is the thick stem of a tree.')).toBe('the thick stem of a tree.');
    expect(SpellTools.cleanSpellMeaning('trunk', 'The word trunk means a storage box.')).toBe('a storage box.');
  });
});
