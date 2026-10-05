import Svg, { Circle, Path, Rect } from 'react-native-svg';

const FILL = '#FF922B';
const EMPTY = '#FFF4E6';
const EDGE = '#E8590C';

/** A circle (pizza-style) or bar cut into `parts` equal pieces, `shaded` coloured in. */
export function FractionShape({
  parts,
  shaded,
  shape = 'circle',
  size = 110,
}: {
  parts: number;
  shaded: number;
  shape?: 'circle' | 'bar';
  size?: number;
}) {
  const label = `${shaded} of ${parts} parts coloured`;
  if (shape === 'bar') {
    const w = size * 1.6;
    const h = size * 0.5;
    const pw = (w - 6) / parts;
    return (
      <Svg width={w} height={h} accessibilityLabel={label}>
        {Array.from({ length: parts }, (_, i) => (
          <Rect key={i} x={3 + i * pw} y={3} width={pw} height={h - 6} fill={i < shaded ? FILL : EMPTY} stroke={EDGE} strokeWidth={3} />
        ))}
      </Svg>
    );
  }
  const c = size / 2;
  const r = c - 4;
  if (parts === 1) {
    return (
      <Svg width={size} height={size} accessibilityLabel={label}>
        <Circle cx={c} cy={c} r={r} fill={shaded ? FILL : EMPTY} stroke={EDGE} strokeWidth={3} />
      </Svg>
    );
  }
  const wedge = (i: number) => {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / parts;
    const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / parts;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${c} ${c} L ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`;
  };
  return (
    <Svg width={size} height={size} accessibilityLabel={label}>
      {Array.from({ length: parts }, (_, i) => (
        <Path key={i} d={wedge(i)} fill={i < shaded ? FILL : EMPTY} stroke={EDGE} strokeWidth={3} strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
