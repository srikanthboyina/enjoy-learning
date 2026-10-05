// Picture types for numbers, money, data and measuring.
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Glyph } from '../../../kit/Glyph';
import { Text } from '../../../kit/Text';
import { colors, families, radii, spacing } from '../../../theme';

const pop = (i: number) => ZoomIn.delay(Math.min(i, 14) * 60).springify();

export function TenFrame({ count, emoji }: { count: number; emoji?: string }) {
  const frames = count > 10 ? 2 : 1;
  return (
    <View style={styles.frames} accessibilityLabel={`${count}`}>
      {Array.from({ length: frames }, (_, f) => (
        <View key={f} style={styles.frame}>
          {Array.from({ length: 10 }, (_, i) => {
            const n = f * 10 + i;
            const on = n < count;
            return (
              <View key={i} style={styles.cell}>
                {on &&
                  (emoji ? (
                    <Animated.View entering={pop(n)}>
                      <Glyph id={emoji} size={24} accessible={false} />
                    </Animated.View>
                  ) : (
                    <Animated.View entering={pop(n)} style={[styles.counter, f === 1 && { backgroundColor: '#339AF0' }]} />
                  ))}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PlaceValue({ tens, ones }: { tens: number; ones: number }) {
  return (
    <View style={styles.pv} accessibilityLabel={`${tens} tens and ${ones} ones`}>
      <View style={styles.pvGroup}>
        <View style={styles.rods}>
          {Array.from({ length: tens }, (_, i) => (
            <Animated.View key={i} entering={pop(i)} style={styles.rod}>
              {Array.from({ length: 10 }, (_, k) => (
                <View key={k} style={styles.rodCube} />
              ))}
            </Animated.View>
          ))}
          {tens === 0 && <Text style={styles.zero}>0</Text>}
        </View>
        <Text style={styles.pvLabel}>tens</Text>
      </View>
      <View style={styles.pvGroup}>
        <View style={styles.onesWrap}>
          {Array.from({ length: ones }, (_, i) => (
            <Animated.View key={i} entering={pop(tens + i)} style={styles.cube} />
          ))}
          {ones === 0 && <Text style={styles.zero}>0</Text>}
        </View>
        <Text style={styles.pvLabel}>ones</Text>
      </View>
    </View>
  );
}

const COIN_COLORS: [number, string, string][] = [
  [1, '#E8A87C', '#B5651D'],
  [2, '#D6D6D6', '#8E8E8E'],
  [5, '#E0E0E0', '#9E9E9E'],
  [10, '#FFD54F', '#C49000'],
  [20, '#FFE082', '#B8860B'],
  [25, '#CFD8DC', '#78909C'],
  [50, '#FFCA28', '#A87900'],
  [100, '#FFB300', '#8D6E00'],
];

function coinColor(v: number): [string, string] {
  const hit = COIN_COLORS.find(([n]) => n === v) ?? COIN_COLORS[3];
  return [hit[1], hit[2]];
}

export function Coin({ value, size = 56 }: { value: number; size?: number }) {
  const [fill, edge] = coinColor(value);
  const big = value >= 10;
  const s = big ? size * 1.1 : size;
  return (
    <Svg width={s} height={s} viewBox="0 0 100 100" accessibilityLabel={`${value} coin`}>
      <Circle cx={50} cy={50} r={46} fill={fill} stroke={edge} strokeWidth={6} />
      <Circle cx={50} cy={50} r={36} fill="none" stroke={edge} strokeWidth={2} strokeDasharray="4 4" />
      <SvgText x={50} y={value >= 100 ? 62 : 64} fontSize={value >= 100 ? 30 : 38} fontWeight="bold" fontFamily={families.bold} fill="#3E2C00" textAnchor="middle">
        {value}
      </SvgText>
    </Svg>
  );
}

export function Coins({ coins }: { coins: number[] }) {
  return (
    <View style={styles.wrap}>
      {coins.map((v, i) => (
        <Animated.View key={i} entering={pop(i)}>
          <Coin value={v} size={coins.length > 6 ? 46 : 58} />
        </Animated.View>
      ))}
    </View>
  );
}

const BAR_COLORS = ['#FF6B6B', '#4DABF7', '#51CF66', '#FCC419', '#9775FA'];

export function Bars({ bars }: { bars: { emoji: string; value: number; label?: string }[] }) {
  const max = Math.max(5, ...bars.map((b) => b.value));
  const H = 150;
  return (
    <View style={styles.chart}>
      <View style={[styles.axis, { height: H }]}>
        {Array.from({ length: max }, (_, i) => i + 1)
          .filter((n) => max <= 6 || n % 2 === 0)
          .map((n) => (
            <Text key={n} style={[styles.axisNum, { bottom: (H * n) / max - 8 }]}>
              {n}
            </Text>
          ))}
      </View>
      {bars.map((b, i) => (
        <View key={i} style={styles.barCol} accessibilityLabel={`${b.label ?? b.emoji}: ${b.value}`}>
          <View style={[styles.barTrack, { height: H }]}>
            <Animated.View
              entering={ZoomIn.delay(i * 120)}
              style={[styles.bar, { height: (H * b.value) / max, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]}>
              {Array.from({ length: b.value }, (_, k) => (
                <View key={k} style={[styles.barLine, { height: H / max }]} />
              ))}
            </Animated.View>
          </View>
          <Glyph id={b.emoji} size={30} accessible={false} />
          {b.label && <Text style={styles.barLabel}>{b.label}</Text>}
        </View>
      ))}
    </View>
  );
}

export function Tally({ count }: { count: number }) {
  const bundles = Math.floor(count / 5);
  const rest = count % 5;
  const bundle = (n: number, key: number, gate: boolean) => (
    <Animated.View key={key} entering={pop(key)}>
      <Svg width={14 * 4 + 16} height={64}>
        {Array.from({ length: n }, (_, i) => (
          <Line key={i} x1={10 + i * 14} y1={6} x2={10 + i * 14} y2={58} stroke={colors.ink} strokeWidth={5} strokeLinecap="round" />
        ))}
        {gate && <Line x1={2} y1={50} x2={14 * 4 + 14} y2={14} stroke="#E03131" strokeWidth={5} strokeLinecap="round" />}
      </Svg>
    </Animated.View>
  );
  return (
    <View style={styles.wrap} accessibilityLabel={`${count} tally marks`}>
      {Array.from({ length: bundles }, (_, i) => bundle(4, i, true))}
      {rest > 0 && bundle(rest, bundles, false)}
    </View>
  );
}

export function ArrayGrid({ rows, cols, emoji }: { rows: number; cols: number; emoji: string }) {
  const size = cols > 7 ? 24 : cols > 5 ? 30 : 36;
  return (
    <View style={styles.array} accessibilityLabel={`${rows} rows of ${cols}`}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.arrayRow}>
          {Array.from({ length: cols }, (_, c) => (
            <Animated.View key={c} entering={pop(r + c)}>
              <Glyph id={emoji} size={size} accessible={false} />
            </Animated.View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Ruler({ length, emoji, color = '#74C0FC' }: { length: number; emoji: string; color?: string }) {
  const units = 12;
  const W = 330;
  const pad = 14;
  const u = (W - pad * 2) / units;
  return (
    <View accessibilityLabel={`${length} units long`}>
      <Svg width="100%" height={118} viewBox={`0 0 ${W} 118`} style={{ maxWidth: 520 }}>
        <Rect x={pad} y={20} width={u * length} height={30} rx={14} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
        <Rect x={pad - 4} y={62} width={W - pad * 2 + 8} height={46} rx={6} fill="#FFE8A3" stroke="#E0A800" strokeWidth={2} />
        {Array.from({ length: units + 1 }, (_, i) => (
          <Line key={i} x1={pad + i * u} y1={62} x2={pad + i * u} y2={i % 1 === 0 ? 78 : 70} stroke="#7A5B00" strokeWidth={2} />
        ))}
        {Array.from({ length: units + 1 }, (_, i) => (
          <SvgText key={`n${i}`} x={pad + i * u} y={100} fontSize={12} fontWeight="bold" fontFamily={families.bold} fill="#5C4400" textAnchor="middle">
            {i}
          </SvgText>
        ))}
        <Line x1={pad + u * length} y1={14} x2={pad + u * length} y2={62} stroke="#E03131" strokeWidth={2} strokeDasharray="4 3" />
      </Svg>
      <View style={[styles.rulerEmoji, { left: `${((pad + (u * length) / 2) / W) * 100}%` }]}>
        <Glyph id={emoji} size={30} accessible={false} />
      </View>
    </View>
  );
}

export function Thermometer({ level }: { level: number }) {
  const top = 12;
  const bottom = 132;
  const y = bottom - ((bottom - top) * level) / 10;
  const hot = level >= 7;
  const cold = level <= 2;
  const fill = hot ? '#FA5252' : cold ? '#4DABF7' : '#FCC419';
  return (
    <View style={styles.thermo} accessibilityLabel={hot ? 'hot' : cold ? 'cold' : 'warm'}>
      <Svg width={70} height={170} viewBox="0 0 70 170">
        <Rect x={25} y={6} width={20} height={140} rx={10} fill="#FFFFFF" stroke="#868E96" strokeWidth={3} />
        <Rect x={29} y={y} width={12} height={146 - y} fill={fill} />
        <Circle cx={35} cy={148} r={17} fill={fill} stroke="#868E96" strokeWidth={3} />
        {Array.from({ length: 11 }, (_, i) => (
          <Line key={i} x1={47} y1={bottom - (i * (bottom - top)) / 10} x2={i % 5 === 0 ? 58 : 53} y2={bottom - (i * (bottom - top)) / 10} stroke="#868E96" strokeWidth={2} />
        ))}
      </Svg>
      <Text style={styles.thermoIcon}>{hot ? '🥵' : cold ? '🥶' : '🙂'}</Text>
    </View>
  );
}

export function Balance({ left, right, heavier }: { left: string; right: string; heavier: 'left' | 'right' | 'same' }) {
  const tilt = heavier === 'left' ? -12 : heavier === 'right' ? 12 : 0;
  const W = 300;
  const c = W / 2;
  const arm = 110;
  const rad = (tilt * Math.PI) / 180;
  const lx = c - arm * Math.cos(rad);
  const ly = 60 - arm * Math.sin(rad);
  const rx = c + arm * Math.cos(rad);
  const ry = 60 + arm * Math.sin(rad);
  return (
    <View style={{ width: W, height: 190 }} accessibilityLabel={heavier === 'same' ? 'balanced' : `${heavier} side is heavier`}>
      <Svg width={W} height={190}>
        <Path d={`M ${c - 40} 182 L ${c + 40} 182 L ${c} 60 Z`} fill="#ADB5BD" />
        <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#495057" strokeWidth={8} strokeLinecap="round" />
        <Circle cx={c} cy={60} r={8} fill="#495057" />
        <Line x1={lx} y1={ly} x2={lx} y2={ly + 40} stroke="#495057" strokeWidth={3} />
        <Line x1={rx} y1={ry} x2={rx} y2={ry + 40} stroke="#495057" strokeWidth={3} />
        <Path d={`M ${lx - 40} ${ly + 40} Q ${lx} ${ly + 62} ${lx + 40} ${ly + 40} Z`} fill="#FFD43B" stroke="#E0A800" strokeWidth={3} />
        <Path d={`M ${rx - 40} ${ry + 40} Q ${rx} ${ry + 62} ${rx + 40} ${ry + 40} Z`} fill="#FFD43B" stroke="#E0A800" strokeWidth={3} />
      </Svg>
      <View style={[styles.pan, { left: lx - 28, top: ly - 18 }]}>
        <Glyph id={left} size={46} accessible={false} />
      </View>
      <View style={[styles.pan, { left: rx - 28, top: ry - 18 }]}>
        <Glyph id={right} size={46} accessible={false} />
      </View>
    </View>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_COLORS = ['#FF8787', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA', '#F783AC'];

export function Week({ highlight }: { highlight?: number }) {
  return (
    <View style={styles.week}>
      {DAYS.map((d, i) => (
        <Animated.View
          key={d}
          entering={pop(i)}
          style={[
            styles.day,
            { backgroundColor: DAY_COLORS[i] },
            highlight !== undefined && highlight !== i && styles.dayDim,
            highlight === i && styles.dayOn,
          ]}>
          <Text style={styles.dayText}>{d}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  frames: { gap: spacing.sm, alignItems: 'center' },
  frame: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 5 * 46 + 6,
    borderWidth: 3,
    borderColor: '#495057',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  cell: { width: 46, height: 46, borderWidth: 1.5, borderColor: '#ADB5BD', alignItems: 'center', justifyContent: 'center' },
  counter: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FA5252' },
  pv: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-end' },
  pvGroup: { alignItems: 'center', gap: 4 },
  rods: { flexDirection: 'row', gap: 4, minHeight: 40, alignItems: 'flex-end' },
  rod: { width: 16, borderRadius: 3, overflow: 'hidden', borderWidth: 1.5, borderColor: '#1864AB' },
  rodCube: { height: 12, backgroundColor: '#4DABF7', borderBottomWidth: 1, borderColor: '#1864AB' },
  onesWrap: { flexDirection: 'row', flexWrap: 'wrap', width: 3 * 18 + 8, gap: 4, justifyContent: 'center', minHeight: 40, alignContent: 'flex-end' },
  cube: { width: 14, height: 14, backgroundColor: '#FFA94D', borderWidth: 1.5, borderColor: '#D9480F', borderRadius: 2 },
  pvLabel: { fontSize: 15, fontWeight: '700', color: colors.inkSoft },
  zero: { fontSize: 22, color: colors.inkSoft },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingRight: spacing.sm },
  axis: { width: 18, alignSelf: 'flex-start' },
  axisNum: { position: 'absolute', right: 0, fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.inkSoft },
  barCol: { alignItems: 'center', width: 52 },
  barTrack: { justifyContent: 'flex-end', width: 40, borderBottomWidth: 3, borderColor: colors.ink },
  bar: { width: 40, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' },
  barLine: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  barLabel: { fontSize: 12, fontWeight: '600', color: colors.ink },
  array: { gap: 4, padding: spacing.sm, backgroundColor: '#FFF9DB', borderRadius: radii.sm },
  arrayRow: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  rulerEmoji: { position: 'absolute', top: 0, marginLeft: -18 },
  thermo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thermoIcon: { fontSize: 48 },
  pan: { position: 'absolute', width: 56, alignItems: 'center' },
  week: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' },
  day: { width: 38, height: 50, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  dayDim: { opacity: 0.35 },
  dayOn: { transform: [{ scale: 1.18 }], borderWidth: 3, borderColor: '#FFFFFF' },
  dayText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
