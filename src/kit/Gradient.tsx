import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { GradientPair } from '../theme';

interface Props {
  colors: GradientPair | readonly string[];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** 'down' (top→bottom, default) or 'diagonal' */
  direction?: 'down' | 'diagonal';
}

export function Gradient({ colors, style, children, direction = 'down' }: Props) {
  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      start={direction === 'down' ? { x: 0.5, y: 0 } : { x: 0, y: 0 }}
      end={direction === 'down' ? { x: 0.5, y: 1 } : { x: 1, y: 1 }}
      style={style}>
      {children}
    </LinearGradient>
  );
}
