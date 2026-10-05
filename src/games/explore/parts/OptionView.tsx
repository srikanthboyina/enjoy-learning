import { StyleSheet, View } from 'react-native';

import { Glyph } from '../../../kit/Glyph';
import { Text } from '../../../kit/Text';
import { colors } from '../../../theme';
import type { Option } from '../schema';
import { Clock } from './Clock';
import { ShapeView } from './ShapeView';

/** The picture/words on an answer card. */
export function OptionView({ option, small = false }: { option: Option; small?: boolean }) {
  const label = option.label;
  const numeric = !!label && /^[\d+\-=<>½¼¾/ :.]+$/.test(label);
  return (
    <View style={styles.col}>
      {option.clock && <Clock hour={option.clock.hour} minute={option.clock.minute} size={small ? 80 : 104} />}
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

export function optionName(o: Option): string {
  return o.label ?? o.shape ?? o.emoji ?? (o.clock ? `${o.clock.hour}:${String(o.clock.minute).padStart(2, '0')}` : '');
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  number: { fontSize: 38, fontWeight: '700', color: colors.ink },
  label: { fontSize: 18, fontWeight: '600', color: colors.ink, textAlign: 'center' },
});
