import { glyphName } from '../../assets-map';
import { numberWord } from '../../engine/phrases';
import type { GameDefinition } from '../../engine/types';
import { FractionsGame } from './FractionsGame';
import { FractionsRoundSchema, type FractionsRound } from './schema';
import { fractionWords } from './words';

export const fractionsGame: GameDefinition<FractionsRound> = {
  id: 'fractions',
  roundSchema: FractionsRoundSchema,
  Component: FractionsGame,
  defaultRoundPrompt: (r) =>
    r.mode === 'split'
      ? {
          say: `Cut the ${glyphName(r.shape)} so ${numberWord(r.parts)} friends get the same size.`,
          icons: ['cut', r.shape, 'friends'],
        }
      : {
          say: `Find ${fractionWords(r.target)} of the ${glyphName(r.shape)}.`,
          icons: ['ear', 'eyes', 'tap'],
        },
  hintFor: (r) =>
    r.mode === 'split'
      ? {
          say: `Tap the yellow lines. Make ${numberWord(r.parts)} pieces that are all the same.`,
          icons: ['tap', 'cut'],
        }
      : {
          say: `The bottom number says how many pieces. The top number says how many are full. Find ${numberWord(r.target.num)} full out of ${numberWord(r.target.den)}.`,
          icons: ['eyes', r.shape],
        },
};
