// Ellie the elephant, drawn in SVG so she can come in any colour.
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { shade, tint } from '../theme/color';

export const ELEPHANT_COLORS = [
  { id: 'blue', name: 'Sky blue', color: '#6FA8FF' },
  { id: 'pink', name: 'Bubblegum pink', color: '#FF8FC0' },
  { id: 'purple', name: 'Grape purple', color: '#A98BFF' },
  { id: 'mint', name: 'Mint green', color: '#5CCFA0' },
  { id: 'orange', name: 'Sunny orange', color: '#FFAA55' },
  { id: 'grey', name: 'Classic grey', color: '#9AA8BA' },
] as const;
export type ElephantColorId = (typeof ELEPHANT_COLORS)[number]['id'];

export function elephantColor(id: string | undefined): string {
  return (ELEPHANT_COLORS.find((c) => c.id === id) ?? ELEPHANT_COLORS[0]).color;
}

interface Props {
  color: string;
  size?: number;
  /** trunk raised high (celebrating) */
  trunkUp?: boolean;
  /** happy closed eyes */
  joy?: boolean;
}

/** A round, friendly elephant face with big ears and a curly trunk (viewBox 120×120). */
export function Elephant({ color, size = 64, trunkUp = false, joy = false }: Props) {
  const dark = shade(color, 0.18);
  const light = tint(color, 0.35);
  const ear = tint(color, 0.15);
  const earInner = '#FFB3CF';
  const trunk = trunkUp
    ? 'M 54 70 C 50 58, 40 44, 30 36 C 24 31, 18 34, 21 40 C 24 45, 30 43, 31 39'
    : 'M 54 72 C 52 86, 48 98, 40 104 C 34 108, 29 103, 33 98 C 36 95, 40 97, 40 100';
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* ears */}
      <G>
        <Ellipse cx={22} cy={56} rx={22} ry={27} fill={ear} stroke={dark} strokeWidth={3} />
        <Ellipse cx={24} cy={57} rx={13} ry={17} fill={earInner} />
        <Ellipse cx={98} cy={56} rx={22} ry={27} fill={ear} stroke={dark} strokeWidth={3} />
        <Ellipse cx={96} cy={57} rx={13} ry={17} fill={earInner} />
      </G>
      {/* head */}
      <Circle cx={60} cy={58} r={33} fill={color} stroke={dark} strokeWidth={3} />
      <Ellipse cx={52} cy={40} rx={14} ry={8} fill={light} opacity={0.7} />
      {/* trunk */}
      <Path d={trunk} stroke={dark} strokeWidth={17} fill="none" strokeLinecap="round" />
      <Path d={trunk} stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />
      {/* eyes */}
      {joy ? (
        <G>
          <Path d="M 38 56 Q 44 49 50 56" stroke="#2B2D42" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M 70 56 Q 76 49 82 56" stroke="#2B2D42" strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Ellipse cx={44} cy={55} rx={6} ry={7.5} fill="#2B2D42" />
          <Ellipse cx={76} cy={55} rx={6} ry={7.5} fill="#2B2D42" />
          <Circle cx={46} cy={52} r={2.4} fill="#FFFFFF" />
          <Circle cx={78} cy={52} r={2.4} fill="#FFFFFF" />
        </G>
      )}
      {/* cheeks */}
      <Ellipse cx={36} cy={68} rx={6} ry={4} fill="#FF7FA8" opacity={0.55} />
      <Ellipse cx={84} cy={68} rx={6} ry={4} fill="#FF7FA8" opacity={0.55} />
      {/* little tuft */}
      <Path d="M 57 26 Q 60 16 63 26" stroke={dark} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
