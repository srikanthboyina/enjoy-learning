// Mounts the right mini-game for a level inside the shared GameShell.
import { Redirect, useLocalSearchParams } from 'expo-router';

import { GameShell } from '../../../src/engine/GameShell';
import { getLevels, getTopic } from '../../../src/engine/loadContent';
import { getGame } from '../../../src/games/registry';

export default function PlayScreen() {
  const { topicId, levelId } = useLocalSearchParams<{ topicId: string; levelId: string }>();
  const topic = getTopic(topicId);
  const definition = topic && getGame(topic.gameId);
  const levels = topic ? getLevels(topic.gameId) : [];
  const index = levels.findIndex((l) => l.id === levelId);
  if (!topic || !definition || index < 0) return <Redirect href="/" />;

  return (
    <GameShell
      key={levelId}
      topic={topic}
      level={levels[index]}
      definition={definition}
      nextLevelId={levels[index + 1]?.id}
    />
  );
}
