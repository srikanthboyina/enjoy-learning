import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, motion } from '../../../theme';
import type { MatterState } from '../schema';

const LEVEL: Record<MatterState, number> = { ice: 0.15, water: 0.5, steam: 0.92 };
const HEIGHT = 200;
const STOPS = [0.15, 0.5, 0.92];
const HUES = ['#4DABF7', '#FAB005', '#F03E3E'];

/** Rises and falls with the substance so kids connect temperature with the change. */
export function Thermometer({ state }: { state: MatterState }) {
  const level = useSharedValue(LEVEL[state]);
  useEffect(() => {
    level.value = withTiming(LEVEL[state], { duration: motion.slow });
  }, [state, level]);

  const fill = useAnimatedStyle(() => ({
    height: level.value * HEIGHT,
    backgroundColor: interpolateColor(level.value, STOPS, HUES),
  }));
  const bulb = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(level.value, STOPS, HUES),
  }));

  return (
    <View style={styles.wrap} accessibilityLabel={`Temperature: ${state}`}>
      <View style={styles.tube}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Animated.View style={[styles.bulb, bulb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tube: {
    width: 22,
    height: HEIGHT,
    borderRadius: 11,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.inkSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%' },
  bulb: { width: 40, height: 40, borderRadius: 20, marginTop: -8, borderWidth: 3, borderColor: colors.inkSoft },
});
