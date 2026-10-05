// A burst of falling confetti. Re-fires whenever `burst` changes.
import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { confettiColors } from '../theme';

interface Piece {
  x: number;
  drift: number;
  size: number;
  color: string;
  spin: number;
  delay: number;
  round: boolean;
}

function makePieces(n: number, width: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 120,
    size: 8 + Math.random() * 8,
    color: confettiColors[i % confettiColors.length],
    spin: (Math.random() - 0.5) * 720,
    delay: Math.random() * 250,
    round: Math.random() > 0.6,
  }));
}

function PieceView({ p, t, height }: { p: Piece; t: SharedValue<number>; height: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - Math.max(0, t.value - 0.8) * 5,
    transform: [
      { translateX: p.x + p.drift * t.value },
      { translateY: -40 + (height + 60) * t.value },
      { rotate: `${p.spin * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: p.size, height: p.round ? p.size : p.size * 0.5, backgroundColor: p.color, borderRadius: p.round ? p.size : 2 },
        style,
      ]}
    />
  );
}

export function Confetti({ burst, count = 36 }: { burst: number; count?: number }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(count, width), [count, width, burst]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = useSharedValue(0);

  useEffect(() => {
    if (!burst || reduced) return;
    t.value = 0;
    t.value = withDelay(30, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }));
  }, [burst, reduced, t]);

  if (!burst || reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <PieceView key={`${burst}-${i}`} p={p} t={t} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0 },
});
