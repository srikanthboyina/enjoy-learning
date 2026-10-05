import { glyphName } from '../../assets-map';
import type { GameDefinition } from '../../engine/types';
import { CompareGame } from './CompareGame';
import { CompareRoundSchema, type CompareRound } from './schema';

export const compareGame: GameDefinition<CompareRound> = {
  id: 'compare',
  roundSchema: CompareRoundSchema,
  Component: CompareGame,
  isLesson: (r) => r.mode === 'show',
  defaultRoundPrompt: (r) => {
    switch (r.mode) {
      case 'show':
        return { say: r.say, icons: ['eyes', 'ear'] };
      case 'pick':
        return {
          say: `Which side has ${r.ask} ${glyphName(r.item, 2)}?${r.allowSame ? ' Or are they the same?' : ''}`,
          icons: r.allowSame ? ['eyes', r.item, 'scale'] : ['eyes', r.item, 'tap'],
        };
      case 'symbol':
        return { say: 'Which crocodile goes in the middle?', icons: ['crocodile', 'question', 'tap'] };
    }
  },
  hintFor: (r) => {
    switch (r.mode) {
      case 'show':
        return { say: r.say, icons: ['eyes', 'ear'] };
      case 'pick':
        return { say: 'Count each side. The numbers will help you.', icons: ['eyes', 'numbers'] };
      case 'symbol':
        return {
          say: 'The hungry crocodile always opens its mouth to the bigger number. If they are the same, use equals.',
          icons: ['crocodile', 'eyes'],
        };
    }
  },
};
