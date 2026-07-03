/* ══ ACCESSIBILITY — keyboard operability for custom click controls (WCAG 2.1.1, 4.1.2) ══
 * Many controls are styled <div>s with onclick (grade pill, answer tiles, setting
 * pills). This makes them focusable + keyboard-activatable (Enter/Space) and gives
 * them role=button, for static AND dynamically-rendered controls. No markup churn.
 */
(function () {
  'use strict';
  const SEL = '.pl, .mco, .hpill';

  function enhance(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') return;
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
  }
  function enhanceAll(root) {
    (root || document).querySelectorAll(SEL).forEach(enhance);
  }

  // Enter / Space activates any custom role=button control.
  document.addEventListener('keydown', function (e) {
    const el = e.target;
    if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && el && el.getAttribute &&
        el.getAttribute('role') === 'button' && el.tagName !== 'BUTTON' && el.tagName !== 'A') {
      e.preventDefault();
      if (typeof el.click === 'function') el.click();
    }
  });

  function start() {
    enhanceAll(document);
    if (typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(function (muts) {
        for (let i = 0; i < muts.length; i++) {
          const added = muts[i].addedNodes;
          for (let j = 0; j < added.length; j++) {
            const n = added[j];
            if (n.nodeType !== 1) continue;
            if (n.matches && n.matches(SEL)) enhance(n);
            if (n.querySelectorAll) n.querySelectorAll(SEL).forEach(enhance);
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') start();
    else document.addEventListener('DOMContentLoaded', start);
  }
})();
