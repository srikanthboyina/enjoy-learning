import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { playSound, type SoundName } from '../services/sound';
import { colors, motion, radii, sizes, type GradientPair } from '../theme';
import { shade } from '../theme/color';
import { Gradient } from './Gradient';

interface Props {
  onPress: () => void;
  /** spoken by screen readers; kids see the icon */
  label: string;
  children: ReactNode;
  color?: string;
  /** a two-stop gradient instead of a flat colour */
  gradient?: GradientPair;
  size?: number;
  round?: boolean;
  disabled?: boolean;
  sound?: SoundName | null;
  style?: StyleProp<ViewStyle>;
}

/** The only tappable control kids use: big, bouncy, with a soft tap sound. */
export function BigButton({
  onPress,
  label,
  children,
  color = colors.card,
  gradient,
  size = sizes.touch,
  round = false,
  disabled = false,
  sound = 'tap',
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const radius = round ? radii.round : radii.md;
  const edge = shade(gradient ? gradient[1] : color === colors.card ? '#D9D4C7' : color, 0.18);

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={8}
        onPressIn={() => (scale.value = withSpring(0.9, motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, motion.spring))}
        onPress={() => {
          if (sound) playSound(sound);
          onPress();
        }}
        style={[
          styles.base,
          {
            backgroundColor: gradient ? gradient[1] : color,
            minWidth: size,
            minHeight: size,
            borderRadius: radius,
            borderBottomColor: edge,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
        {gradient && <Gradient colors={gradient} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />}
        <View style={styles.shine} pointerEvents="none" />
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 5,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: '18%',
    right: '18%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
