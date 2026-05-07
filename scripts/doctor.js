#!/usr/bin/env node
// Sanity-checks node_modules/.bin/ for the shims we depend on. If npm
// install was interrupted, run with --no-bin-links, or any of the other
// states that leave .bin/ empty, this fails fast with a fix hint instead
// of letting `npm run lint` fall through to the system eslint and emit
// a confusing "es2022 unknown" error.

const fs = require('fs');
const path = require('path');

const REQUIRED = ['eslint', 'vitest'];
const root = path.join(__dirname, '..');
const missing = REQUIRED.filter(b => !fs.existsSync(path.join(root, 'node_modules', '.bin', b)));

if (missing.length === 0) process.exit(0);

console.error('');
console.error('Missing npm shims in node_modules/.bin/: ' + missing.join(', '));
console.error('  This usually means npm install was interrupted or ran with --no-bin-links.');
console.error('  Fix:  npm rebuild');
console.error('');
process.exit(1);
