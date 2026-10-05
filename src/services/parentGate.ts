// Parent gate state. Not persisted: the gate locks again whenever the app is backgrounded.
import { AppState } from 'react-native';
import { create } from 'zustand';

import { numberWord } from '../engine/phrases';

interface GateState {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useParentGate = create<GateState>()((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));

AppState.addEventListener('change', (state) => {
  if (state !== 'active') useParentGate.getState().lock();
});

/** Three distinct digits 1–9, shown to the adult as words (e.g. "seven, two, nine"). */
export function newChallenge(): { digits: number[]; words: string } {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const digits: number[] = [];
  while (digits.length < 3) {
    const [d] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    digits.push(d);
  }
  return { digits, words: digits.map(numberWord).join(', ') };
}
