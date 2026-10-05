// Drop-in replacement for React Native's Text that uses the app's rounded font.
// fontWeight picks the matching Fredoka file (custom fonts ignore fontWeight on Android).
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { families } from '../theme';

function familyFor(weight: unknown): string {
  switch (String(weight ?? '400')) {
    case '100':
    case '200':
    case '300':
    case '400':
    case 'normal':
      return families.regular;
    case '500':
      return families.medium;
    case '600':
      return families.semibold;
    default:
      return families.bold;
  }
}

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...others } = flat;
  return <RNText {...rest} style={[{ fontFamily: familyFor(fontWeight) }, others]} />;
}
