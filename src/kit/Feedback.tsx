import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, motion, radii, spacing } from '../theme';

/** Soft side-to-side wiggle used for "let's try again". Call `wiggle()` to play. */
export function useWiggle() {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const wiggle = () => {
    if (reduced) return;
    x.value = withSequence(
      withTiming(-10, { duration: 70 }),
      withTiming(10, { duration: 90 }),
      withTiming(-6, { duration: 80 }),
      withTiming(0, { duration: 70 }),
    );
  };
  return { style, wiggle };
}

export type FeedbackKind = 'retry' | 'success' | null;

/** A friendly face that pops up over the game: 🤗 for "try again", 🌟 for success. */
export function FeedbackBadge({ kind, nonce }: { kind: FeedbackKind; nonce: number }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!kind) return;
    opacity.value = withSequence(
      withTiming(1, { duration: motion.quick }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: motion.normal }),
    );
    scale.value = reduced ? 1 : withSequence(withTiming(0.4, { duration: 0 }), withSpring(1, motion.spring));
  }, [kind, nonce, reduced, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!kind) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.badge, { backgroundColor: kind === 'success' ? colors.success : colors.gentle }, style]}>
      <Text style={styles.emoji}>{kind === 'success' ? '🌟' : '🤗'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    padding: spacing.lg,
    borderRadius: radii.round,
    zIndex: 200,
  },
  emoji: { fontSize: 64 },
});
