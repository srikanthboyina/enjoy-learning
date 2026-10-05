// gameId → GameDefinition. The single place a mini-game is registered.
import type { GameDefinition, GameId } from '../engine/types';
import { compareGame } from './compare';
import { exploreGame } from './explore';
import { countingGame } from './counting';
import { fractionsGame } from './fractions';
import { matterGame } from './matter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: Partial<Record<GameId, GameDefinition<any>>> = {
  counting: countingGame,
  fractions: fractionsGame,
  matter: matterGame,
  compare: compareGame,
  explore: exploreGame,
};

export function getGame(gameId: GameId): GameDefinition<unknown> | undefined {
  return GAMES[gameId];
}
