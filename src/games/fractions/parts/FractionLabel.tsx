import { StyleSheet, View } from 'react-native';

import { colors } from '../../../theme';
import type { Fraction } from '../schema';
import { fractionWords } from '../words';
import { Text } from '../../../kit/Text';

/** A written fraction, numerator over denominator. */
export function FractionLabel({ fraction, size = 48 }: { fraction: Fraction; size?: number }) {
  return (
    <View style={styles.wrap} accessible accessibilityLabel={fractionWords(fraction)}>
      <Text style={[styles.num, { fontSize: size, lineHeight: size * 1.1 }]}>{fraction.num}</Text>
      <View style={[styles.bar, { width: size * 0.9, height: Math.max(3, size / 12) }]} />
      <Text style={[styles.num, { fontSize: size, lineHeight: size * 1.1 }]}>{fraction.den}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  num: { fontWeight: '900', color: colors.ink },
  bar: { backgroundColor: colors.ink, borderRadius: 2, marginVertical: 2 },
});
