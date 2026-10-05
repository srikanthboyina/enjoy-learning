import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { GLYPHS, type GlyphId } from '../assets-map';
import { sizes } from '../theme';

interface Props {
  id: GlyphId;
  size?: number;
  style?: StyleProp<TextStyle>;
  /** set false for decorative glyphs inside a labelled button */
  accessible?: boolean;
}

/** A picture for an icon or sprite. Emoji in v1; swap for images via assets-map. */
export function Glyph({ id, size = sizes.glyph, style, accessible = true }: Props) {
  return (
    <Text
      style={[styles.glyph, { fontSize: size, lineHeight: size * 1.2 }, style]}
      accessible={accessible}
      accessibilityLabel={accessible ? GLYPHS[id].name : undefined}
      importantForAccessibility={accessible ? 'auto' : 'no'}
      selectable={false}>
      {GLYPHS[id].emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: { textAlign: 'center', userSelect: 'none' },
});
