// Loads and validates content/*.json once at startup. Every `<topic>.levels.json`
// in content/ is picked up automatically (Metro's require.context), so adding a
// level file needs no code change.
import topicsJson from '../../content/topics.json';
import { parseLevelFile, parseTopics, type ParseIssue } from './parseContent';
import type { Difficulty, Level, Topic } from './types';

declare const require: {
  context(dir: string, deep: boolean, filter: RegExp): { keys(): string[]; (key: string): unknown };
};

const levelFiles = require.context('../../content', false, /\.levels\.json$/);

function load() {
  const issues: ParseIssue[] = [];
  const topics = parseTopics(topicsJson, issues);
  const levelsByTopic: Record<string, Level[]> = {};
  for (const key of levelFiles.keys()) {
    const file = key.replace(/^\.\//, '');
    const { topicId, levels } = parseLevelFile(file, levelFiles(key), issues);
    if (topicId) levelsByTopic[topicId] = levels;
  }
  if (issues.length && __DEV__) {
    console.error(
      'Content problems (run `npm run validate:content`):\n' +
        issues.map((i) => `  ${i.where}: ${i.message}`).join('\n'),
    );
  }
  return { topics, levelsByTopic };
}

const content = load();

export function getTopics(): Topic[] {
  return content.topics;
}

export function getTopic(topicId: string): Topic | undefined {
  return content.topics.find((t) => t.id === topicId);
}

/** All levels of a topic, simple → medium → complex. */
export function getLevels(topicId: string): Level[] {
  return content.levelsByTopic[topicId] ?? [];
}

export function getLevelsFor(topicId: string, difficulty: Difficulty): Level[] {
  return getLevels(topicId).filter((l) => l.difficulty === difficulty);
}

export function getLevel(topicId: string, levelId: string): Level | undefined {
  return getLevels(topicId).find((l) => l.id === levelId);
}
