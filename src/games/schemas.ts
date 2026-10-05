// gameId → round schema. Pure TS (no React Native) so scripts/validate-content.ts can use it.
import type { z } from 'zod';

import type { GameId } from '../engine/types';
import { CountingRoundSchema } from './counting/schema';
import { FractionsRoundSchema } from './fractions/schema';

export const ROUND_SCHEMAS: Partial<Record<GameId, z.ZodTypeAny>> = {
  counting: CountingRoundSchema,
  fractions: FractionsRoundSchema,
};
