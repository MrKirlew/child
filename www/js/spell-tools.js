(function (globalScope) {
  const SPELL_WORD_RE = /^[a-z](?:[a-z'-]*[a-z])?$/i;
  const PRONOUNS = new Set(['it', 'that', 'this', 'them', 'they', 'he', 'she', 'him', 'her']);

  function cleanSpellWord(raw) {
    const normalized = String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, '\'')
      .replace(/^[^a-z]+|[^a-z]+$/g, '');
    if (!normalized || !SPELL_WORD_RE.test(normalized)) return '';
    return normalized;
  }

  function fallbackLetters(word) {
    return cleanSpellWord(word).replace(/[^a-z]/g, '').split('').filter(Boolean);
  }

  function cleanSpellMeaning(word, rawMeaning) {
    const normalizedWord = cleanSpellWord(word);
    let meaning = String(rawMeaning || '')
      .replace(/[*_~`#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!meaning) return 'A great word to learn!';

    const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leadingWordPatterns = [
      new RegExp(`^(?:the\\s+word\\s+)?${escapedWord}\\s+means\\s+`, 'i'),
      new RegExp(`^(?:a|an|the)\\s+${escapedWord}\\s+is\\s+`, 'i'),
      new RegExp(`^${escapedWord}\\s+is\\s+`, 'i'),
      new RegExp(`^${escapedWord}\\s+means\\s+`, 'i')
    ];
    for (const pattern of leadingWordPatterns) meaning = meaning.replace(pattern, '');
    meaning = meaning.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
    return meaning || 'A great word to learn!';
  }

  function buildSpellResult(word, rawMeaning) {
    const cleanWord = cleanSpellWord(word);
    return {
      word: cleanWord,
      letters: fallbackLetters(cleanWord),
      meaning: cleanSpellMeaning(cleanWord, rawMeaning)
    };
  }

  function parseSpellLookup(raw, fallbackWord) {
    const fallback = cleanSpellWord(fallbackWord);
    let parsed = {};
    try {
      parsed = JSON.parse(String(raw || '').replace(/```json|```/g, '').trim());
    } catch (_e) { /* fallback below */ }

    return buildSpellResult(fallback || parsed.word || '', parsed.meaning || '');
  }

  function extractSpellTarget(text) {
    const normalized = String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, '\'');
    if (!normalized) return '';

    const patterns = [
      /^spell\s+(?:the\s+word\s+)?["']?([a-z][a-z'-]*)["']?(?:\s+please)?[.!?]*$/i,
      /^how\s+do\s+(?:you|i)\s+spell\s+["']?([a-z][a-z'-]*)["']?[.!?]*$/i,
      /^can\s+you\s+spell\s+["']?([a-z][a-z'-]*)["']?(?:\s+for\s+me)?[.!?]*$/i,
      /^tell\s+me\s+how\s+to\s+spell\s+["']?([a-z][a-z'-]*)["']?[.!?]*$/i,
      /^what(?:'s| is)\s+the\s+spelling\s+of\s+["']?([a-z][a-z'-]*)["']?[.!?]*$/i
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (!match) continue;
      const candidate = cleanSpellWord(match[1]);
      if (candidate && !PRONOUNS.has(candidate)) return candidate;
    }
    return '';
  }

  function buildSpellTeachMessage(result, fallbackWord) {
    const word = cleanSpellWord((result && result.word) || fallbackWord) || 'word';
    const letters = Array.isArray(result && result.letters) && result.letters.length
      ? result.letters.map(letter => cleanSpellWord(letter)).filter(Boolean)
      : fallbackLetters(word);
    const spelled = letters.length ? letters.map(letter => letter.toUpperCase()).join(', ') : word.toUpperCase();
    const meaning = cleanSpellMeaning(word, result && result.meaning);
    const niceWord = word.charAt(0).toUpperCase() + word.slice(1);
    return `${niceWord}. ${niceWord} is spelled ${spelled}. It means ${meaning}`;
  }

  const SpellTools = { cleanSpellWord, cleanSpellMeaning, buildSpellResult, parseSpellLookup, extractSpellTarget, buildSpellTeachMessage };
  globalScope.SpellTools = SpellTools;
  if (typeof globalThis.module !== 'undefined' && globalThis.module.exports) globalThis.module.exports = SpellTools;
}(typeof window !== 'undefined' ? window : globalThis));
