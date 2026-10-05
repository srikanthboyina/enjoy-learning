/// <reference types="node" />
// Validates every content/*.json file against the game schemas.
// Usage: npm run validate:content
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseLevelFile, parseTopics, type ParseIssue } from '../src/engine/parseContent';
import { ROUND_SCHEMAS } from '../src/games/schemas';

const dir = join(__dirname, '..', 'content');
const issues: ParseIssue[] = [];
const read = (f: string): unknown => JSON.parse(readFileSync(join(dir, f), 'utf8'));

const topics = parseTopics(read('topics.json'), issues);
const levelFiles = readdirSync(dir).filter((f) => f.endsWith('.levels.json'));
const gamesWithLevels = new Set<string>();

for (const file of levelFiles) {
  const { topicId, gameId, levels } = parseLevelFile(file, read(file), issues);
  if (!topicId || !gameId) continue;
  if (file !== `${topicId}.levels.json`) {
    issues.push({ where: file, message: `file name should be ${topicId}.levels.json` });
  }
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) issues.push({ where: file, message: `topicId "${topicId}" is not in topics.json` });
  else if (topic.gameId !== gameId) {
    issues.push({ where: file, message: `gameId "${gameId}" does not match topics.json ("${topic.gameId}")` });
  }
  const counts = ['simple', 'medium', 'complex'].map((d) => levels.filter((l) => l.difficulty === d).length);
  gamesWithLevels.add(topicId);
  console.log(`✓ ${file}: ${levels.length} level(s)  simple ${counts[0]} · medium ${counts[1]} · complex ${counts[2]}`);
}

for (const t of topics) {
  if (t.unlockAfter && !topics.some((o) => o.id === t.unlockAfter)) {
    issues.push({ where: 'topics.json', message: `${t.id}.unlockAfter "${t.unlockAfter}" is not a topic` });
  }
  if (!gamesWithLevels.has(t.id) || !ROUND_SCHEMAS[t.gameId]) {
    console.log(`… ${t.id}: no levels yet (shows as "coming soon")`);
  }
}

if (issues.length) {
  console.error(`\n✗ ${issues.length} problem(s):`);
  for (const i of issues) console.error(`  ${i.where}: ${i.message}`);
  process.exit(1);
}
console.log('\nAll content is valid.');
