import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { numberWord } from '../../engine/phrases';
import type { GameProps } from '../../engine/types';
import { BigButton } from '../../kit/BigButton';
import { Glyph } from '../../kit/Glyph';
import { playSound } from '../../services/sound';
import { colors, radii, sizes, spacing } from '../../theme';
import { Croc } from './parts/Croc';
import { Group } from './parts/Group';
import { signFor, type CompareRound, type Sign } from './schema';

type ShowRound = Extract<CompareRound, { mode: 'show' }>;
type PickRound = Extract<CompareRound, { mode: 'pick' }>;
type SymbolRound = Extract<CompareRound, { mode: 'symbol' }>;
type Side = 'left' | 'right' | 'same';

export function CompareGame(props: GameProps<CompareRound>) {
  switch (props.round.mode) {
    case 'show':
      return <Show {...props} round={props.round} />;
    case 'pick':
      return <Pick {...props} round={props.round} />;
    case 'symbol':
      return <SymbolPick {...props} round={props.round} />;
  }
}

function Panel({ highlight, children }: { highlight?: boolean; children: React.ReactNode }) {
  return <View style={[styles.panel, highlight && styles.panelOn]}>{children}</View>;
}

/* ---------- show: a narrated example (lesson step, not scored) ---------- */

function Show({ round, onRoundComplete }: GameProps<ShowRound>) {
  const sign = signFor(round.left, round.right);
  const bigger: Side = sign === '>' ? 'left' : sign === '<' ? 'right' : 'same';
  return (
    <View style={styles.col}>
      <View style={styles.row}>
        <Panel highlight={!round.showSymbol && bigger !== 'right'}>
          <Group count={round.left} item={round.item} />
        </Panel>
        <View style={styles.middle}>
          {round.showSymbol && (
            <Animated.View entering={ZoomIn.delay(1800).springify()}>
              <Croc sign={sign} />
            </Animated.View>
          )}
          {!round.showSymbol && bigger === 'same' && (
            <Animated.View entering={ZoomIn.delay(1800).springify()}>
              <Glyph id="scale" size={48} />
            </Animated.View>
          )}
        </View>
        <Panel highlight={!round.showSymbol && bigger !== 'left'}>
          <Group count={round.right} item={round.item} />
        </Panel>
      </View>
      <Animated.View entering={FadeIn.delay(1200)}>
        <BigButton label="Next" onPress={onRoundComplete} round color={colors.grape} size={sizes.bigTouch}>
          <Glyph id="next" size={40} accessible={false} />
        </BigButton>
      </Animated.View>
    </View>
  );
}

/* ---------- pick: tap the side with more / fewer (or "same") ---------- */

function Pick({ round, onAttempt, onRoundComplete, hintActive }: GameProps<PickRound>) {
  const [tried, setTried] = useState<Side[]>([]);
  const sign = signFor(round.left, round.right);
  const answer: Side =
    sign === '=' ? 'same' : (sign === '>') === (round.ask === 'more') ? 'left' : 'right';

  const choose = (side: Side) => {
    playSound('tap');
    if (side === answer) {
      onAttempt(true);
      onRoundComplete();
      return;
    }
    setTried((t) => (t.includes(side) ? t : [...t, side]));
    const say =
      side === 'same'
        ? `Let's count. ${numberWord(round.left)} and ${numberWord(round.right)} are not the same.`
        : `That side has ${numberWord(side === 'left' ? round.left : round.right)}. Count the other side too.`;
    onAttempt(false, { hint: { say, icons: ['eyes', 'numbers'] } });
  };

  const side = (s: 'left' | 'right') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s === 'left' ? 'Left group' : 'Right group'}
      onPress={() => choose(s)}
      style={({ pressed }) => [styles.panel, styles.tappable, tried.includes(s) && styles.tried, pressed && styles.pressed]}>
      <Group count={s === 'left' ? round.left : round.right} item={round.item} showNumber={hintActive} />
    </Pressable>
  );

  return (
    <View style={styles.col}>
      <View style={styles.ask} accessibilityLabel={round.ask}>
        <Text style={styles.askText}>{round.ask === 'more' ? '⬆️' : '⬇️'}</Text>
        <Glyph id={round.item} size={40} accessible={false} />
      </View>
      <View style={styles.row}>
        {side('left')}
        {round.allowSame && (
          <BigButton
            label="Same"
            onPress={() => choose('same')}
            round
            color={colors.card}
            sound={null}
            style={tried.includes('same') ? styles.tried : undefined}>
            <Glyph id="scale" size={36} accessible={false} />
          </BigButton>
        )}
        {side('right')}
      </View>
    </View>
  );
}

/* ---------- symbol: which crocodile goes in the middle? ---------- */

function SymbolPick({ round, onAttempt, onRoundComplete, hintActive }: GameProps<SymbolRound>) {
  const answer = signFor(round.left, round.right);
  const [placed, setPlaced] = useState<Sign | null>(null);
  const [tried, setTried] = useState<Sign[]>([]);

  const choose = (s: Sign) => {
    if (placed) return;
    playSound('tap');
    if (s === answer) {
      setPlaced(s);
      onAttempt(true);
      onRoundComplete();
      return;
    }
    setTried((t) => (t.includes(s) ? t : [...t, s]));
    onAttempt(false, {
      hint: {
        say:
          answer === '='
            ? 'Both sides are the same. Use the equals sign.'
            : `The crocodile is hungry. Its mouth opens to the bigger number, ${numberWord(Math.max(round.left, round.right))}.`,
        icons: ['crocodile', 'eyes'],
      },
    });
  };

  const bigger = answer === '>' ? 'left' : answer === '<' ? 'right' : null;

  return (
    <View style={styles.col}>
      <View style={styles.row}>
        <Panel highlight={hintActive && bigger === 'left'}>
          <Group count={round.left} item={round.item} />
        </Panel>
        <View style={[styles.slot, placed && styles.slotFilled]}>
          {placed ? (
            <Animated.View entering={ZoomIn.springify()}>
              <Croc sign={placed} size={64} />
            </Animated.View>
          ) : (
            <Glyph id="question" size={40} />
          )}
        </View>
        <Panel highlight={hintActive && bigger === 'right'}>
          <Group count={round.right} item={round.item} />
        </Panel>
      </View>
      <View style={styles.signs}>
        {(['<', '=', '>'] as Sign[]).map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={s === '<' ? 'less than' : s === '>' ? 'greater than' : 'equals'}
            onPress={() => choose(s)}
            style={({ pressed }) => [styles.signButton, tried.includes(s) && styles.tried, pressed && styles.pressed]}>
            <Croc sign={s} size={64} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  middle: { width: 84, alignItems: 'center', justifyContent: 'center', minHeight: 84 },
  panel: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 4,
    borderColor: colors.line,
    padding: spacing.sm,
    minHeight: 150,
    justifyContent: 'center',
  },
  panelOn: { borderColor: colors.sunshine, backgroundColor: '#FFF9DB' },
  tappable: { minHeight: 170 },
  tried: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.96 }], borderColor: colors.grape },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderWidth: 4,
    borderColor: colors.grape,
  },
  askText: { fontSize: 40 },
  slot: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.grape,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  slotFilled: { borderStyle: 'solid', borderColor: colors.success },
  signs: { flexDirection: 'row', gap: spacing.md },
  signButton: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 4,
    borderColor: colors.line,
    padding: spacing.xs,
  },
});
