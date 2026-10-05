import { z } from 'zod';

import { GlyphIdSchema, PromptSchema } from '../../engine/contentSchema';

/** Drag (or tap) exactly `target` items from the pile into the basket. */
const CollectRound = z
  .object({
    mode: z.literal('collect'),
    target: z.number().int().min(1).max(10),
    item: GlyphIdSchema,
    /** how many items are in the pile (must be >= target) */
    available: z.number().int().min(1).max(12),
    /** hide the dot pattern under the target number (harder) */
    hideDots: z.boolean().optional(),
    prompt: PromptSchema.optional(),
  })
  .refine((r) => r.available >= r.target, { message: 'available must be >= target' });

/** Hear/see a number, tap the group that has that many. */
const MatchRound = z
  .object({
    mode: z.literal('match'),
    /** item counts of the groups shown, 2–4 groups */
    groups: z.array(z.number().int().min(1).max(10)).min(2).max(4),
    showNumeral: z.number().int().min(1).max(10),
    item: GlyphIdSchema,
    prompt: PromptSchema.optional(),
  })
  .refine((r) => r.groups.filter((g) => g === r.showNumeral).length === 1, {
    message: 'exactly one group must equal showNumeral',
  });

export const CountingRoundSchema = z.discriminatedUnion('mode', [CollectRound, MatchRound]);

export type CountingRound = z.infer<typeof CountingRoundSchema>;
