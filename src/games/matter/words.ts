import type { MatterState, Tool } from './schema';

const CHANGE: Record<string, string> = {
  'ice>water': 'The ice melted into water!',
  'water>steam': 'The water got so hot it turned into steam!',
  'steam>water': 'The steam cooled down into water drops!',
  'water>ice': 'Brrr! The water froze into ice!',
};

export function changeWords(from: MatterState, to: MatterState, tool: Tool): string {
  if (from === to) {
    return tool === 'cool' ? 'The ice is already frozen solid.' : 'The steam is already as hot as it gets.';
  }
  return CHANGE[`${from}>${to}`] ?? '';
}

export function needWords(state: MatterState, goal: MatterState): string {
  const hotter = ['ice', 'water', 'steam'].indexOf(goal) > ['ice', 'water', 'steam'].indexOf(state);
  return hotter ? `To make ${goal}, it needs heat.` : `To make ${goal}, it needs to get cold.`;
}
