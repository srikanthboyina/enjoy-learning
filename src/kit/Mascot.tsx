// Ollie the Owl: the friendly guide who explains every step out loud.
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { Prompt } from '../engine/types';
import { colors, radii, spacing } from '../theme';
import { BigButton } from './BigButton';
import { Bob } from './Bob';
import { Glyph } from './Glyph';
import { Text } from './Text';

interface Props {
  prompt: Prompt;
  onSpeak: () => void;
  mood?: 'talk' | 'happy';
  accent?: string;
}

export function Mascot({ prompt, onSpeak, mood = 'talk', accent = colors.sky }: Props) {
  return (
    <View style={styles.row}>
      <Bob distance={4} period={2200} wobble>
        <Glyph id={mood === 'happy' ? '🥳' : '🦉'} size={52} label="Ollie the owl" />
      </Bob>
      <Animated.View key={prompt.say} entering={FadeIn.duration(250)} style={[styles.bubble, { borderColor: accent }]}>
        <View style={[styles.tail, { borderRightColor: accent }]} />
        <View style={styles.content}>
          <View style={styles.icons}>
            {prompt.icons.map((icon, i) => (
              <Glyph key={`${icon}-${i}`} id={icon} size={26} accessible={false} />
            ))}
          </View>
          <Text style={styles.say} numberOfLines={4}>
            {prompt.say}
          </Text>
        </View>
        <BigButton label="Say it again" onPress={onSpeak} round size={48} gradient={['#60A5FA', '#3B82F6']} sound={null}>
          <Glyph id="🔊" size={22} accessible={false} />
        </BigButton>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  bubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 3,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 64,
  },
  tail: {
    position: 'absolute',
    left: -12,
    top: 22,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  content: { flex: 1, gap: 2 },
  icons: { flexDirection: 'row', gap: 4 },
  say: { fontSize: 16, fontWeight: '500', color: colors.ink, lineHeight: 20 },
});
