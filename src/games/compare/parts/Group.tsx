import { StyleSheet, View } from 'react-native';

import type { GlyphId } from '../../../assets-map';
import { Glyph } from '../../../kit/Glyph';
import { colors, fonts } from '../../../theme';
import { Text } from '../../../kit/Text';

interface Props {
  count: number;
  item?: GlyphId;
  showNumber?: boolean;
}

/** One side of a comparison: a pile of pictures and/or its number. */
export function Group({ count, item, showNumber = true }: Props) {
  return (
    <View style={styles.wrap}>
      {item ? (
        <View style={styles.items}>
          {Array.from({ length: count }, (_, i) => (
            <Glyph key={i} id={item} size={30} accessible={false} />
          ))}
          {count === 0 && <Text style={styles.empty}>∅</Text>}
        </View>
      ) : null}
      {(showNumber || !item) && <Text style={[styles.number, !item && styles.bigNumber]}>{count}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, flex: 1 },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    minHeight: 110,
    maxWidth: 140,
  },
  empty: { fontSize: 30, color: colors.inkSoft },
  number: { fontSize: 36, fontWeight: '900', color: colors.ink },
  bigNumber: { ...fonts.numeral },
});
