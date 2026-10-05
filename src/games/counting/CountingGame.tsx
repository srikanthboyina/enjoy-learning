import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { glyphName, type GlyphId } from '../../assets-map';
import { numberWord } from '../../engine/phrases';
import type { GameProps } from '../../engine/types';
import { BigButton } from '../../kit/BigButton';
import { DragDropProvider, Draggable, DropZone } from '../../kit/DragDrop';
import { Glyph } from '../../kit/Glyph';
import { playSound } from '../../services/sound';
import { colors, fonts, radii, sizes, spacing } from '../../theme';
import { TenFrame } from './parts/TenFrame';
import type { CountingRound } from './schema';
import { Text } from '../../kit/Text';

type Props = GameProps<CountingRound>;
type CollectRound = Extract<CountingRound, { mode: 'collect' }>;
type MatchRound = Extract<CountingRound, { mode: 'match' }>;

const ACCENT = colors.sunshine;

export function CountingGame(props: Props) {
  return props.round.mode === 'collect' ? (
    <Collect {...props} round={props.round} />
  ) : (
    <Match {...props} round={props.round} />
  );
}

/* ---------- collect: drag N items into the basket, then tap ✅ ---------- */

function Collect({ round, onAttempt, onRoundComplete, speak, hintActive }: GameProps<CollectRound>) {
  // item indices currently in the basket, in the order they were added
  const [inBasket, setInBasket] = useState<number[]>([]);
  const count = inBasket.length;
  const showFrame = !round.hideDots || hintActive;

  const add = (i: number) => {
    if (inBasket.includes(i)) return;
    const next = [...inBasket, i];
    setInBasket(next);
    playSound('pop');
    speak(numberWord(next.length)); // counting aloud is the lesson
  };

  const remove = (i: number) => {
    const next = inBasket.filter((x) => x !== i);
    setInBasket(next);
    playSound('tap');
    speak(next.length === 0 ? 'Empty!' : numberWord(next.length));
  };

  const check = () => {
    if (count === round.target) {
      onAttempt(true);
      onRoundComplete();
    } else if (count > round.target) {
      onAttempt(false, { hint: { say: 'Too many! Tap one in the basket to take it out.', icons: ['tap', 'basket'] } });
    } else {
      onAttempt(false, {
        hint: { say: `We have ${numberWord(count)}. We need ${numberWord(round.target)}.`, icons: ['drag', 'basket'] },
      });
    }
  };

  const pile = Array.from({ length: round.available }, (_, i) => i).filter((i) => !inBasket.includes(i));

  return (
    <DragDropProvider>
      <View style={styles.collect}>
        <View style={styles.targetCard} accessibilityLabel={`Target ${round.target}`}>
          <Text style={styles.numeral}>{round.target}</Text>
          {showFrame && <TenFrame target={round.target} filled={Math.min(count, round.target)} color={ACCENT} />}
        </View>

        <View style={styles.pile}>
          {pile.map((i) => (
            <Draggable
              key={i}
              accessibilityLabel={`${glyphName(round.item)}, drag to basket`}
              onTap={() => add(i)}
              onDrop={(zone) => {
                if (zone !== 'basket') return false;
                add(i);
                return true;
              }}
              style={styles.item}>
              <Glyph id={round.item} size={sizes.glyph} accessible={false} />
            </Draggable>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <DropZone id="basket" style={styles.basket} accessibilityLabel={`Basket with ${count}`}>
            <View style={styles.basketItems}>
              {inBasket.map((i) => (
                <Animated.View key={i} entering={ZoomIn.springify()}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Take out ${glyphName(round.item)}`}
                    onPress={() => remove(i)}
                    style={styles.basketItem}>
                    <Glyph id={round.item} size={sizes.glyph * 0.75} accessible={false} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            <Glyph id="basket" size={sizes.bigGlyph} accessible={false} style={styles.basketIcon} />
            {hintActive && <Text style={styles.basketCount}>{count}</Text>}
          </DropZone>

          <BigButton label="Check" onPress={check} color={colors.leaf} round size={sizes.bigTouch} sound={null}>
            <Glyph id="check" size={44} accessible={false} />
          </BigButton>
        </View>
      </View>
    </DragDropProvider>
  );
}

/* ---------- match: tap the group that has the number shown ---------- */

function Match({ round, onAttempt, onRoundComplete, speak, hintActive }: GameProps<MatchRound>) {
  const [tried, setTried] = useState<number[]>([]);

  const choose = (groupIndex: number) => {
    const n = round.groups[groupIndex];
    if (n === round.showNumeral) {
      onAttempt(true);
      onRoundComplete();
      return;
    }
    setTried((t) => (t.includes(groupIndex) ? t : [...t, groupIndex]));
    onAttempt(false, {
      hint: { say: `That group has ${numberWord(n)}.`, icons: ['eyes', 'numbers'] },
    });
  };

  return (
    <View style={styles.match}>
      <View style={styles.targetCard}>
        <Text style={styles.numeral} accessibilityLabel={`Find ${round.showNumeral}`}>
          {round.showNumeral}
        </Text>
      </View>
      <View style={styles.groups}>
        {round.groups.map((n, gi) => (
          <Pressable
            key={gi}
            accessibilityRole="button"
            accessibilityLabel={`Group ${gi + 1}`}
            onPress={() => {
              playSound('tap');
              choose(gi);
            }}
            style={({ pressed }) => [
              styles.group,
              tried.includes(gi) && styles.groupTried,
              pressed && styles.groupPressed,
            ]}>
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={styles.groupItem}>
                <GroupGlyph id={round.item} />
                {hintActive && <Text style={styles.itemNumber}>{i + 1}</Text>}
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function GroupGlyph({ id }: { id: GlyphId }) {
  return <Glyph id={id} size={34} accessible={false} />;
}

const styles = StyleSheet.create({
  collect: { flex: 1, justifyContent: 'space-between', gap: spacing.md },
  targetCard: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderWidth: 4,
    borderColor: ACCENT,
  },
  numeral: { ...fonts.numeral, color: colors.ink },
  pile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: spacing.sm,
    flex: 1,
    zIndex: 2,
  },
  item: {
    width: sizes.touch + 8,
    height: sizes.touch + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, zIndex: 1 },
  basket: {
    flex: 1,
    minHeight: 150,
    backgroundColor: '#F4E3C3',
    borderRadius: radii.lg,
    borderWidth: 4,
    borderColor: '#C9A46A',
    borderStyle: 'dashed',
    padding: spacing.sm,
    justifyContent: 'flex-end',
  },
  basketItems: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  basketItem: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  basketIcon: { alignSelf: 'center', opacity: 0.9 },
  basketCount: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.md,
    ...fonts.title,
    color: colors.inkSoft,
  },
  match: { flex: 1, gap: spacing.lg },
  groups: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: spacing.md,
  },
  group: {
    width: 150,
    minHeight: 130,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 4,
    borderColor: colors.line,
    padding: spacing.sm,
  },
  groupTried: { opacity: 0.55 },
  groupPressed: { transform: [{ scale: 0.95 }], borderColor: ACCENT },
  groupItem: { alignItems: 'center', margin: 2 },
  itemNumber: { fontSize: 12, fontWeight: '800', color: colors.inkSoft },
});
