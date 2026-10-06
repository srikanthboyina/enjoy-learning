// Ellie with personality: bobs while talking, and on every right answer she jumps,
// lifts her trunk and sets off a little surprise (a water spray, stars, hearts, balloons…).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useProgress } from '../services/progressStore';
import { Elephant, elephantColor } from './Elephant';
import { Text } from './Text';

const EVENTS = [
  { kind: 'spray', items: ['💧', '💦', '💧', '💦', '💧', '💧'] },
  { kind: 'stars', items: ['⭐', '✨', '🌟', '⭐', '✨', '🌟'] },
  { kind: 'hearts', items: ['💖', '💗', '💕', '💖', '💗', '💕'] },
  { kind: 'balloons', items: ['🎈', '🎈', '🎈', '🎈', '🎈'] },
  { kind: 'flowers', items: ['🌸', '🌼', '🌷', '🌸', '🌼', '🌷'] },
  { kind: 'party', items: ['🎉', '🎊', '🥳', '🎉', '🎊'] },
] as const;

interface Props {
  size?: number;
  /** change this number to celebrate */
  celebrate?: number;
  /** keep dancing (level complete) */
  dance?: boolean;
}

export function ElephantBuddy({ size = 56, celebrate = 0, dance = false }: Props) {
  const colorId = useProgress((s) => s.settings.elephantColor);
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const tilt = useSharedValue(0);
  const squash = useSharedValue(1);
  const [party, setParty] = useState<{ n: number; items: readonly string[]; kind: string } | null>(null);
  const [trunkUp, setTrunkUp] = useState(false);

  useEffect(() => {
    if (!celebrate) return;
    const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    setParty({ n: celebrate, items: ev.items, kind: ev.kind });
    setTrunkUp(true);
    const t = setTimeout(() => setTrunkUp(false), 1400);
    if (!reduced) {
      squash.value = withSequence(withTiming(0.85, { duration: 110 }), withSpring(1, { damping: 6 }));
      y.value = withSequence(
        withDelay(100, withTiming(-size * 0.55, { duration: 230, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }),
        withTiming(-size * 0.2, { duration: 150 }),
        withTiming(0, { duration: 150 }),
      );
      tilt.value = withSequence(withTiming(-12, { duration: 150 }), withTiming(12, { duration: 200 }), withSpring(0));
    }
    return () => clearTimeout(t);
  }, [celebrate, reduced, size, squash, tilt, y]);

  useEffect(() => {
    if (!dance || reduced) return;
    setTrunkUp(true);
    y.value = withRepeat(
      withSequence(withTiming(-size * 0.3, { duration: 260 }), withTiming(0, { duration: 260 })),
      -1,
    );
    tilt.value = withRepeat(withSequence(withTiming(-10, { duration: 260 }), withTiming(10, { duration: 260 })), -1, true);
  }, [dance, reduced, size, tilt, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${tilt.value}deg` }, { scaleY: squash.value }],
  }));

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel="Ellie the elephant">
      <Animated.View style={style}>
        <Elephant color={elephantColor(colorId)} size={size} trunkUp={trunkUp || dance} joy={trunkUp || dance} />
      </Animated.View>
      {party &&
        party.items.map((e, i) => (
          <Particle key={`${party.n}-${i}`} emoji={e} index={i} total={party.items.length} kind={party.kind} size={size} />
        ))}
    </View>
  );
}

function Particle({ emoji, index, total, kind, size }: { emoji: string; index: number; total: number; kind: string; size: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(index * 60, withTiming(1, { duration: kind === 'balloons' ? 1800 : 1200, easing: Easing.out(Easing.cubic) }));
  }, [index, kind, p]);
  // fan out from the trunk tip (upper left of the face)
  const spread = (index / Math.max(total - 1, 1) - 0.5) * 2; // -1..1
  const dx = kind === 'balloons' ? spread * size * 0.9 : spread * size * 1.6 + size * 0.2;
  const rise = kind === 'balloons' ? size * 3.2 : size * (1.2 + Math.abs(spread) * 0.3);
  const style = useAnimatedStyle(() => {
    const t = p.value;
    const arc = kind === 'spray' ? 4 * t * (1 - t) : t; // water falls back down
    return {
      opacity: t < 0.75 ? 1 : (1 - t) * 4,
      transform: [
        { translateX: dx * t },
        { translateY: -rise * arc },
        { scale: 0.6 + t * 0.6 },
        { rotate: `${spread * 40 * t}deg` },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.particle, { left: size * 0.22, top: size * 0.2 }, style]}>
      <Text style={{ fontSize: size * 0.38 }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute', zIndex: 50 },
});
