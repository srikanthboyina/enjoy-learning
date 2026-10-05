// Zod schemas shared by every game's content. Pure TS: also used by scripts/.
import { z } from 'zod';

import { GLYPH_IDS } from '../assets-map';

export const GAME_IDS = ['counting', 'fractions', 'matter', 'compare', 'explore'] as const;
export const GameIdSchema = z.enum(GAME_IDS);

export const GlyphIdSchema = z.enum(GLYPH_IDS);

const KNOWN_GLYPHS = new Set<string>(GLYPH_IDS);

/** An icon is a GlyphId from assets-map ("apple") or a literal emoji ("🦒"). */
export const IconSchema = z.string().refine((s) => KNOWN_GLYPHS.has(s) || !/^[a-z0-9-]+$/i.test(s), {
  message: 'unknown icon name: use a name from src/assets-map.ts or paste an emoji',
});

/** An instruction is always speech + icons, never text alone. */
export const PromptSchema = z.object({
  say: z.string().min(1),
  icons: z.array(IconSchema).min(1).max(5),
});

export const DIFFICULTIES = ['simple', 'medium', 'complex'] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);

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
    difficulty: DifficultySchema,
    name: z.string().min(1),
    intro: PromptSchema,
    stars: StarRuleSchema.optional(),
    rounds: z.array(round).min(1).max(10),
  });
}

/** Levels are validated one by one so a single bad level doesn't hide the rest. */
export const LevelFileSchema = z.object({
  topicId: z.string().regex(/^[a-z0-9-]+$/),
  gameId: GameIdSchema,
  version: z.literal(1),
  levels: z.array(z.unknown()),
});

export const TopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  gameId: GameIdSchema,
  subject: z.enum(['math', 'science']),
  title: z.string().min(1),
  /** big picture on the home screen */
  emoji: z.string().min(1),
  /** spoken when the topic opens: what the child will learn here */
  blurb: z.string().min(1),
  /** two-stop gradient for the topic's card and backgrounds */
  colors: z.tuple([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
  unlockAfter: z.string().optional(),
});

export const TopicsFileSchema = z.array(TopicSchema).min(1);
