import type { GameDefinition, Prompt } from '../../engine/types';
import { ExploreGame } from './ExploreGame';
import { ExploreRoundSchema, type ExploreRound } from './schema';

function icons(r: ExploreRound, fallback: string[]): string[] {
  return r.icons ?? fallback;
}

export const exploreGame: GameDefinition<ExploreRound> = {
  id: 'explore',
  roundSchema: ExploreRoundSchema,
  Component: ExploreGame,
  isLesson: (r) => r.mode === 'show',
  defaultRoundPrompt: (r): Prompt => {
    switch (r.mode) {
      case 'show':
        return { say: r.say, icons: icons(r, ['eyes', 'ear']) };
      case 'choice':
        return { say: r.ask, icons: icons(r, ['eyes', 'tap']) };
      case 'sort':
        return { say: r.ask, icons: icons(r, r.bins.map((b) => b.emoji)) };
      case 'order':
        return { say: r.ask, icons: icons(r, ['1️⃣', '2️⃣', '3️⃣']) };
      case 'grow':
        return { say: r.ask, icons: icons(r, ['💧', '☀️', '🌱']) };
    }
  },
  hintFor: (r): Prompt => {
    if (r.mode === 'show') return { say: r.say, icons: icons(r, ['eyes', 'ear']) };
    if (r.hint) return { say: r.hint, icons: ['💡'] };
    switch (r.mode) {
      case 'choice':
        return { say: 'Look carefully at each card. I faded one that is not right.', icons: ['💡', 'eyes'] };
      case 'sort':
        return { say: 'Look for the glowing box.', icons: ['💡', 'eyes'] };
      case 'order':
        return { say: 'The glowing card comes next.', icons: ['💡', 'eyes'] };
      case 'grow':
        return { say: 'Tap the glowing button. Plants need water and sunshine.', icons: ['💧', '☀️'] };
    }
  },
};
