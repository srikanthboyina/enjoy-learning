// Translation at the edges: code and content stay in English, and `tr(english)` turns a
// string into the child's language just before it is shown or spoken.
//
// Lookup order: exact match → template match ("Put {n} {items} in the basket.", with
// each filled-in value translated on its own) → sentence by sentence. Anything without
// a translation stays in English, so a missing entry never breaks a game.
import { useProgress } from '../services/progressStore';
import type { LanguageId } from './languages';

type Dict = Record<string, string>;

declare const require: {
  context(dir: string, deep: boolean, filter: RegExp): { keys(): string[]; (key: string): unknown };
};

interface Template {
  re: RegExp;
  names: string[];
  out: string;
  literal: number;
}

const files = require.context('../../content/i18n', true, /\.json$/);

const dicts: Partial<Record<LanguageId, Dict>> = {};
for (const key of files.keys()) {
  const m = /^\.\/([a-z]+)\//.exec(key);
  if (!m) continue;
  const lang = m[1] as LanguageId;
  dicts[lang] = { ...(dicts[lang] ?? {}), ...(files(key) as Dict) };
}

const templates: Partial<Record<LanguageId, Template[]>> = {};
const cache: Partial<Record<LanguageId, Map<string, string>>> = {};

function escape(s: string): string {
  return s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

function templatesFor(lang: LanguageId): Template[] {
  const existing = templates[lang];
  if (existing) return existing;
  const list: Template[] = [];
  for (const [src, out] of Object.entries(dicts[lang] ?? {})) {
    if (!/\{\w+\}/.test(src)) continue;
    const names: string[] = [];
    const parts = src.split(/(\{\w+\})/);
    const pattern = parts
      .map((p) => {
        const name = /^\{(\w+)\}$/.exec(p)?.[1];
        if (name) {
          names.push(name);
          return '(.+?)';
        }
        return escape(p);
      })
      .join('');
    list.push({ re: new RegExp(`^${pattern}$`), names, out, literal: src.replace(/\{\w+\}/g, '').length });
  }
  // Most specific (most fixed text) first, so "{n} {part}" is the last resort.
  list.sort((a, b) => b.literal - a.literal);
  templates[lang] = list;
  return list;
}

/** One piece: exact, then template. Returns undefined when there is no translation. */
function lookup(lang: LanguageId, text: string): string | undefined {
  const dict = dicts[lang];
  if (!dict) return undefined;
  const exact = dict[text];
  if (exact !== undefined) return exact;
  for (const t of templatesFor(lang)) {
    const m = t.re.exec(text);
    if (!m) continue;
    // Only use a template when every filled-in value has a translation too.
    const values = t.names.map((_, i) => translate(lang, m[i + 1]));
    if (values.some((v, i) => /[A-Za-z]/.test(m[i + 1]) && v === m[i + 1].trim())) continue;
    let out = t.out;
    t.names.forEach((name, i) => {
      out = out.split(`{${name}}`).join(values[i]);
    });
    return out;
  }
  return undefined;
}

function translate(lang: LanguageId, text: string): string {
  if (lang === 'en' || !text || !/[A-Za-z]/.test(text)) return text;
  const memo = (cache[lang] ??= new Map());
  const hit = memo.get(text);
  if (hit !== undefined) return hit;

  const trimmed = text.trim();
  let result = lookup(lang, trimmed);
  if (result === undefined) {
    if (trimmed.includes('\n')) {
      result = trimmed
        .split('\n')
        .map((line) => translate(lang, line))
        .join('\n');
    } else {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      result =
        sentences.length > 1 ? sentences.map((s) => lookup(lang, s) ?? s).join(' ') : trimmed;
    }
  }
  memo.set(text, result);
  return result;
}

export function currentLanguage(): LanguageId {
  return (useProgress.getState().settings.language ?? 'en') as LanguageId;
}

/** Translate an English string into the chosen language (or a given one). */
export function tr(text: string, lang: LanguageId = currentLanguage()): string {
  return translate(lang, text);
}

/** Fill a template's {placeholders} and translate the whole thing. */
export function trf(template: string, values: Record<string, string | number>): string {
  let english = template;
  for (const [k, v] of Object.entries(values)) english = english.split(`{${k}}`).join(String(v));
  return tr(english);
}

/** Re-renders the caller when the language changes. */
export function useLanguage(): LanguageId {
  return useProgress((s) => s.settings.language ?? 'en') as LanguageId;
}

/** Share of `strings` that have a translation in `lang` (for the parent screen / validator). */
export function hasTranslation(lang: LanguageId, text: string): boolean {
  return lang === 'en' || translate(lang, text) !== text.trim();
}
