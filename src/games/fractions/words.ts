import { numberWord } from '../../engine/phrases';
import type { Fraction } from './schema';

const PART_NAMES: Record<number, [string, string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['quarter', 'quarters'],
  6: ['sixth', 'sixths'],
};

/** "one half", "three quarters" */
export function fractionWords({ num, den }: Fraction): string {
  const [one, many] = PART_NAMES[den] ?? [`${den}th`, `${den}ths`];
  return `${numberWord(num)} ${num === 1 ? one : many}`;
}
