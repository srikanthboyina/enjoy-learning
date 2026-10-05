import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Bob } from '../../../kit/Bob';
import { Glyph } from '../../../kit/Glyph';
import { Text } from '../../../kit/Text';
import { colors, families, radii, spacing } from '../../../theme';
import type { Visual as VisualData } from '../schema';
import { Clock } from './Clock';
import { ShapeView } from './ShapeView';

const EMOJI_SIZE = { sm: 34, md: 46, lg: 64 } as const;

function pop(i: number) {
  return ZoomIn.delay(Math.min(i, 14) * 70).springify();
}

/** Bigger groups get smaller pictures so they still fit. */
function sizeFor(count: number): number {
  if (count <= 4) return 46;
  if (count <= 8) return 38;
  return 30;
}

export function Visual({ visual, compact = false }: { visual: VisualData; compact?: boolean }) {
  switch (visual.kind) {
    case 'emoji': {
      const s = EMOJI_SIZE[visual.size ?? (visual.items.length <= 3 ? 'lg' : 'md')] * (compact ? 0.8 : 1);
      return (
        <View style={styles.wrap}>
          {visual.items.map((e, i) => (
            <Animated.View key={i} entering={pop(i)}>
              <Bob distance={3} period={2200 + (i % 3) * 300} delay={i * 120}>
                <Glyph id={e} size={s} />
              </Bob>
            </Animated.View>
          ))}
        </View>
      );
    }
    case 'text':
      return (
        <Animated.View entering={ZoomIn.springify()} style={styles.textBox}>
          <Text style={[styles.bigText, compact && { fontSize: 34 }]}>{visual.text}</Text>
        </Animated.View>
      );
    case 'groups':
      return (
        <View style={styles.groupsRow}>
          {visual.groups.map((g, gi) => (
            <View key={gi} style={styles.groupsRow}>
              {gi > 0 && visual.op && (
                <Text style={styles.op}>{visual.op === 'and' ? '&' : visual.op}</Text>
              )}
              <View style={styles.group}>
                <View style={[styles.wrap, { maxWidth: g.count > 6 ? 180 : 150 }]}>
                  {Array.from({ length: g.count }, (_, i) => (
                    <Animated.View key={i} entering={pop(gi * 4 + i)}>
                      <Glyph id={g.emoji} size={sizeFor(g.count) * (compact ? 0.8 : 1)} accessible={false} />
                    </Animated.View>
                  ))}
                  {g.count === 0 && <Text style={styles.empty}>∅</Text>}
                </View>
                {visual.showNumbers && <Text style={styles.groupNum}>{g.count}</Text>}
              </View>
            </View>
          ))}
        </View>
      );
    case 'take':
      return (
        <View style={[styles.wrap, styles.group]}>
          {Array.from({ length: visual.count }, (_, i) => {
            const gone = i >= visual.count - visual.remove;
            return (
              <Animated.View key={i} entering={pop(i)} style={gone && styles.gone}>
                <Glyph id={visual.emoji} size={sizeFor(visual.count)} accessible={false} />
                {gone && <Text style={styles.cross}>✖</Text>}
              </Animated.View>
            );
          })}
        </View>
      );
    case 'sequence':
      return (
        <View style={styles.wrap}>
          {visual.items.map((e, i) =>
            e === '?' ? (
              <Animated.View key={i} entering={pop(i)} style={styles.blank}>
                <Text style={styles.q}>?</Text>
              </Animated.View>
            ) : (
              <Animated.View key={i} entering={pop(i)} style={styles.seqItem}>
                {/^\d+$/.test(e) ? <Text style={styles.seqNum}>{e}</Text> : <Glyph id={e} size={40} />}
              </Animated.View>
            ),
          )}
        </View>
      );
    case 'clock':
      return (
        <Animated.View entering={ZoomIn.springify()}>
          <Clock hour={visual.hour} minute={visual.minute} size={compact ? 130 : 170} />
        </Animated.View>
      );
    case 'shapes':
      return (
        <View style={styles.wrap}>
          {visual.shapes.map((s, i) => (
            <Animated.View key={i} entering={pop(i)}>
              <Bob distance={3} delay={i * 150}>
                <ShapeView shape={s.shape} color={s.color} size={visual.shapes.length > 4 ? 60 : 84} />
              </Bob>
            </Animated.View>
          ))}
        </View>
      );
    case 'pairs': {
      const pairs = Math.floor(visual.count / 2);
      const odd = visual.count % 2 === 1;
      return (
        <View style={styles.wrap}>
          {Array.from({ length: pairs }, (_, i) => (
            <Animated.View key={i} entering={pop(i)} style={styles.pair}>
              <Glyph id={visual.emoji} size={34} accessible={false} />
              <Glyph id={visual.emoji} size={34} accessible={false} />
            </Animated.View>
          ))}
          {odd && (
            <Animated.View entering={pop(pairs)} style={[styles.pair, styles.lonely]}>
              <Glyph id={visual.emoji} size={34} accessible={false} />
            </Animated.View>
          )}
        </View>
      );
    }
    case 'sizes':
      return (
        <View style={[styles.wrap, { alignItems: 'flex-end' }]}>
          {visual.items.map((it, i) => (
            <Animated.View key={i} entering={pop(i)}>
              <Glyph id={it.emoji} size={46 * it.scale} />
            </Animated.View>
          ))}
        </View>
      );
    case 'numberline':
      return <NumberLine {...visual} />;
  }
}

function NumberLine({ from, to, step, hops }: { from: number; to: number; step: number; hops?: number }) {
  const ticks: number[] = [];
  for (let n = from; n <= to; n += step) ticks.push(n);
  const W = 320;
  const pad = 20;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(ticks.length - 1, 1);
  const shown = Math.min(hops ?? 0, ticks.length - 1);
  return (
    <Animated.View entering={ZoomIn.springify()} exiting={FadeOut}>
      <Svg width="100%" height={110} viewBox={`0 0 ${W} 110`} style={{ maxWidth: 520 }}>
        <Line x1={pad - 10} y1={80} x2={W - pad + 10} y2={80} stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
        {ticks.map((n, i) => (
          <SvgText key={`t${i}`} x={x(i)} y={104} fontSize={ticks.length > 11 ? 11 : 15} fontWeight="bold"
            fontFamily={families.bold} fill={colors.ink} textAnchor="middle">
            {n}
          </SvgText>
        ))}
        {ticks.map((_, i) => (
          <Line key={`l${i}`} x1={x(i)} y1={72} x2={x(i)} y2={88} stroke={colors.ink} strokeWidth={3} />
        ))}
        {Array.from({ length: shown }, (_, i) => {
          const a = x(i);
          const b = x(i + 1);
          const mid = (a + b) / 2;
          return (
            <Path
              key={`h${i}`}
              d={`M ${a} 74 Q ${mid} ${20} ${b} 74`}
              stroke="#9775FA"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        {shown > 0 && <Circle cx={x(shown)} cy={80} r={9} fill="#FF6B6B" />}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  textBox: {
    backgroundColor: '#FFF9DB',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderColor: '#FFE066',
  },
  bigText: { fontSize: 44, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  groupsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  group: {
    backgroundColor: '#F1F3F5',
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  groupNum: { fontSize: 28, fontWeight: '700', color: '#7048E8', marginTop: 2 },
  op: { fontSize: 44, fontWeight: '700', color: '#F76707' },
  empty: { fontSize: 36, color: colors.inkSoft },
  gone: { opacity: 0.35 },
  cross: { position: 'absolute', alignSelf: 'center', top: '18%', fontSize: 26, color: '#FA5252' },
  blank: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#9775FA',
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  q: { fontSize: 32, fontWeight: '700', color: '#7048E8' },
  seqItem: { minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  seqNum: { fontSize: 34, fontWeight: '700', color: colors.ink, paddingHorizontal: 6 },
  pair: {
    flexDirection: 'row',
    backgroundColor: '#E7F5FF',
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: '#74C0FC',
    padding: 2,
  },
  lonely: { backgroundColor: '#FFF0F6', borderColor: '#F783AC', borderStyle: 'dashed' },
});
