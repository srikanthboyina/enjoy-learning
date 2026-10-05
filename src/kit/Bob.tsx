// Gentle idle motion that makes pictures feel alive. Turns off with reduced motion.
import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  children: ReactNode;
  /** pixels to float up and down */
  distance?: number;
  /** ms for one up-down cycle */
  period?: number;
  delay?: number;
  /** add a little rotation wobble */
  wobble?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Bob({ children, distance = 6, period = 2400, delay = 0, wobble = false, style }: Props) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: period / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [reduced, t, period, delay]);
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: -distance * t.value },
      { rotate: wobble ? `${(t.value - 0.5) * 6}deg` : '0deg' },
    ],
  }));
  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}
