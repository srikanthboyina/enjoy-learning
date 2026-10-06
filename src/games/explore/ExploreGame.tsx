import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import type { GameProps } from '../../engine/types';
import { BigButton } from '../../kit/BigButton';
import { Bob } from '../../kit/Bob';
import { ElephantBuddy } from '../../kit/ElephantBuddy';
import { DragDropProvider, Draggable, DropZone } from '../../kit/DragDrop';
import { Glyph } from '../../kit/Glyph';
import { Text } from '../../kit/Text';
import { playSound } from '../../services/sound';
import { colors, gradients, radii, sizes, spacing } from '../../theme';
import { OptionView, optionName } from './parts/OptionView';
import { Visual } from './parts/Visual';
import type { ExploreRound } from './schema';
import { tr } from '../../i18n';

type Of<M extends ExploreRound['mode']> = Extract<ExploreRound, { mode: M }>;

/** Each answer card gets its own cheerful colour. */
const CARD_TINTS = [
  { bg: '#FFF0F6', edge: '#F783AC' },
  { bg: '#E7F5FF', edge: '#4DABF7' },
  { bg: '#EBFBEE', edge: '#51CF66' },
  { bg: '#FFF4E6', edge: '#FF922B' },
];
const BIN_TINTS = [
  { bg: '#E7F5FF', edge: '#339AF0' },
  { bg: '#FFF4E6', edge: '#F76707' },
  { bg: '#F3F0FF', edge: '#7950F2' },
];

/** Sort cards may hold words or sums ("5+3", "in all") instead of an emoji. */
const isWords = (s: string) => /^[\x20-\x7E]+$/.test(s);

function Chip({ value, size }: { value: string; size: number }) {
  return isWords(value) ? (
    <Text style={[styles.chipWords, { fontSize: size * 0.55 }]} numberOfLines={1}>
      {tr(value)}
    </Text>
  ) : (
    <Glyph id={value} size={size} accessible={false} />
  );
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // never start already solved
  if (a.length > 1 && a.every((x, i) => x === items[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

export function ExploreGame(props: GameProps<ExploreRound>) {
  const r = props.round;
  switch (r.mode) {
    case 'show':
      return <Show {...props} round={r} />;
    case 'choice':
      return <Choice {...props} round={r} />;
    case 'sort':
      return <Sort {...props} round={r} />;
    case 'order':
      return <Order {...props} round={r} />;
    case 'grow':
      return <Grow {...props} round={r} />;
  }
}

/* ---------- show: a picture Ellie explains, then ▶️ ---------- */

function Show({ round, onRoundComplete }: GameProps<Of<'show'>>) {
  return (
    <View style={styles.col}>
      <View style={styles.stage}>
        {round.visual ? <Visual visual={round.visual} /> : <Bob distance={8} wobble><ElephantBuddy size={110} /></Bob>}
      </View>
      {round.caption && (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.caption}>
          <Text style={styles.captionText}>{tr(round.caption)}</Text>
        </Animated.View>
      )}
      <Animated.View entering={FadeIn.delay(1000)}>
        <BigButton label="Next" onPress={() => onRoundComplete()} round gradient={gradients.complex} size={sizes.bigTouch}>
          <Text style={styles.nextArrow}>▶</Text>
        </BigButton>
      </Animated.View>
    </View>
  );
}

/* ---------- choice: tap the right card ---------- */

function Choice({ round, onAttempt, onRoundComplete, hintActive }: GameProps<Of<'choice'>>) {
  const [tried, setTried] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  // with a hint, fade one wrong card that hasn't been tried yet
  const dimmed = useMemo(() => {
    if (!hintActive) return -1;
    return round.options.findIndex((_, i) => i !== round.answer && !tried.includes(i));
  }, [hintActive, round, tried]);

  const choose = (i: number) => {
    if (solved || tried.includes(i)) return;
    playSound('tap');
    if (i === round.answer) {
      setSolved(true);
      onAttempt(true);
      onRoundComplete({ explain: round.explain });
      return;
    }
    setTried((t) => [...t, i]);
    const why = round.options[i].why;
    onAttempt(false, why ? { hint: { say: why, icons: ['eyes'] } } : undefined);
  };

  const many = round.options.length === 4;
  const hasClock = round.options.some((o) => o.clock);
  return (
    <View style={styles.col}>
      {round.visual && (
        <View style={styles.stage}>
          <Visual visual={round.visual} compact={many} />
        </View>
      )}
      <View style={[styles.options, many && styles.grid]}>
        {round.options.map((o, i) => {
          const tint = CARD_TINTS[i % CARD_TINTS.length];
          const off = tried.includes(i) || i === dimmed;
          const right = solved && i === round.answer;
          return (
            <Animated.View key={i} entering={ZoomIn.delay(150 + i * 90).springify()} style={many ? styles.gridCell : undefined}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={optionName(o)}
                testID={`option-${i}`}
                onPress={() => choose(i)}
                style={({ pressed }) => [
                  styles.card,
                  hasClock && styles.cardTall,
                  { backgroundColor: tint.bg, borderColor: tint.edge },
                  off && styles.off,
                  right && styles.right,
                  pressed && styles.pressed,
                ]}>
                <OptionView option={o} small={many && hasClock} />
                {right && (
                  <Animated.View entering={ZoomIn.springify()} style={styles.tick}>
                    <Text style={styles.tickText}>✓</Text>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- sort: drag (or tap, then tap a box) each thing into its group ---------- */

function Sort({ round, onAttempt, onRoundComplete, hintActive }: GameProps<Of<'sort'>>) {
  const order = useMemo(() => shuffled(round.items.map((_, i) => i)), [round]);
  const [placed, setPlaced] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const left = order.filter((i) => placed[i] === undefined);
  const focus = selected ?? left[0];

  const put = (item: number, bin: number): boolean => {
    const it = round.items[item];
    if (it.bin !== bin) {
      setSelected(null);
      const name = it.name ? `The ${it.name}` : 'That one';
      onAttempt(false, { hint: { say: `${name} goes in a different box.`, icons: [it.emoji, 'eyes'] } });
      return false;
    }
    const next = { ...placed, [item]: bin };
    setPlaced(next);
    setSelected(null);
    onAttempt(true);
    if (Object.keys(next).length === round.items.length) onRoundComplete({ explain: round.explain });
    return true;
  };

  return (
    <DragDropProvider>
      <View style={styles.col}>
        <View style={styles.tray}>
          {left.map((i) => (
            <Draggable
              key={i}
              accessibilityLabel={round.items[i].name ?? round.items[i].emoji}
              onTap={() => {
                playSound('tap');
                setSelected(i === selected ? null : i);
              }}
              onDragStart={() => setSelected(i)}
              onDrop={(zone) => (zone ? put(i, Number(zone.slice(4))) : false)}>
              <Bob distance={4} delay={i * 130}>
                <View style={[styles.chip, isWords(round.items[i].emoji) && styles.chipWide, selected === i && styles.chipOn]}>
                  <Chip value={round.items[i].emoji} size={44} />
                </View>
              </Bob>
            </Draggable>
          ))}
          {left.length === 0 && <Glyph id="🎉" size={48} />}
        </View>
        <View style={styles.bins}>
          {round.bins.map((b, bi) => {
            const tint = BIN_TINTS[bi % BIN_TINTS.length];
            const glow = hintActive && focus !== undefined && round.items[focus]?.bin === bi;
            const inside = order.filter((i) => placed[i] === bi);
            return (
              <DropZone key={bi} id={`bin-${bi}`} style={styles.binWrap} accessibilityLabel={b.label}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={b.label}
                  onPress={() => selected !== null && put(selected, bi)}
                  style={[
                    styles.bin,
                    { backgroundColor: tint.bg, borderColor: tint.edge },
                    glow && styles.glow,
                    selected !== null && styles.binReady,
                  ]}>
                  <View style={styles.binHead}>
                    <Glyph id={b.emoji} size={34} accessible={false} />
                    <Text style={[styles.binLabel, { color: tint.edge }]} numberOfLines={2}>
                      {tr(b.label)}
                    </Text>
                  </View>
                  <View style={styles.binItems}>
                    {inside.map((i) => (
                      <Animated.View key={i} entering={ZoomIn.springify()}>
                        <Chip value={round.items[i].emoji} size={30} />
                      </Animated.View>
                    ))}
                  </View>
                </Pressable>
              </DropZone>
            );
          })}
        </View>
      </View>
    </DragDropProvider>
  );
}

/* ---------- order: tap the cards in the right order ---------- */

function Order({ round, onAttempt, onRoundComplete, hintActive }: GameProps<Of<'order'>>) {
  const order = useMemo(() => shuffled(round.items.map((_, i) => i)), [round]);
  const [done, setDone] = useState(0);
  // cards already placed (by index); repeated cards like "cat, dog, cat" are interchangeable
  const [used, setUsed] = useState<number[]>([]);
  const same = (a: number, b: number) => optionName(round.items[a]) === optionName(round.items[b]);

  const tap = (i: number) => {
    if (used.includes(i) || done >= round.items.length) return;
    playSound('tap');
    if (!same(i, done)) {
      onAttempt(false, { hint: { say: 'Not that one yet. What comes next?', icons: ['eyes'] } });
      return;
    }
    const next = done + 1;
    setDone(next);
    setUsed((u) => [...u, i]);
    onAttempt(true);
    if (next === round.items.length) onRoundComplete({ explain: round.explain });
  };
  const glowing = order.find((i) => !used.includes(i) && done < round.items.length && same(i, done));

  const small = round.items.length > 4;
  return (
    <View style={styles.col}>
      <View style={styles.slots}>
        {round.items.map((o, i) => (
          <View key={i} style={[styles.slot, small && styles.slotSmall, i < done && styles.slotFilled]}>
            <Text style={styles.slotNum}>{i + 1}</Text>
            {i < done ? (
              <Animated.View entering={ZoomIn.springify()}>
                <OptionView option={o} small />
              </Animated.View>
            ) : (
              <Text style={styles.slotQ}>?</Text>
            )}
          </View>
        ))}
      </View>
      <View style={styles.options}>
        {order.map((i, k) =>
          used.includes(i) ? null : (
            <Animated.View key={i} entering={ZoomIn.delay(k * 90).springify()}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={optionName(round.items[i])}
                onPress={() => tap(i)}
                style={({ pressed }) => [
                  styles.card,
                  styles.cardSmall,
                  { backgroundColor: CARD_TINTS[k % 4].bg, borderColor: CARD_TINTS[k % 4].edge },
                  hintActive && i === glowing && styles.glow,
                  pressed && styles.pressed,
                ]}>
                <OptionView option={round.items[i]} small={small} />
              </Pressable>
            </Animated.View>
          ),
        )}
      </View>
    </View>
  );
}

/* ---------- grow: water and sun help a seed grow into a flower ---------- */

const DEFAULT_STAGES = ['🌰', '🌱', '🌿', '🪴', '🌻'];

function Grow({ round, onAttempt, onRoundComplete, speak, hintActive }: GameProps<Of<'grow'>>) {
  const stages = round.stages ?? DEFAULT_STAGES;
  const [stage, setStage] = useState(0);
  const [water, setWater] = useState(0);
  const [sun, setSun] = useState(0);
  const [droop, setDroop] = useState(false);
  const finished = stage >= stages.length - 1;
  const needWater = water < round.needs.water;
  const needSun = sun < round.needs.sun;

  const give = (kind: 'water' | 'sun') => {
    if (finished) return;
    const w = kind === 'water' ? water + 1 : water;
    const s = kind === 'sun' ? sun + 1 : sun;
    if (kind === 'water' && !needWater && round.tooMuch) {
      setDroop(true);
      onAttempt(false, {
        hint: { say: 'Oh no, too much water! The plant is soggy. It needs sunshine now.', icons: ['💧', '☀️'] },
      });
      return;
    }
    if (kind === 'sun' && !needSun && needWater) {
      onAttempt(false, { hint: { say: 'The plant is thirsty. It needs water too.', icons: ['💧'] } });
      return;
    }
    setDroop(false);
    playSound(kind === 'water' ? 'pop' : 'tap');
    setWater(w);
    setSun(s);
    if (w >= round.needs.water && s >= round.needs.sun) {
      const next = stage + 1;
      setStage(next);
      setWater(0);
      setSun(0);
      if (next >= stages.length - 1) {
        onAttempt(true);
        onRoundComplete({ explain: round.explain });
      } else {
        speak('It grew!');
      }
    }
  };

  const dots = (have: number, need: number, emoji: string) =>
    Array.from({ length: need }, (_, i) => (
      <Text key={i} style={[styles.dot, i >= have && styles.dotEmpty]}>
        {emoji}
      </Text>
    ));

  return (
    <View style={styles.col}>
      <View style={[styles.stage, styles.garden]}>
        <View style={styles.stageRow}>
          {stages.map((e, i) => (
            <Text key={i} style={[styles.mini, i === stage && styles.miniOn, i > stage && styles.miniLater]}>
              {e}
            </Text>
          ))}
        </View>
        <Animated.View key={stage} entering={ZoomIn.springify()} style={droop && styles.droop}>
          <Bob distance={4} wobble>
            <Glyph id={stages[Math.min(stage, stages.length - 1)]} size={110} />
          </Bob>
        </Animated.View>
        <View style={styles.soil} />
        {!finished && (
          <View style={styles.needs}>
            <View style={styles.needRow}>{dots(water, round.needs.water, '💧')}</View>
            <View style={styles.needRow}>{dots(sun, round.needs.sun, '☀️')}</View>
          </View>
        )}
      </View>
      <View style={styles.growButtons}>
        <BigButton
          label="Water"
          onPress={() => give('water')}
          gradient={['#74C0FC', '#339AF0']}
          size={sizes.bigTouch}
          sound={null}
          style={hintActive && needWater ? styles.glowRound : undefined}>
          <Glyph id="💧" size={48} accessible={false} />
        </BigButton>
        <BigButton
          label="Sunshine"
          onPress={() => give('sun')}
          gradient={['#FFE066', '#FCC419']}
          size={sizes.bigTouch}
          sound={null}
          style={hintActive && !needWater && needSun ? styles.glowRound : undefined}>
          <Glyph id="☀️" size={48} accessible={false} />
        </BigButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', gap: spacing.md, alignSelf: 'stretch' },
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#F8F9FF',
    borderWidth: 3,
    borderColor: '#E5E9FF',
    minHeight: 120,
  },
  caption: {
    backgroundColor: '#FFF3BF',
    borderRadius: radii.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 3,
    borderColor: '#FFD43B',
  },
  captionText: { fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  nextArrow: { fontSize: 36, color: '#fff', marginLeft: 4 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  grid: { maxWidth: 420, alignSelf: 'center' },
  gridCell: { width: '44%', minWidth: 130 },
  card: {
    minWidth: 120,
    minHeight: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 4,
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTall: { minHeight: 130 },
  cardSmall: { minWidth: 96, minHeight: 88 },
  off: { opacity: 0.35 },
  right: { borderColor: colors.success, backgroundColor: '#D3F9D8', transform: [{ scale: 1.06 }] },
  pressed: { transform: [{ scale: 0.95 }] },
  tick: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 80,
    alignSelf: 'stretch',
  },
  chip: {
    width: sizes.touch + 8,
    height: sizes.touch + 8,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#DEE2E6',
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { width: undefined, minWidth: sizes.touch + 8, paddingHorizontal: spacing.sm },
  chipWords: { fontWeight: '700', color: colors.ink },
  chipOn: { borderColor: '#FCC419', backgroundColor: '#FFF9DB', transform: [{ scale: 1.1 }] },
  bins: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  binWrap: { flex: 1 },
  bin: {
    minHeight: 150,
    borderRadius: radii.md,
    borderWidth: 4,
    borderStyle: 'dashed',
    padding: spacing.sm,
    alignItems: 'center',
  },
  binReady: { borderStyle: 'solid' },
  binHead: { alignItems: 'center' },
  binLabel: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  binItems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: spacing.xs },
  glow: {
    borderColor: '#FCC419',
    borderStyle: 'solid',
    shadowColor: '#FCC419',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  glowRound: {
    borderRadius: radii.round,
    shadowColor: '#FCC419',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  slot: {
    width: 104,
    minHeight: 104,
    borderRadius: radii.md,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#B197FC',
    backgroundColor: '#F8F0FC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  slotSmall: { width: 84, minHeight: 92 },
  slotFilled: { borderStyle: 'solid', borderColor: colors.success, backgroundColor: '#EBFBEE' },
  slotNum: {
    position: 'absolute',
    top: 2,
    left: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#9775FA',
  },
  slotQ: { fontSize: 30, fontWeight: '700', color: '#B197FC' },
  garden: { backgroundColor: '#E3FAFC', borderColor: '#99E9F2', paddingBottom: 0, overflow: 'hidden' },
  stageRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  mini: { fontSize: 24, opacity: 0.9 },
  miniOn: { transform: [{ scale: 1.35 }] },
  miniLater: { opacity: 0.3 },
  droop: { transform: [{ rotate: '18deg' }], opacity: 0.75 },
  soil: { alignSelf: 'stretch', height: 22, backgroundColor: '#A0785A', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginHorizontal: -spacing.md },
  needs: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.xs },
  needRow: { flexDirection: 'row', gap: 2 },
  dot: { fontSize: 22 },
  dotEmpty: { opacity: 0.22 },
  growButtons: { flexDirection: 'row', gap: spacing.xl },
});
