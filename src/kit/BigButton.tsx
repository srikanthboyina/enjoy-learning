import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { playSound, type SoundName } from '../services/sound';
import { colors, motion, radii, sizes } from '../theme';

interface Props {
  onPress: () => void;
  /** spoken by screen readers; kids see the icon */
  label: string;
  children: ReactNode;
  color?: string;
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
  size = sizes.touch,
  round = false,
  disabled = false,
  sound = 'tap',
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
            backgroundColor: color,
            minWidth: size,
            minHeight: size,
            borderRadius: round ? radii.round : radii.md,
            opacity: disabled ? 0.5 : 1,
          },
        ]}>
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
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
});
