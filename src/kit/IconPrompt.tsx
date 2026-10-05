import { StyleSheet, Text, View } from 'react-native';

import type { Prompt } from '../engine/types';
import { colors, radii, sizes, spacing } from '../theme';
import { BigButton } from './BigButton';
import { Glyph } from './Glyph';

interface Props {
  prompt: Prompt;
  onSpeak: () => void;
}

/** A "picture sentence" plus a speaker button that reads the instruction aloud. */
export function IconPrompt({ prompt, onSpeak }: Props) {
  return (
    <View style={styles.bubble} accessibilityRole="header" accessibilityLabel={prompt.say}>
      <BigButton label="Say it again" onPress={onSpeak} color={colors.sky} round sound={null}>
        <Text style={styles.speaker}>🔊</Text>
      </BigButton>
      <View style={styles.icons}>
        {prompt.icons.map((icon, i) => (
          <Glyph key={`${icon}-${i}`} id={icon} size={sizes.glyph * 0.8} accessible={false} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.sm,
    paddingRight: spacing.lg,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.line,
  },
  icons: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  speaker: { fontSize: 30 },
});
