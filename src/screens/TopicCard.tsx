import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Topic } from '../engine/types';
import { Bob } from '../kit/Bob';
import { Glyph } from '../kit/Glyph';
import { Gradient } from '../kit/Gradient';
import { Text } from '../kit/Text';
import { colors, radii, spacing } from '../theme';
import { shade } from '../theme/color';

interface Props {
  topic: Topic;
  index: number;
  width: number;
  stars: { earned: number; max: number; done: number; total: number };
  playable: boolean;
  onPress: () => void;
}

export function TopicCard({ topic, index, width, stars, playable, onPress }: Props) {
  const [c1, c2] = topic.colors;
  return (
    <Animated.View entering={FadeInDown.delay(60 * index).springify()} style={{ width }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={topic.title}
        onPress={onPress}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <Gradient
          colors={playable ? [c1, c2] : ['#DEE2E6', '#ADB5BD']}
          direction="diagonal"
          style={[styles.card, { borderBottomColor: shade(playable ? c2 : '#ADB5BD', 0.22) }]}>
          <View style={styles.bubbleA} />
          <View style={styles.bubbleB} />
          <Bob distance={5} period={2600} delay={(index % 5) * 300} wobble>
            <Glyph id={topic.emoji} size={52} accessible={false} />
          </Bob>
          <Text style={styles.title} numberOfLines={2}>
            {topic.title}
          </Text>
          {playable ? (
            <View style={styles.footer}>
              <View style={styles.starPill}>
                <Text style={styles.starText}>
                  ⭐ {stars.earned}/{stars.max}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${stars.total ? (stars.done / stars.total) * 100 : 0}%` }]} />
              </View>
            </View>
          ) : (
            <Text style={styles.soon}>🔒 Soon</Text>
          )}
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
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 170,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 7,
  },
  bubbleA: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: -30,
    right: -20,
  },
  bubbleB: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
    bottom: 10,
    left: -14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: { alignSelf: 'stretch', alignItems: 'center', gap: 6, marginTop: 'auto' },
  starPill: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 2 },
  starText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  track: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  fill: { height: 6, backgroundColor: '#FFFFFF' },
  soon: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 'auto' },
});
