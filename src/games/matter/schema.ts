import { z } from 'zod';

import { PromptSchema } from '../../engine/contentSchema';

export const STATES = ['ice', 'water', 'steam'] as const;
export const TOOLS = ['heat', 'cool'] as const;

const StateSchema = z.enum(STATES);
const ToolSchema = z.enum(TOOLS);

/** Drag the substance onto heat or cold until it becomes `goal`. */
const ChangeRound = z
  .object({
    mode: z.literal('change'),
    start: StateSchema,
    goal: StateSchema,
    /** which tools are on screen (default both) */
    tools: z.array(ToolSchema).min(1).max(2).optional(),
    prompt: PromptSchema.optional(),
  })
  .refine((r) => r.start !== r.goal, { message: 'start and goal must differ' })
  .refine(
    (r) => {
      const tools = r.tools ?? TOOLS;
      const needsHeat = STATES.indexOf(r.goal) > STATES.indexOf(r.start);
      return tools.includes(needsHeat ? 'heat' : 'cool');
    },
    { message: 'tools must include the one needed to reach the goal' },
  );

/** "What happens if…": pick the result of applying `tool` to `start`. */
const PredictRound = z.object({
  mode: z.literal('predict'),
  start: StateSchema,
  tool: ToolSchema,
  prompt: PromptSchema.optional(),
});

export const MatterRoundSchema = z.discriminatedUnion('mode', [ChangeRound, PredictRound]);

export type MatterRound = z.infer<typeof MatterRoundSchema>;
export type MatterState = (typeof STATES)[number];
export type Tool = (typeof TOOLS)[number];

/** Heat moves ice → water → steam; cold moves the other way. Ends stay put. */
export function applyTool(state: MatterState, tool: Tool): MatterState {
  const i = STATES.indexOf(state) + (tool === 'heat' ? 1 : -1);
  return STATES[Math.max(0, Math.min(STATES.length - 1, i))];
}
