/// <reference types="node" />
// Lists every piece of text in content/ that is shown or spoken, so it can be translated.
// Shared by scripts/validate-content.ts (coverage check) and scripts/i18n-extract.ts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Object keys whose string values are words a child hears or sees. */
export const TEXT_KEYS = new Set(['say', 'ask', 'explain', 'why', 'hint', 'caption', 'label', 'name', 'title', 'blurb', 'text']);

/** Only strings with letters need translating ("3 + 2", "🍎" do not). */
export const needsTranslation = (s: string) => /[A-Za-z]/.test(s);

export function collectStrings(value: unknown, out: Set<string>): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') {
        if (TEXT_KEYS.has(k) && needsTranslation(v)) out.add(v);
      } else collectStrings(v, out);
    }
  }
  return out;
}

/** content file name (without .json / .levels.json) → its translatable strings */
export function stringsByFile(contentDir: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const f of readdirSync(contentDir).filter((f) => f.endsWith('.json'))) {
    const id = f.replace(/\.levels\.json$|\.json$/, '');
    result[id] = [...collectStrings(JSON.parse(readFileSync(join(contentDir, f), 'utf8')), new Set())].sort();
  }
  return result;
}
