// Loads and validates content/*.json once at startup.
// To add a new game's levels: import its JSON below and add it to LEVEL_FILES.
import compareLevels from '../../content/compare.levels.json';
import countingLevels from '../../content/counting.levels.json';
import fractionsLevels from '../../content/fractions.levels.json';
import matterLevels from '../../content/matter.levels.json';
import topicsJson from '../../content/topics.json';
import { parseLevelFile, parseTopics, type ParseIssue } from './parseContent';
import type { GameId, Level, Topic } from './types';

const LEVEL_FILES: Record<string, unknown> = {
  'counting.levels.json': countingLevels,
  'fractions.levels.json': fractionsLevels,
  'matter.levels.json': matterLevels,
  'compare.levels.json': compareLevels,
};

function load() {
  const issues: ParseIssue[] = [];
  const topics = parseTopics(topicsJson, issues);
  const levelsByGame: Partial<Record<GameId, Level[]>> = {};
  for (const [file, raw] of Object.entries(LEVEL_FILES)) {
    const { gameId, levels } = parseLevelFile(file, raw, issues);
    if (gameId) levelsByGame[gameId] = levels;
  }
  if (issues.length && __DEV__) {
    console.error(
      'Content problems (run `npm run validate:content`):\n' +
        issues.map((i) => `  ${i.where}: ${i.message}`).join('\n'),
    );
  }
  return { topics, levelsByGame };
}

const content = load();

export function getTopics(): Topic[] {
  return content.topics;
}

export function getTopic(topicId: string): Topic | undefined {
  return content.topics.find((t) => t.id === topicId);
}

export function getLevels(gameId: GameId): Level[] {
  return content.levelsByGame[gameId] ?? [];
}

export function getLevel(gameId: GameId, levelId: string): Level | undefined {
  return getLevels(gameId).find((l) => l.id === levelId);
}
