import { StyleSheet, View } from 'react-native';

import { colors } from '../../../theme';

interface Props {
  /** how many cells the frame represents (1–10) */
  target: number;
  /** how many cells are currently filled */
  filled: number;
  color: string;
  cell?: number;
}

/** A ten-frame: 2 rows of 5. Helps kids "see" numbers without counting one by one. */
export function TenFrame({ target, filled, color, cell = 22 }: Props) {
  const rows = target > 5 ? 2 : 1;
  return (
    <View style={styles.frame} accessibilityLabel={`${filled} of ${target}`}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: 5 }, (_, c) => {
            const i = r * 5 + c;
            const exists = i < target;
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  { width: cell, height: cell, borderRadius: cell / 2 },
                  !exists && styles.hidden,
                  exists && i < filled && { backgroundColor: color, borderColor: color },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  cell: { borderWidth: 3, borderColor: colors.inkSoft, backgroundColor: colors.card },
  hidden: { opacity: 0 },
});
