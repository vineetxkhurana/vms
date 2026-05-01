#!/usr/bin/env node
// Workaround for @cloudflare/next-on-pages duplicate chunk identifier bug
// See: https://github.com/cloudflare/next-on-pages/issues
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', '@cloudflare', 'next-on-pages', 'dist', 'index.js');

if (!fs.existsSync(file)) {
  console.log('next-on-pages not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(file, 'utf8');
const marker = 'process.exit(1);\n    }\n    uniqueIdentifiers.add(ident.identifier);';

if (content.includes(marker)) {
  content = content.replace(marker, 'continue;\n    }\n    uniqueIdentifiers.add(ident.identifier);');
  fs.writeFileSync(file, content);
  console.log('Patched next-on-pages: skip duplicate chunk identifiers instead of aborting');
} else {
  console.log('next-on-pages already patched or patch not applicable');
}
