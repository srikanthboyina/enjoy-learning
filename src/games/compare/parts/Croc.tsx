import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';

import type { Sign } from '../schema';

const GREEN = '#2F9E44';
const DARK = '#1B5E20';

/**
 * The hungry crocodile: its open jaws ARE the < or > sign, and they always open
 * toward the bigger amount. "=" is drawn as two calm green bars.
 */
export function Croc({ sign, size = 80 }: { sign: Sign; size?: number }) {
  const w = size;
  const h = size;
  const pad = size * 0.12;
  const label = sign === '>' ? 'greater than' : sign === '<' ? 'less than' : 'equals';

  if (sign === '=') {
    return (
      <View accessible accessibilityLabel={label}>
        <Svg width={w} height={h}>
          <Line x1={pad} y1={h * 0.38} x2={w - pad} y2={h * 0.38} stroke={GREEN} strokeWidth={size * 0.12} strokeLinecap="round" />
          <Line x1={pad} y1={h * 0.62} x2={w - pad} y2={h * 0.62} stroke={GREEN} strokeWidth={size * 0.12} strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  // Drawn as ">" (mouth open to the left); "<" is the same drawing mirrored.
  const vx = w - pad;
  const vy = h / 2;
  const top = { x: pad, y: pad };
  const bottom = { x: pad, y: h - pad };
  const teeth = [0.3, 0.55, 0.8].flatMap((t) => {
    const tx = vx + (top.x - vx) * t;
    const ty = vy + (top.y - vy) * t;
    const bx = vx + (bottom.x - vx) * t;
    const by = vy + (bottom.y - vy) * t;
    const s = size * 0.06;
    return [
      `${tx - s},${ty + s * 0.4} ${tx + s},${ty + s * 0.4} ${tx},${ty + s * 2}`,
      `${bx - s},${by - s * 0.4} ${bx + s},${by - s * 0.4} ${bx},${by - s * 2}`,
    ];
  });

  return (
    <View accessible accessibilityLabel={label}>
      <Svg width={w} height={h}>
        <G transform={sign === '<' ? `translate(${w} 0) scale(-1 1)` : undefined}>
          {teeth.map((p, i) => (
            <Polygon key={i} points={p} fill="#FFFFFF" stroke={DARK} strokeWidth={1} />
          ))}
          <Line x1={vx} y1={vy} x2={top.x} y2={top.y} stroke={GREEN} strokeWidth={size * 0.13} strokeLinecap="round" />
          <Line x1={vx} y1={vy} x2={bottom.x} y2={bottom.y} stroke={GREEN} strokeWidth={size * 0.13} strokeLinecap="round" />
          <Circle cx={vx - size * 0.2} cy={vy - size * 0.2} r={size * 0.07} fill="#FFFFFF" stroke={DARK} strokeWidth={2} />
          <Circle cx={vx - size * 0.19} cy={vy - size * 0.2} r={size * 0.03} fill={DARK} />
        </G>
      </Svg>
    </View>
  );
}
