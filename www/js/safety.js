/* ══ CHILD-SAFETY FILTER — shared, isomorphic (browser global + Node require) ══
 *
 * Defense-in-depth AROUND Google Gemini's safetySettings (already BLOCK_LOW_AND_ABOVE),
 * NOT a replacement. Covers the K-6-appropriateness layer Gemini's harm categories
 * may not catch (bullying, meanness, mild profanity, weapon/violence words) plus
 * detection of Gemini's own safety blocks so the child gets a kind redirect instead
 * of a blank/error bubble.
 *
 * Design notes:
 *  - Explicit sexual terms / slurs are intentionally NOT hard-coded here (kept out of
 *    git history per docs/followups/child-safety-input-output-filtering.md). Those are
 *    handled by Gemini's safetySettings. An optional gitignored extension list can be
 *    supplied at runtime via window.SAFETY_EXTRA_TERMS (browser) or the SAFETY_EXTRA_TERMS
 *    env var as a comma list (Node) — merged into the blocklist without being committed.
 *  - Matching is whole-word after light leet/repeat normalization to avoid the
 *    "Scunthorpe problem" (so class/pass/hello/shell/assignment all pass).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Safety = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // Gemini safety settings — single source of truth for REST + Live paths.
  // Keep in sync with the SAFETY array in api/ai/generate.js (kept literal there
  // so the source-grep test stays valid).
  const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_LOW_AND_ABOVE' }
  ];

  // Base list — words that are inappropriate-for-K-6 but not offensive to read in
  // source (bullying/meanness, mild profanity, weapon/violence). Whole-word matched.
  const BASE_TERMS = [
    // meanness / bullying
    'stupid', 'idiot', 'dumb', 'dummy', 'moron', 'loser', 'ugly', 'jerk',
    'freak', 'weirdo', 'hater', 'shutup', 'shuddup',
    // mild profanity
    'damn', 'hell', 'crap', 'sucks', 'suck', 'bloody', 'butt',
    // violence / weapons
    'kill', 'killing', 'murder', 'gun', 'guns', 'bomb', 'stab', 'weapon', 'weapons', 'violent'
  ];

  function _extraTerms() {
    const out = [];
    try {
      if (typeof window !== 'undefined' && Array.isArray(window.SAFETY_EXTRA_TERMS)) {
        window.SAFETY_EXTRA_TERMS.forEach(t => out.push(t));
      }
    } catch (_e) { /* no window */ }
    try {
      const proc = (typeof globalThis !== 'undefined') ? globalThis.process : undefined;
      if (proc && proc.env && proc.env.SAFETY_EXTRA_TERMS) {
        proc.env.SAFETY_EXTRA_TERMS.split(',').forEach(t => out.push(t.trim()));
      }
    } catch (_e) { /* no process */ }
    return out;
  }

  // Multi-word phrases (each innocuous word by itself) — matched as substrings
  // of the normalized text.
  const BASE_PHRASES = ['shut up', 'shut it'];

  function _buildSet() {
    const s = new Set();
    BASE_TERMS.concat(_extraTerms()).forEach(t => { const n = normalize(t); if (n) s.add(n); });
    return s;
  }
  const _phraseSet = BASE_PHRASES.map(normalize);

  // Lowercase, map common leet substitutions, collapse 3+ repeats to 2.
  function normalize(s) {
    return String((s === null || s === undefined) ? '' : s)
      .toLowerCase()
      .replace(/[@4]/g, 'a')
      .replace(/3/g, 'e')
      .replace(/[1!|]/g, 'i')
      .replace(/0/g, 'o')
      .replace(/[5$]/g, 's')
      .replace(/7/g, 't')
      .replace(/(.)\1{2,}/g, '$1$1');
  }

  function _tokens(s) {
    return normalize(s).split(/[^a-z]+/).filter(Boolean);
  }

  let _blockSet = _buildSet();
  // Allow tests / runtime to refresh after setting extra terms.
  function _refresh() { _blockSet = _buildSet(); return _blockSet.size; }

  function _hasBlockedTerm(text) {
    for (const tok of _tokens(text)) {
      // token, plus a de-doubled variant ("stuupid" -> "stupid")
      if (_blockSet.has(tok) || _blockSet.has(tok.replace(/(.)\1+/g, '$1'))) return true;
    }
    const n = normalize(text);
    for (const p of _phraseSet) { if (n.indexOf(p) !== -1) return true; }
    return false;
  }

  // Pre-model: is the child's input OK to send? { allowed, reason }
  function checkInput(text) {
    if (_hasBlockedTerm(text)) return { allowed: false, reason: 'blocked_term' };
    return { allowed: true };
  }

  // Post-model: is the AI's output safe to show/speak? { safe }
  function checkOutput(text) {
    return { safe: !_hasBlockedTerm(text) };
  }

  // Inspect a Gemini generateContent response for a safety block or empty result.
  // { blocked, reason }
  function isBlocked(data) {
    if (!data) return { blocked: true, reason: 'EMPTY' };
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      return { blocked: true, reason: data.promptFeedback.blockReason };
    }
    const cand = data.candidates && data.candidates[0];
    if (cand && cand.finishReason === 'SAFETY') return { blocked: true, reason: 'SAFETY' };
    return { blocked: false };
  }

  // Kind redirect when content is blocked/filtered (spoken to the child).
  function safeRedirect() {
    return "Let's talk about something else! Want to try a fun science or math question? 🐙";
  }

  // Gentle nudge when the child's own input is filtered (not echoed back).
  function safeNudge() {
    return "Let's keep our words kind! 😊 Ask me about science, math, reading, or spelling!";
  }

  return {
    SAFETY_SETTINGS,
    normalize,
    checkInput,
    checkOutput,
    isBlocked,
    safeRedirect,
    safeNudge,
    _refresh
  };
});
