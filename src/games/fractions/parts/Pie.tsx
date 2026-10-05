// A round pizza or cake drawn with SVG, split into equal wedges.
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { Shape } from '../schema';

export const PALETTE: Record<Shape, { base: string; edge: string; topping: string; ghost: string }> = {
  pizza: { base: '#FFD8A8', edge: '#E8590C', topping: '#E03131', ghost: '#FFF4E6' },
  cake: { base: '#FCC2D7', edge: '#A61E4D', topping: '#FFFFFF', ghost: '#FFF0F6' },
};

const START = -90; // degrees; 0 = 3 o'clock, so start cuts at 12 o'clock

export function polar(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}

function wedge(c: number, r: number, from: number, to: number): string {
  const a = polar(c, r, from);
  const b = polar(c, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${c} ${c} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

/** Little toppings in each wedge: pepperoni for pizza, sprinkles for cake. */
function Toppings({ c, r, from, to, shape }: { c: number; r: number; from: number; to: number; shape: Shape }) {
  const mid = (from + to) / 2;
  const spots = [
    polar(c, r * 0.55, mid),
    polar(c, r * 0.78, mid - (to - from) / 4),
    polar(c, r * 0.78, mid + (to - from) / 4),
  ];
  const color = PALETTE[shape].topping;
  return (
    <>
      {spots.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={r * (shape === 'pizza' ? 0.08 : 0.05)} fill={color} />
      ))}
    </>
  );
}

interface PieProps {
  shape: Shape;
  size: number;
  /** number of equal wedges */
  parts: number;
  /** wedges drawn full; the rest are pale "eaten" ghosts. Default: all. */
  filled?: number;
  /** push wedges apart (after a successful cut) */
  separated?: boolean;
}

/** A pie split into `parts` equal wedges, `filled` of them shown full. */
export function Pie({ shape, size, parts, filled = parts, separated = false }: PieProps) {
  const pad = separated ? size * 0.06 : 4;
  const c = size / 2;
  const r = c - pad - 3;
  const step = 360 / parts;
  const p = PALETTE[shape];
  return (
    <Svg width={size} height={size}>
      {Array.from({ length: parts }, (_, i) => {
        const from = START + i * step;
        const to = from + step;
        const off = separated ? polar(0, pad * 0.8, (from + to) / 2) : { x: 0, y: 0 };
        const full = i < filled;
        return (
          <G key={i} transform={`translate(${off.x} ${off.y})`}>
            <Path
              d={parts === 1 ? '' : wedge(c, r, from, to)}
              fill={full ? p.base : p.ghost}
              stroke={p.edge}
              strokeWidth={3}
              strokeDasharray={full ? undefined : '6 5'}
            />
            {full && <Toppings c={c} r={r} from={from} to={to} shape={shape} />}
          </G>
        );
      })}
    </Svg>
  );
}

interface CutBoardProps {
  shape: Shape;
  size: number;
  /** number of possible cut lines (spokes) */
  spokes: number;
  cuts: number[];
  highlight: number[];
  onToggle: (spoke: number) => void;
}

/** The whole pie with dotted spokes the child taps to cut. */
export function CutBoard({ shape, size, spokes, cuts, highlight, onToggle }: CutBoardProps) {
  const c = size / 2;
  const r = c - 7;
  const p = PALETTE[shape];
  const step = 360 / spokes;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill={p.base} stroke={p.edge} strokeWidth={5} />
      <Toppings c={c} r={r} from={0} to={120} shape={shape} />
      <Toppings c={c} r={r} from={120} to={240} shape={shape} />
      <Toppings c={c} r={r} from={240} to={360} shape={shape} />
      {Array.from({ length: spokes }, (_, i) => {
        const end = polar(c, r, START + i * step);
        const cut = cuts.includes(i);
        const glow = highlight.includes(i) && !cut;
        return (
          <G key={i} onPress={() => onToggle(i)}>
            {/* wide invisible stroke = big touch target */}
            <Line x1={c} y1={c} x2={end.x} y2={end.y} stroke="rgba(0,0,0,0.01)" strokeWidth={34} />
            <Line
              x1={c}
              y1={c}
              x2={end.x}
              y2={end.y}
              stroke={cut ? '#343A40' : glow ? '#FAB005' : '#868E96'}
              strokeWidth={cut ? 7 : glow ? 7 : 3}
              strokeDasharray={cut ? undefined : '8 8'}
              strokeLinecap="round"
            />
          </G>
        );
      })}
      <Circle cx={c} cy={c} r={7} fill="#343A40" />
    </Svg>
  );
}
