import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Group, Topic } from '../engine/types';
import { Bob } from '../kit/Bob';
import { Glyph } from '../kit/Glyph';
import { Gradient } from '../kit/Gradient';
import { Text } from '../kit/Text';
import { colors, radii, spacing } from '../theme';
import { shade } from '../theme/color';
import { tr } from '../i18n';

interface Props {
  group: Group;
  topics: Topic[];
  index: number;
  width: number;
  stars: { earned: number; max: number };
  onPress: () => void;
}

/** A shelf of topics on the home screen: big emoji, title, and a peek at what's inside. */
export function GroupCard({ group, topics, index, width, stars, onPress }: Props) {
  const [c1, c2] = group.colors;
  return (
    <Animated.View entering={FadeInDown.delay(50 * index).springify()} style={{ width }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr(group.title)}
        onPress={onPress}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <Gradient colors={[c1, c2]} direction="diagonal" style={[styles.card, { borderBottomColor: shade(c2, 0.25) }]}>
          <View style={styles.bubbleA} />
          <View style={styles.bubbleB} />
          <View style={styles.top}>
            <Bob distance={5} period={2800} delay={(index % 4) * 350} wobble>
              <Glyph id={group.emoji} size={50} accessible={false} />
            </Bob>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{tr(`${topics.length} topics`)}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {tr(group.title)}
          </Text>
          <View style={styles.peek}>
            {topics.slice(0, 5).map((t) => (
              <View key={t.id} style={styles.peekDot}>
                <Glyph id={t.emoji} size={18} accessible={false} />
              </View>
            ))}
          </View>
          <View style={styles.starPill}>
            <Text style={styles.starText}>
              ⭐ {stars.earned}/{stars.max}
            </Text>
          </View>
        </Gradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: radii.lg },
  pressed: { transform: [{ scale: 0.96 }] },
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 190,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 7,
  },
  bubbleA: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: -40,
    right: -30,
  },
  bubbleB: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.14)',
    bottom: -12,
    left: -16,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  countPill: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: radii.round, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  peek: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  peekDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starPill: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.round,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  starText: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
