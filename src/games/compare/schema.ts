import { z } from 'zod';

import { GlyphIdSchema, PromptSchema } from '../../engine/contentSchema';

const Count = z.number().int().min(0).max(20);

/**
 * Lesson step: shows two amounts side by side and narrates the comparison.
 * Not scored; the child taps ▶️ to continue. `say` is the narration.
 */
const ShowRound = z
  .object({
    mode: z.literal('show'),
    left: Count,
    right: Count,
    /** picture to draw; omit to show numbers only */
    item: GlyphIdSchema.optional(),
    /** show the < > = sign between the numbers */
    showSymbol: z.boolean().optional(),
    say: z.string().min(1),
  })
  .refine((r) => r.item === undefined || Math.max(r.left, r.right) <= 10, {
    message: 'pictures are limited to 10 per side; omit item for bigger numbers',
  });

/** Tap the side with more (or fewer). With allowSame, a ⚖️ "same" button appears. */
const PickRound = z
  .object({
    mode: z.literal('pick'),
    left: Count,
    right: Count,
    item: GlyphIdSchema,
    ask: z.enum(['more', 'fewer']),
    allowSame: z.boolean().optional(),
    prompt: PromptSchema.optional(),
  })
  .refine((r) => Math.max(r.left, r.right) <= 10, { message: 'pictures are limited to 10 per side' })
  .refine((r) => r.left !== r.right || r.allowSame, { message: 'equal sides need allowSame: true' });

/** Pick the crocodile sign (<, =, >) that goes between the two amounts. */
const SymbolRound = z
  .object({
    mode: z.literal('symbol'),
    left: Count,
    right: Count,
    item: GlyphIdSchema.optional(),
    prompt: PromptSchema.optional(),
  })
  .refine((r) => r.item === undefined || Math.max(r.left, r.right) <= 10, {
    message: 'pictures are limited to 10 per side; omit item for bigger numbers',
  });

export const CompareRoundSchema = z.discriminatedUnion('mode', [ShowRound, PickRound, SymbolRound]);

export type CompareRound = z.infer<typeof CompareRoundSchema>;
export type Sign = '<' | '=' | '>';

export function signFor(left: number, right: number): Sign {
  return left > right ? '>' : left < right ? '<' : '=';
}
