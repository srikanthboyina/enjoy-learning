export const colors = {
  // topic colours (referenced by name from content/topics.json)
  sunshine: '#FFC93C',
  tomato: '#FF6B6B',
  sky: '#4DABF7',
  leaf: '#51CF66',
  grape: '#9775FA',
  tangerine: '#FF922B',

  // surfaces
  background: '#FFF8E7',
  card: '#FFFFFF',
  mapSky: '#BDE7FF',
  mapGrass: '#B2F2BB',
  mapWater: '#74C0FC',

  // text and lines
  ink: '#2B2D42',
  inkSoft: '#6C6F7F',
  line: '#E6DFCF',
  locked: '#CED4DA',

  // feedback
  star: '#FFD43B',
  starEmpty: '#DEE2E6',
  success: '#40C057',
  gentle: '#FFA94D',
  overlay: 'rgba(43, 45, 66, 0.45)',
} as const;

export type ColorName = keyof typeof colors;

export function topicColor(name: string): string {
  return (colors as Record<string, string>)[name] ?? colors.sky;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radii = { sm: 12, md: 20, lg: 32, round: 999 } as const;

export const sizes = {
  /** minimum touch target for children */
  touch: 64,
  bigTouch: 88,
  glyph: 48,
  bigGlyph: 72,
} as const;

/** Fredoka: a round, friendly face that is easy for early readers. */
export const families = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const fonts = {
  label: { fontSize: 18, fontWeight: '700' as const },
  title: { fontSize: 28, fontWeight: '800' as const },
  numeral: { fontSize: 72, fontWeight: '900' as const },
};

/** Two-stop gradients. Topics pick their own pair in content/topics.json. */
export const gradients = {
  sky: ['#7FD3FF', '#C9F0FF'],
  sunset: ['#FFB86B', '#FF7EB3'],
  meadow: ['#A8E063', '#56AB2F'],
  candy: ['#FF9A9E', '#FECFEF'],
  ocean: ['#4FACFE', '#00F2FE'],
  grape: ['#A18CD1', '#FBC2EB'],
  lemon: ['#FDEB71', '#F8D800'],
  mint: ['#84FAB0', '#8FD3F4'],
  simple: ['#6EE7B7', '#22C55E'],
  medium: ['#FDBA74', '#F97316'],
  complex: ['#C4B5FD', '#8B5CF6'],
  success: ['#86EFAC', '#22C55E'],
  primary: ['#60A5FA', '#3B82F6'],
} as const satisfies Record<string, readonly [string, string]>;

export type GradientPair = readonly [string, string];

export const confettiColors = ['#FF6B6B', '#FFD43B', '#51CF66', '#4DABF7', '#9775FA', '#FF922B', '#F783AC'];

export const motion = {
  quick: 150,
  normal: 300,
  slow: 600,
  /** pause after a solved round before the next one starts */
  roundPause: 1400,
  spring: { damping: 14, stiffness: 180 },
} as const;
