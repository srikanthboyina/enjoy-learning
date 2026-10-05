import type { ComponentType } from 'react';
import type { z } from 'zod';

import type { GlyphId } from '../assets-map';
import type { GAME_IDS, PromptSchema, StarRuleSchema, TopicSchema } from './contentSchema';

export type GameId = (typeof GAME_IDS)[number];
export type Prompt = z.infer<typeof PromptSchema>;
export type StarRule = z.infer<typeof StarRuleSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Stars = 0 | 1 | 2 | 3;
export type { GlyphId };

export interface Level<TRound = unknown> {
  id: string;
  order: number;
  name: string;
  intro: Prompt;
  stars?: StarRule;
  rounds: TRound[];
}

/** Props every mini-game component receives. One component instance = one round. */
export interface GameProps<TRound> {
  round: TRound;
  roundIndex: number;
  /** Report each answer. GameShell gives gentle feedback and counts mistakes. */
  onAttempt: (correct: boolean, opts?: { hint?: Prompt }) => void;
  /** Call once when the round is solved. GameShell celebrates and moves on. */
  onRoundComplete: () => void;
  /** Speak (and show) a prompt, respecting the parent's voice setting. */
  speak: (prompt: Prompt | string) => void;
  /** True after the child asked for help or made 2 mistakes this round. */
  hintActive: boolean;
}

export interface GameDefinition<TRound> {
  id: GameId;
  roundSchema: z.ZodType<TRound>;
  Component: ComponentType<GameProps<TRound>>;
  /** Used when a round has no `prompt` of its own. */
  defaultRoundPrompt: (round: TRound) => Prompt;
  /** Spoken when the hint button is pressed or after repeated mistakes. */
  hintFor?: (round: TRound) => Prompt;
}

export interface LevelResult {
  stars: Stars;
  mistakes: number;
  hints: number;
}
