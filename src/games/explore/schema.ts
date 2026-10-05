// The explore engine: one data-driven game that many topics share.
// A level mixes lesson steps ("show") with questions ("choice", "sort", "order", "grow").
import { z } from 'zod';

import { IconSchema } from '../../engine/contentSchema';

export const SHAPES = [
  'circle', 'square', 'triangle', 'rectangle', 'oval', 'star', 'heart', 'diamond', 'pentagon', 'hexagon',
] as const;
const ShapeSchema = z.enum(SHAPES);
const Color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const Emoji = z.string().min(1);
const Fraction = z
  .object({ parts: z.number().int().min(1).max(12), shaded: z.number().int().min(0).max(12), shape: z.enum(['circle', 'bar']).optional() })
  .refine((f) => f.shaded <= f.parts, { message: 'shaded must be <= parts' });
const ClockTime = z.object({ hour: z.number().int().min(1).max(12), minute: z.number().int().min(0).max(59) });

/** Pictures that explain or pose a question. */
export const VisualSchema = z.discriminatedUnion('kind', [
  /** a row of emoji, e.g. ["🍎","🍎","🍌"] */
  z.object({ kind: z.literal('emoji'), items: z.array(Emoji).min(1).max(20), size: z.enum(['sm', 'md', 'lg']).optional() }),
  /** a big line of text or a number sentence, e.g. "3 + 2 = ?" */
  z.object({ kind: z.literal('text'), text: z.string().min(1) }),
  /** groups joined by a sign: 🍎🍎 + 🍎🍎🍎 */
  z.object({
    kind: z.literal('groups'),
    groups: z.array(z.object({ count: z.number().int().min(0).max(12), emoji: Emoji })).min(1).max(3),
    op: z.enum(['+', '-', 'and']).optional(),
    showNumbers: z.boolean().optional(),
  }),
  /** `count` things, the last `remove` of them leaving */
  z.object({ kind: z.literal('take'), count: z.number().int().min(1).max(12), remove: z.number().int().min(0).max(12), emoji: Emoji }),
  /** a sequence with "?" for the blank: ["🔴","🔵","🔴","?"] */
  z.object({ kind: z.literal('sequence'), items: z.array(z.string().min(1)).min(2).max(10) }),
  z.object({ kind: z.literal('clock'), ...ClockTime.shape }),
  z.object({ kind: z.literal('shapes'), shapes: z.array(z.object({ shape: ShapeSchema, color: Color.optional() })).min(1).max(8) }),
  /** things grouped in pairs to show odd and even */
  z.object({ kind: z.literal('pairs'), count: z.number().int().min(1).max(14), emoji: Emoji }),
  /** emoji drawn at different sizes (scale 0.4–2) */
  z.object({ kind: z.literal('sizes'), items: z.array(z.object({ emoji: Emoji, scale: z.number().min(0.3).max(2.2) })).min(2).max(4) }),
  /** a number line with hops, for skip counting */
  /** one or two ten frames (dots, or an emoji in each filled box) */
  z.object({ kind: z.literal('tenframe'), count: z.number().int().min(0).max(20), emoji: Emoji.optional() }),
  /** base-ten blocks: tall rods of ten and small ones */
  z.object({ kind: z.literal('placevalue'), tens: z.number().int().min(0).max(9), ones: z.number().int().min(0).max(9) }),
  /** coins drawn as circles showing their value, e.g. [10, 5, 1] */
  z.object({ kind: z.literal('coins'), coins: z.array(z.number().int().min(1).max(100)).min(1).max(10) }),
  /** a bar graph: one bar per row */
  z.object({
    kind: z.literal('bars'),
    bars: z.array(z.object({ emoji: Emoji, value: z.number().int().min(0).max(10), label: z.string().optional() })).min(2).max(5),
  }),
  /** tally marks, bundled in fives */
  z.object({ kind: z.literal('tally'), count: z.number().int().min(1).max(20) }),
  /** rows × cols of the same thing (multiplication arrays) */
  z.object({ kind: z.literal('array'), rows: z.number().int().min(1).max(6), cols: z.number().int().min(1).max(10), emoji: Emoji }),
  /** a thing measured against a ruler, `length` units long */
  z.object({ kind: z.literal('ruler'), length: z.number().int().min(1).max(12), emoji: Emoji, color: Color.optional() }),
  /** a thermometer filled to `level` (0 = freezing … 10 = very hot) */
  z.object({ kind: z.literal('thermometer'), level: z.number().int().min(0).max(10) }),
  /** a balance scale: which side is heavier */
  z.object({ kind: z.literal('balance'), left: Emoji, right: Emoji, heavier: z.enum(['left', 'right', 'same']) }),
  /** a shape cut into equal parts, some shaded */
  z.object({ kind: z.literal('fraction'), ...{ parts: z.number().int().min(1).max(12), shaded: z.number().int().min(0).max(12) }, shape: z.enum(['circle', 'bar']).optional() }),
  /** the seven days, Monday first; `highlight` is 0–6 */
  z.object({ kind: z.literal('week'), highlight: z.number().int().min(0).max(6).optional() }),
  z.object({
    kind: z.literal('numberline'),
    from: z.number().int().min(0),
    to: z.number().int().max(100),
    step: z.number().int().min(1),
    hops: z.number().int().min(0).optional(),
  }),
]);
export type Visual = z.infer<typeof VisualSchema>;

/** One answer card: any mix of label, emoji, shape or clock. */
export const OptionSchema = z
  .object({
    label: z.string().min(1).optional(),
    emoji: Emoji.optional(),
    shape: ShapeSchema.optional(),
    color: Color.optional(),
    clock: ClockTime.optional(),
    fraction: Fraction.optional(),
    /** spoken when this option is chosen by mistake */
    why: z.string().optional(),
  })
  .refine((o) => o.label || o.emoji || o.shape || o.clock || o.fraction, { message: 'an option needs a label, emoji, shape, clock or fraction' });
export type Option = z.infer<typeof OptionSchema>;

const Common = {
  /** icons shown in Ellie's speech bubble */
  icons: z.array(IconSchema).min(1).max(5).optional(),
  /** spoken when the 💡 help button is pressed */
  hint: z.string().optional(),
  /** spoken after the right answer: why it is right */
  explain: z.string().optional(),
};

/** Lesson step: a picture plus narration, then ▶️. Not scored. */
const ShowRound = z.object({
  mode: z.literal('show'),
  say: z.string().min(1),
  visual: VisualSchema.optional(),
  /** short words shown under the picture, e.g. "3 + 2 = 5" */
  caption: z.string().optional(),
  icons: Common.icons,
});

const ChoiceRound = z
  .object({
    mode: z.literal('choice'),
    ask: z.string().min(1),
    visual: VisualSchema.optional(),
    options: z.array(OptionSchema).min(2).max(4),
    answer: z.number().int().min(0),
    ...Common,
  })
  .refine((r) => r.answer < r.options.length, { message: 'answer must be an index into options' });

const SortRound = z
  .object({
    mode: z.literal('sort'),
    ask: z.string().min(1),
    bins: z.array(z.object({ label: z.string().min(1), emoji: Emoji })).min(2).max(3),
    items: z.array(z.object({ emoji: Emoji, bin: z.number().int().min(0), name: z.string().optional() })).min(2).max(8),
    ...Common,
  })
  .refine((r) => r.items.every((i) => i.bin < r.bins.length), { message: 'item.bin must be an index into bins' });

const OrderRound = z.object({
  mode: z.literal('order'),
  ask: z.string().min(1),
  /** listed in the CORRECT order; the game shuffles them */
  items: z.array(OptionSchema).min(2).max(6),
  ...Common,
});

const GrowRound = z.object({
  mode: z.literal('grow'),
  ask: z.string().min(1),
  /** taps of water and sun each stage needs */
  needs: z.object({ water: z.number().int().min(0).max(4), sun: z.number().int().min(0).max(4) }),
  /** stages from seed to flower (emoji) */
  stages: z.array(Emoji).min(2).max(6).optional(),
  /** watering more than needed makes the plant droop */
  tooMuch: z.boolean().optional(),
  ...Common,
});

export const ExploreRoundSchema = z.discriminatedUnion('mode', [ShowRound, ChoiceRound, SortRound, OrderRound, GrowRound]);
export type ExploreRound = z.infer<typeof ExploreRoundSchema>;
export type ShapeName = (typeof SHAPES)[number];
