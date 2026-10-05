import type { GameDefinition } from '../../engine/types';
import { MatterGame } from './MatterGame';
import { MatterRoundSchema, type MatterRound } from './schema';
import { needWords } from './words';

export const matterGame: GameDefinition<MatterRound> = {
  id: 'matter',
  roundSchema: MatterRoundSchema,
  Component: MatterGame,
  defaultRoundPrompt: (r) =>
    r.mode === 'change'
      ? { say: `Can you turn the ${r.start} into ${r.goal}? Drag it to the fire or the snow.`, icons: [r.start, 'drag', r.goal] }
      : {
          say: `What happens if we ${r.tool === 'heat' ? 'heat' : 'cool'} the ${r.start}?`,
          icons: [r.start, r.tool === 'heat' ? 'fire' : 'snow', 'question'],
        },
  hintFor: (r) =>
    r.mode === 'change'
      ? { say: `${needWords(r.start, r.goal)} Try the glowing one.`, icons: ['eyes', r.goal] }
      : { say: 'Look at the thermometer. Heat makes it go up, cold makes it go down.', icons: ['thermometer', 'eyes'] },
};
