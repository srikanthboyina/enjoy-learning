// Validation shared by the app (loadContent.ts) and scripts/validate-content.ts. Pure TS.
import type { z } from 'zod';

import { ROUND_SCHEMAS } from '../games/schemas';
import { DIFFICULTIES, LevelFileSchema, TopicsFileSchema, levelSchema } from './contentSchema';
import type { GameId, Level, Topic } from './types';

export interface ParseIssue {
  where: string;
  message: string;
}

function formatZod(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

export function parseTopics(raw: unknown, issues: ParseIssue[]): Topic[] {
  const result = TopicsFileSchema.safeParse(raw);
  if (!result.success) {
    issues.push({ where: 'topics.json', message: formatZod(result.error) });
    return [];
  }
  const ids = new Set<string>();
  for (const t of result.data) {
    if (ids.has(t.id)) issues.push({ where: 'topics.json', message: `duplicate topic id "${t.id}"` });
    ids.add(t.id);
  }
  return result.data;
}

/** Simple first, then medium, then complex; `order` within each. */
export function sortLevels<T extends { difficulty: string; order: number }>(levels: T[]): T[] {
  const rank = (d: string) => (DIFFICULTIES as readonly string[]).indexOf(d);
  return [...levels].sort((a, b) => rank(a.difficulty) - rank(b.difficulty) || a.order - b.order);
}

export function parseLevelFile(
  file: string,
  raw: unknown,
  issues: ParseIssue[],
): { topicId?: string; gameId?: GameId; levels: Level[] } {
  const header = LevelFileSchema.safeParse(raw);
  if (!header.success) {
    issues.push({ where: file, message: formatZod(header.error) });
    return { levels: [] };
  }
  const { gameId, topicId } = header.data;
  const roundSchema = ROUND_SCHEMAS[gameId];
  if (!roundSchema) {
    issues.push({ where: file, message: `no round schema registered for "${gameId}"` });
    return { topicId, gameId, levels: [] };
  }
  const schema = levelSchema(roundSchema);
  const levels: Level[] = [];
  const ids = new Set<string>();
  header.data.levels.forEach((rawLevel, i) => {
    const parsed = schema.safeParse(rawLevel);
    const label = `${file} levels[${i}]`;
    if (!parsed.success) {
      issues.push({ where: label, message: formatZod(parsed.error) });
      return;
    }
    if (ids.has(parsed.data.id)) {
      issues.push({ where: label, message: `duplicate level id "${parsed.data.id}"` });
      return;
    }
    ids.add(parsed.data.id);
    levels.push(parsed.data as Level);
  });
  return { topicId, gameId, levels: sortLevels(levels) };
}
