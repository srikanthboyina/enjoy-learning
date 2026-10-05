import { StyleSheet, Text, View } from 'react-native';

import type { Stars } from '../engine/types';
import { colors } from '../theme';

export function StarRow({ stars, size = 22 }: { stars: Stars; size?: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${stars} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, lineHeight: size * 1.2, color: i <= stars ? colors.star : colors.starEmpty },
          ]}>
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  star: { textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
});
