// Spoken feedback. Encouraging only: never "wrong", "no" or "fail".

const TRY_AGAIN = [
  'Almost! Let’s try again.',
  'Good try! Have another go.',
  'Ooh, so close! Try once more.',
  'Let’s look again together.',
];

const ROUND_PRAISE = ['Great job!', 'You did it!', 'Yay! Well done!', 'Super!', 'Brilliant!'];

const LEVEL_PRAISE = [
  'Hooray! You finished the level!',
  'Amazing work! Level complete!',
  'You are a superstar!',
];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export const phrases = {
  tryAgain: () => pick(TRY_AGAIN),
  roundPraise: () => pick(ROUND_PRAISE),
  levelPraise: () => pick(LEVEL_PRAISE),
  newBadge: 'You earned a new badge!',
  comingSoon: 'This island is coming soon!',
  locked: 'Finish the level before this one first.',
};

const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve',
];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
