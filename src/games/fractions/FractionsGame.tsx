import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import type { GameProps } from '../../engine/types';
import { Glyph } from '../../kit/Glyph';
import { playSound } from '../../services/sound';
import { colors, radii, spacing } from '../../theme';
import { FractionLabel } from './parts/FractionLabel';
import { CutBoard, Pie } from './parts/Pie';
import type { FractionsRound } from './schema';
import { fractionWords } from './words';
import { Text } from '../../kit/Text';

type SplitRound = Extract<FractionsRound, { mode: 'split' }>;
type PickRound = Extract<FractionsRound, { mode: 'pick' }>;

const FRIENDS = ['👧', '👦', '🧒', '👩', '🧑', '👨'];
const BOARD = 260;

export function FractionsGame(props: GameProps<FractionsRound>) {
  return props.round.mode === 'split' ? (
    <Split {...props} round={props.round} />
  ) : (
    <Pick {...props} round={props.round} />
  );
}

/* ---------- split: tap dotted lines so every friend gets the same size ---------- */

function Split({ round, onAttempt, onRoundComplete, hintActive }: GameProps<SplitRound>) {
  // Spokes every 360/(2·parts)°. Equal pieces ⇔ every cut on the same parity.
  const spokes = round.parts * 2;
  const [cuts, setCuts] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const toggle = (spoke: number) => {
    if (solved || busy.current) return;
    if (cuts.includes(spoke)) {
      setCuts(cuts.filter((c) => c !== spoke));
      playSound('tap');
      return;
    }
    const next = [...cuts, spoke];
    setCuts(next);
    playSound('tap');
    if (next.length < round.parts) return;

    const equal = next.every((c) => c % 2 === next[0] % 2);
    if (equal) {
      setSolved(true);
      onAttempt(true);
      onRoundComplete();
    } else {
      busy.current = true;
      onAttempt(false, {
        hint: { say: 'Some pieces are bigger. Every friend needs the same size.', icons: ['friends', round.shape] },
      });
      timer.current = setTimeout(() => {
        setCuts([]);
        busy.current = false;
      }, 1100);
    }
  };

  const highlight = hintActive ? Array.from({ length: round.parts }, (_, i) => i * 2) : [];

  return (
    <View style={styles.center}>
      <View style={styles.friends} accessibilityLabel={`${round.parts} friends`}>
        {Array.from({ length: round.parts }, (_, i) => (
          <View key={i} style={styles.friend}>
            <Text style={styles.friendFace}>{FRIENDS[i % FRIENDS.length]}</Text>
            {solved ? (
              <Animated.View entering={ZoomIn.delay(i * 120).springify()}>
                <Glyph id={round.shape} size={28} accessible={false} />
              </Animated.View>
            ) : (
              <Glyph id="plate" size={28} accessible={false} />
            )}
          </View>
        ))}
      </View>

      {solved ? (
        <Animated.View entering={FadeIn}>
          <Pie shape={round.shape} size={BOARD} parts={round.parts} separated />
        </Animated.View>
      ) : (
        <View accessibilityLabel={`Tap the dotted lines to cut the ${round.shape}`}>
          <CutBoard
            shape={round.shape}
            size={BOARD}
            spokes={spokes}
            cuts={cuts}
            highlight={highlight}
            onToggle={toggle}
          />
        </View>
      )}

      <View style={styles.scissors} accessibilityLabel={`${round.parts - cuts.length} cuts left`}>
        {Array.from({ length: round.parts }, (_, i) => (
          <Glyph key={i} id="cut" size={30} accessible={false} style={i < cuts.length && styles.used} />
        ))}
      </View>
    </View>
  );
}

/* ---------- pick: tap the picture that shows the fraction ---------- */

function Pick({ round, onAttempt, onRoundComplete, hintActive }: GameProps<PickRound>) {
  const [tried, setTried] = useState<number[]>([]);

  const choose = (i: number) => {
    const c = round.choices[i];
    playSound('tap');
    if (c.num === round.target.num && c.den === round.target.den) {
      onAttempt(true);
      onRoundComplete();
      return;
    }
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    onAttempt(false, {
      hint: {
        say: `That one shows ${fractionWords(c)}.`,
        icons: ['eyes', round.shape],
      },
    });
  };

  return (
    <View style={styles.pick}>
      <View style={styles.targetCard}>
        <FractionLabel fraction={round.target} size={52} />
        {hintActive && (
          <View style={styles.legend}>
            <Text style={styles.legendText}>
              {round.target.num} <Glyph id={round.shape} size={22} accessible={false} />
            </Text>
            <Text style={styles.legendText}>
              {round.target.den} <Glyph id="cut" size={22} accessible={false} />
            </Text>
          </View>
        )}
      </View>
      <View style={styles.choices}>
        {round.choices.map((c, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Picture ${i + 1}`}
            onPress={() => choose(i)}
            style={({ pressed }) => [styles.choice, tried.includes(i) && styles.tried, pressed && styles.pressed]}>
            <Pie shape={round.shape} size={120} parts={c.den} filled={c.num} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly' },
  friends: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  friend: { alignItems: 'center', minWidth: 52 },
  friendFace: { fontSize: 40 },
  scissors: { flexDirection: 'row', gap: spacing.sm },
  used: { opacity: 0.2 },
  pick: { flex: 1, gap: spacing.lg, alignItems: 'center' },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 4,
    borderColor: colors.tomato,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  legend: { gap: spacing.md },
  legendText: { fontSize: 22, fontWeight: '800', color: colors.inkSoft },
  choices: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: spacing.md,
  },
  choice: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 4,
    borderColor: colors.line,
  },
  tried: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.95 }], borderColor: colors.tomato },
});
