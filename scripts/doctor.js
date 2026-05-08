#!/usr/bin/env node
// Preflight sanity checks that fail fast with an actionable hint.
// Wired via prelint + pretest npm hooks, so it runs before any CI job.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const errors = [];

// (1) node_modules/.bin/ shims — if npm install was interrupted or ran with
//     --no-bin-links, lint/test fall through to system binaries with confusing
//     errors. Catch it here.
const REQUIRED_BINS = ['eslint', 'vitest'];
const missing = REQUIRED_BINS.filter(b => !fs.existsSync(path.join(root, 'node_modules', '.bin', b)));
if (missing.length) {
  errors.push([
    'Missing npm shims in node_modules/.bin/: ' + missing.join(', '),
    '  This usually means npm install was interrupted or ran with --no-bin-links.',
    '  Fix:  npm rebuild',
  ].join('\n'));
}

// (2) android/gradlew exec bit in the git index. If it's 100644, the Ubuntu
//     CI runner gets a non-executable gradlew and `./gradlew assembleDebug`
//     fails with Permission denied (regressed once already in abfe077).
try {
  const out = execSync('git ls-files --stage android/gradlew', { cwd: root, encoding: 'utf8' }).trim();
  if (out) {
    const mode = out.split(/\s+/)[0];
    if (mode !== '100755') {
      errors.push([
        `android/gradlew has git index mode ${mode} — must be 100755 (executable).`,
        '  CI build-android job will fail with Permission denied otherwise.',
        '  Fix:  git update-index --chmod=+x android/gradlew && git commit -m "fix: restore +x on gradlew"',
      ].join('\n'));
    }
  }
} catch {
  // Not a git work tree (e.g. tarball install) — skip silently.
}

if (errors.length === 0) process.exit(0);

console.error('');
for (const e of errors) { console.error(e); console.error(''); }
process.exit(1);
