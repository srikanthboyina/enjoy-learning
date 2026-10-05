import { StyleSheet, View } from 'react-native';

import { Glyph } from '../../../kit/Glyph';
import { Text } from '../../../kit/Text';
import { colors } from '../../../theme';
import type { Option } from '../schema';
import { Clock } from './Clock';
import { FractionShape } from './Fraction';
import { ShapeView } from './ShapeView';

/** The picture/words on an answer card. */
export function OptionView({ option, small = false }: { option: Option; small?: boolean }) {
  const label = option.label;
  const numeric = !!label && /^[\d+\-=<>½¼¾/ :.]+$/.test(label);
  return (
    <View style={styles.col}>
      {option.clock && <Clock hour={option.clock.hour} minute={option.clock.minute} size={small ? 80 : 104} />}
      {option.fraction && (
        <FractionShape parts={option.fraction.parts} shaded={option.fraction.shaded} shape={option.fraction.shape} size={small ? 56 : 72} />
      )}
      {option.shape && <ShapeView shape={option.shape} color={option.color} size={small ? 48 : 64} />}
      {option.emoji && <Glyph id={option.emoji} size={small ? 36 : label ? 44 : 56} accessible={false} />}
      {label && (
        <Text
          style={[numeric ? styles.number : styles.label, small && { fontSize: numeric ? 26 : 15 }]}
          numberOfLines={2}>
          {label}
        </Text>
      )}
    </View>
  );
}

/** Rough colour word for a hex colour, so "red square" and "blue square" sound different. */
function colorWord(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return max > 0.8 ? 'white' : max < 0.25 ? 'black' : 'grey';
  const d = max - min;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 15 || h >= 340) return 'red';
  if (h < 40) return 'orange';
  if (h < 65) return 'yellow';
  if (h < 170) return 'green';
  if (h < 255) return 'blue';
  if (h < 300) return 'purple';
  return 'pink';
}

export function optionName(o: Option): string {
  if (o.shape && o.color && !o.label) return `${colorWord(o.color)} ${o.shape}`;
  if (o.label ?? o.shape ?? o.emoji) return (o.label ?? o.shape ?? o.emoji) as string;
  if (o.clock) return `${o.clock.hour}:${String(o.clock.minute).padStart(2, '0')}`;
  if (o.fraction) return `${o.fraction.shaded} of ${o.fraction.parts}`;
  return '';
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  number: { fontSize: 38, fontWeight: '700', color: colors.ink },
  label: { fontSize: 18, fontWeight: '600', color: colors.ink, textAlign: 'center' },
});
