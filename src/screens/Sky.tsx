// Decorative animated sky for the home screen: drifting clouds and a slowly turning sun.
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '../kit/Text';

function Cloud({ top, size, duration, offset }: { top: number; size: number; duration: number; offset: number }) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const x = useSharedValue(offset);
  useEffect(() => {
    if (reduced) return;
    x.value = offset;
    x.value = withSequence(
      withTiming(1, { duration: duration * (1 - offset), easing: Easing.linear }),
      withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration, easing: Easing.linear })), -1),
    );
  }, [reduced, x, duration, offset]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -size * 1.6 + (width + size * 3.2) * x.value }],
  }));
  return (
    <Animated.View style={[styles.cloud, { top }, style]}>
      <Text style={{ fontSize: size, opacity: 0.9 }}>☁️</Text>
    </Animated.View>
  );
}

export function Sky() {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    spin.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1, false);
  }, [reduced, spin]);
  const sun = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Animated.View style={[styles.sun, sun]}>
        <Text style={styles.sunText}>☀️</Text>
      </Animated.View>
      <Cloud top={70} size={54} duration={38000} offset={0.15} />
      <Cloud top={150} size={38} duration={52000} offset={0.6} />
      <Cloud top={10} size={30} duration={60000} offset={0.85} />
    </View>
  );
}

const styles = StyleSheet.create({
  sun: { position: 'absolute', top: -18, right: -18 },
  sunText: { fontSize: 110, opacity: 0.85 },
  cloud: { position: 'absolute', left: 0 },
});
