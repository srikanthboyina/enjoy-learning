import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { GLYPHS } from '../assets-map';
import { sizes } from '../theme';

interface Props {
  /** a GlyphId from assets-map, or any emoji string */
  id: string;
  size?: number;
  style?: StyleProp<TextStyle>;
  /** set false for decorative glyphs inside a labelled button */
  accessible?: boolean;
  label?: string;
}

const known = GLYPHS as Record<string, { emoji: string; name: string }>;

/** A picture for an icon or sprite. Emoji in v1; swap for images via assets-map. */
export function Glyph({ id, size = sizes.glyph, style, accessible = true, label }: Props) {
  const g = known[id];
  return (
    <Text
      style={[styles.glyph, { fontSize: size, lineHeight: size * 1.25 }, style]}
      accessible={accessible}
      accessibilityLabel={accessible ? (label ?? g?.name ?? id) : undefined}
      importantForAccessibility={accessible ? 'auto' : 'no'}
      selectable={false}>
      {g?.emoji ?? id}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: { textAlign: 'center', userSelect: 'none' },
});
