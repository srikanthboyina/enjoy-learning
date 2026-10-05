import type { Level, Stars } from './types';

const DEFAULT_RULE = { three: 0, two: 2 };
/** A hint costs half a mistake. */
const HINT_COST = 0.5;

/** Finishing always earns at least 1 star. */
export function starsFor(level: Level, mistakes: number, hints: number): Stars {
  const rule = level.stars ?? DEFAULT_RULE;
  const cost = mistakes + hints * HINT_COST;
  if (cost <= rule.three) return 3;
  if (cost <= rule.two) return 2;
  return 1;
}

/** Progress key. The first topics used gameId here; their topic ids are identical. */
export function levelKey(topicId: string, levelId: string): string {
  return `${topicId}/${levelId}`;
}
