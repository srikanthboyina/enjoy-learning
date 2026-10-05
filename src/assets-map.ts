// Picture + spoken name for every icon and sprite used in content files.
// v1 uses emoji so everything is bundled and works offline on every platform.
// To swap in artwork later, add an `image` field and render it in kit/Glyph.tsx.
// Keep this file free of React Native imports: scripts/validate-content.ts uses it.

export const GLYPHS = {
  // instruction icons
  tap: { emoji: '👆', name: 'tap', plural: 'taps' },
  drag: { emoji: '✋', name: 'drag', plural: 'drags' },
  ear: { emoji: '👂', name: 'listen', plural: 'listen' },
  eyes: { emoji: '👀', name: 'look', plural: 'look' },
  check: { emoji: '✅', name: 'done', plural: 'done' },
  numbers: { emoji: '🔢', name: 'numbers', plural: 'numbers' },
  basket: { emoji: '🧺', name: 'basket', plural: 'baskets' },
  question: { emoji: '❓', name: 'which one', plural: 'which ones' },

  // counting sprites
  apple: { emoji: '🍎', name: 'apple', plural: 'apples' },
  banana: { emoji: '🍌', name: 'banana', plural: 'bananas' },
  strawberry: { emoji: '🍓', name: 'strawberry', plural: 'strawberries' },
  star: { emoji: '⭐', name: 'star', plural: 'stars' },
  fish: { emoji: '🐟', name: 'fish', plural: 'fish' },
  ball: { emoji: '⚽', name: 'ball', plural: 'balls' },
  duck: { emoji: '🦆', name: 'duck', plural: 'ducks' },
  car: { emoji: '🚗', name: 'car', plural: 'cars' },
  flower: { emoji: '🌼', name: 'flower', plural: 'flowers' },
  carrot: { emoji: '🥕', name: 'carrot', plural: 'carrots' },

  // fractions
  cut: { emoji: '✂️', name: 'cut', plural: 'cut' },
  friends: { emoji: '👫', name: 'friends', plural: 'friends' },
  plate: { emoji: '🍽️', name: 'plate', plural: 'plates' },

  // topic icons
  pizza: { emoji: '🍕', name: 'pizza', plural: 'pizzas' },
  cake: { emoji: '🍰', name: 'cake', plural: 'cakes' },
  drop: { emoji: '💧', name: 'water', plural: 'water' },
  ice: { emoji: '🧊', name: 'ice', plural: 'ice' },
  water: { emoji: '💧', name: 'water', plural: 'water' },
  steam: { emoji: '☁️', name: 'steam', plural: 'steam' },
  thermometer: { emoji: '🌡️', name: 'temperature', plural: 'temperature' },
  pot: { emoji: '🫕', name: 'pot', plural: 'pots' },
  fire: { emoji: '🔥', name: 'heat', plural: 'heat' },
  snow: { emoji: '❄️', name: 'cold', plural: 'cold' },
  seed: { emoji: '🫘', name: 'seed', plural: 'seeds' },
  sprout: { emoji: '🌱', name: 'sprout', plural: 'sprouts' },
  plant: { emoji: '🪴', name: 'plant', plural: 'plants' },
  blossom: { emoji: '🌷', name: 'flower', plural: 'flowers' },
  sun: { emoji: '☀️', name: 'sun', plural: 'sun' },
} as const;

export type GlyphId = keyof typeof GLYPHS;

export const GLYPH_IDS = Object.keys(GLYPHS) as [GlyphId, ...GlyphId[]];

export function glyphName(id: GlyphId, count = 1): string {
  const g = GLYPHS[id];
  return count === 1 ? g.name : g.plural;
}
