import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import type { ShapeName } from '../schema';

const DEFAULT_COLORS: Record<ShapeName, string> = {
  circle: '#FF6B6B',
  square: '#4DABF7',
  triangle: '#51CF66',
  rectangle: '#FF922B',
  oval: '#F783AC',
  star: '#FCC419',
  heart: '#FA5252',
  diamond: '#9775FA',
  pentagon: '#20C997',
  hexagon: '#5C7CFA',
};

function regular(n: number, cx: number, cy: number, r: number, rot = -Math.PI / 2): string {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

/** A flat, friendly shape drawn in SVG (100×100 viewBox). */
export function ShapeView({ shape, color, size = 72 }: { shape: ShapeName; color?: string; size?: number }) {
  const fill = color ?? DEFAULT_COLORS[shape];
  const stroke = 'rgba(0,0,0,0.18)';
  const sw = 4;
  let body: React.ReactNode;
  switch (shape) {
    case 'circle':
      body = <Circle cx={50} cy={50} r={42} fill={fill} stroke={stroke} strokeWidth={sw} />;
      break;
    case 'square':
      body = <Rect x={10} y={10} width={80} height={80} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />;
      break;
    case 'rectangle':
      body = <Rect x={4} y={26} width={92} height={48} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />;
      break;
    case 'oval':
      body = <Ellipse cx={50} cy={50} rx={45} ry={30} fill={fill} stroke={stroke} strokeWidth={sw} />;
      break;
    case 'triangle':
      body = <Polygon points="50,8 94,88 6,88" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      break;
    case 'diamond':
      body = <Polygon points="50,4 88,50 50,96 12,50" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      break;
    case 'pentagon':
      body = <Polygon points={regular(5, 50, 54, 44)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      break;
    case 'hexagon':
      body = <Polygon points={regular(6, 50, 50, 44, 0)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      break;
    case 'star':
      body = <Polygon points={starPoints(50, 54, 46, 19)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
      break;
    case 'heart':
      body = (
        <Path
          d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={shape}>
      {body}
    </Svg>
  );
}
