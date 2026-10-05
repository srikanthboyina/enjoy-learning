// Zod schemas shared by every game's content. Pure TS: also used by scripts/.
import { z } from 'zod';

import { GLYPH_IDS } from '../assets-map';

export const GAME_IDS = ['counting', 'fractions', 'matter', 'plants', 'compare'] as const;
export const GameIdSchema = z.enum(GAME_IDS);

export const GlyphIdSchema = z.enum(GLYPH_IDS);

/** An instruction is always speech + icons, never text alone. */
export const PromptSchema = z.object({
  say: z.string().min(1),
  icons: z.array(GlyphIdSchema).min(1).max(5),
});

export const StarRuleSchema = z
  .object({
    three: z.number().int().min(0),
    two: z.number().int().min(0),
  })
  .refine((r) => r.two >= r.three, { message: 'stars.two must be >= stars.three' });

export function levelSchema<T extends z.ZodTypeAny>(round: T) {
  return z.object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, digits and dashes'),
    order: z.number().int().min(1),
    name: z.string().min(1),
    intro: PromptSchema,
    stars: StarRuleSchema.optional(),
    rounds: z.array(round).min(1).max(8),
  });
}

/** Levels are validated one by one so a single bad level doesn't hide the rest. */
export const LevelFileSchema = z.object({
  gameId: GameIdSchema,
  version: z.literal(1),
  levels: z.array(z.unknown()),
});

export const TopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  gameId: GameIdSchema,
  subject: z.enum(['math', 'science']),
  title: z.string().min(1),
  icon: GlyphIdSchema,
  color: z.string().min(1),
  mapPosition: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  unlockAfter: z.string().optional(),
});

export const TopicsFileSchema = z.array(TopicSchema).min(1);
