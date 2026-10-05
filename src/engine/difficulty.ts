import { gradients, type GradientPair } from '../theme';
import type { Difficulty } from './types';

export const DIFFICULTY_INFO: Record<
  Difficulty,
  { label: string; emoji: string; colors: GradientPair; say: string; tag: string }
> = {
  simple: { label: 'Simple', emoji: '🌱', colors: gradients.simple, say: 'Simple. A gentle start.', tag: 'A gentle start · ages 5+' },
  medium: { label: 'Medium', emoji: '🌟', colors: gradients.medium, say: 'Medium. A little harder.', tag: 'A little harder · ages 6+' },
  complex: { label: 'Complex', emoji: '🚀', colors: gradients.complex, say: 'Complex. A big challenge!', tag: 'A big challenge · ages 7+' },
};
