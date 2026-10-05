import { getGame } from '../games/registry';
import type { LevelProgress } from '../services/progressStore';
import { getLevels } from './loadContent';
import { levelKey } from './scoring';
import type { Difficulty, Level, Topic } from './types';

/** A topic is playable once its game is registered and it has at least one valid level. */
export function isPlayable(topic: Topic): boolean {
  return !!getGame(topic.gameId) && getLevels(topic.id).length > 0;
}

function summarize(topicId: string, list: Level[], levels: Record<string, LevelProgress>) {
  const stars = list.map((l) => levels[levelKey(topicId, l.id)]?.bestStars ?? 0);
  return {
    earned: stars.reduce<number>((a, b) => a + b, 0),
    max: list.length * 3,
    done: stars.filter((s) => s > 0).length,
    total: list.length,
  };
}

export function topicStars(topic: Topic, levels: Record<string, LevelProgress>) {
  return summarize(topic.id, getLevels(topic.id), levels);
}

export function difficultyStars(topic: Topic, difficulty: Difficulty, levels: Record<string, LevelProgress>) {
  return summarize(
    topic.id,
    getLevels(topic.id).filter((l) => l.difficulty === difficulty),
    levels,
  );
}

export function isTopicUnlocked(topic: Topic, topics: Topic[], levels: Record<string, LevelProgress>): boolean {
  if (!topic.unlockAfter) return true;
  const prereq = topics.find((t) => t.id === topic.unlockAfter);
  if (!prereq) return true;
  const s = topicStars(prereq, levels);
  return s.total > 0 && s.done === s.total;
}
