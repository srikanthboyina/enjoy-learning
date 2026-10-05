import { z } from 'zod';

import { PromptSchema } from '../../engine/contentSchema';

export const SHAPES = ['pizza', 'cake'] as const;
export const PARTS = [2, 3, 4, 6] as const;

const ShapeSchema = z.enum(SHAPES);
const PartsSchema = z.union(PARTS.map((n) => z.literal(n)) as [z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<6>]);

const FractionSchema = z
  .object({ num: z.number().int().min(1), den: PartsSchema })
  .refine((f) => f.num <= f.den, { message: 'num must be <= den' });

/** Tap the dotted lines to cut the shape so `parts` friends get the same size. */
const SplitRound = z.object({
  mode: z.literal('split'),
  shape: ShapeSchema,
  parts: PartsSchema,
  prompt: PromptSchema.optional(),
});

/** Hear/see a fraction, tap the picture that shows it. */
const PickRound = z
  .object({
    mode: z.literal('pick'),
    shape: ShapeSchema,
    target: FractionSchema,
    choices: z.array(FractionSchema).min(2).max(3),
    prompt: PromptSchema.optional(),
  })
  .refine(
    (r) => r.choices.filter((c) => c.num === r.target.num && c.den === r.target.den).length === 1,
    { message: 'exactly one choice must equal target' },
  );

export const FractionsRoundSchema = z.discriminatedUnion('mode', [SplitRound, PickRound]);

export type FractionsRound = z.infer<typeof FractionsRoundSchema>;
export type Fraction = z.infer<typeof FractionSchema>;
export type Shape = (typeof SHAPES)[number];
