/// <reference types="node" />
// Writes one JSON list of English strings per content file, for translators.
// Usage: npx tsx scripts/i18n-extract.ts <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { stringsByFile } from './i18n-strings';

const out = process.argv[2];
if (!out) throw new Error('usage: i18n-extract <outDir>');
mkdirSync(out, { recursive: true });
let total = 0;
for (const [id, list] of Object.entries(stringsByFile(join(__dirname, '..', 'content')))) {
  writeFileSync(join(out, `${id}.json`), JSON.stringify(list, null, 1) + '\n');
  total += list.length;
}
console.log(`${total} strings`);
