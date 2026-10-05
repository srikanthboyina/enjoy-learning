import { glyphName } from '../../assets-map';
import { numberWord } from '../../engine/phrases';
import type { GameDefinition } from '../../engine/types';
import { CountingGame } from './CountingGame';
import { CountingRoundSchema, type CountingRound } from './schema';

export const countingGame: GameDefinition<CountingRound> = {
  id: 'counting',
  roundSchema: CountingRoundSchema,
  Component: CountingGame,
  defaultRoundPrompt: (r) =>
    r.mode === 'collect'
      ? {
          say: `Put ${numberWord(r.target)} ${glyphName(r.item, r.target)} in the basket.`,
          icons: ['drag', r.item, 'basket'],
        }
      : {
          say: `Which group has ${numberWord(r.showNumeral)}?`,
          icons: ['ear', 'eyes', 'tap'],
        },
  hintFor: (r) =>
    r.mode === 'collect'
      ? {
          say: `Fill the dots. We need ${numberWord(r.target)}. Then tap the check.`,
          icons: ['eyes', 'basket', 'check'],
        }
      : {
          say: `Let's count each group with the little numbers. Find ${numberWord(r.showNumeral)}.`,
          icons: ['eyes', 'numbers', 'tap'],
        },
};
