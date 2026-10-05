import { getGame } from '../games/registry';
import type { LevelProgress } from '../services/progressStore';
import { getLevels } from './loadContent';
import { levelKey } from './scoring';
import type { Topic } from './types';

/** A topic is playable once its game is registered and it has at least one valid level. */
export function isPlayable(topic: Topic): boolean {
  return !!getGame(topic.gameId) && getLevels(topic.gameId).length > 0;
}

export function topicStars(topic: Topic, levels: Record<string, LevelProgress>) {
  const all = getLevels(topic.gameId);
  const earned = all.reduce((sum, l) => sum + (levels[levelKey(topic.gameId, l.id)]?.bestStars ?? 0), 0);
  const done = all.filter((l) => (levels[levelKey(topic.gameId, l.id)]?.bestStars ?? 0) > 0).length;
  return { earned, max: all.length * 3, done, total: all.length };
}

export function isTopicUnlocked(topic: Topic, topics: Topic[], levels: Record<string, LevelProgress>): boolean {
  if (!topic.unlockAfter) return true;
  const prereq = topics.find((t) => t.id === topic.unlockAfter);
  if (!prereq) return true;
  const s = topicStars(prereq, levels);
  return s.total > 0 && s.done === s.total;
}
