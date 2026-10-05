// gameId → GameDefinition. The single place a mini-game is registered.
import type { GameDefinition, GameId } from '../engine/types';
import { countingGame } from './counting';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: Partial<Record<GameId, GameDefinition<any>>> = {
  counting: countingGame,
};

export function getGame(gameId: GameId): GameDefinition<unknown> | undefined {
  return GAMES[gameId];
}
