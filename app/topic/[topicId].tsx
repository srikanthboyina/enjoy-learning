// Level picker for one topic: a path of numbered stops with stars.
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLevels, getTopic } from '../../src/engine/loadContent';
import { phrases } from '../../src/engine/phrases';
import { levelKey } from '../../src/engine/scoring';
import { isPlayable } from '../../src/engine/topics';
import { BigButton } from '../../src/kit/BigButton';
import { Glyph } from '../../src/kit/Glyph';
import { StarRow } from '../../src/kit/StarRow';
import { isLevelUnlocked, useProgress } from '../../src/services/progressStore';
import { speak } from '../../src/services/speech';
import { colors, sizes, spacing, topicColor } from '../../src/theme';

export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const progress = useProgress((s) => s.levels);
  const topic = getTopic(topicId);
  if (!topic || !isPlayable(topic)) return <Redirect href="/" />;

  const levels = getLevels(topic.gameId);
  const color = topicColor(topic.color);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BigButton label="Back to map" onPress={() => router.back()} round>
          <Text style={styles.headerIcon}>🗺️</Text>
        </BigButton>
        <Glyph id={topic.icon} size={48} />
        <Text style={styles.title}>{topic.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.path}>
        {levels.map((level, i) => {
          const unlocked = isLevelUnlocked(progress, topic.gameId, i);
          const stars = progress[levelKey(topic.gameId, level.id)]?.bestStars ?? 0;
          return (
            <View key={level.id} style={[styles.stop, { alignSelf: i % 2 ? 'flex-end' : 'flex-start' }]}>
              <BigButton
                label={unlocked ? `Level ${level.order}` : `Level ${level.order}, locked`}
                round
                size={sizes.bigTouch + 16}
                color={unlocked ? color : colors.locked}
                onPress={() => {
                  if (!unlocked) return speak(phrases.locked);
                  router.push({
                    pathname: '/play/[topicId]/[levelId]',
                    params: { topicId: topic.id, levelId: level.id },
                  });
                }}>
                <Text style={styles.levelNumber}>{unlocked ? level.order : '🔒'}</Text>
              </BigButton>
              <StarRow stars={stars} size={26} />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerIcon: { fontSize: 30 },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink, flexShrink: 1 },
  path: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stop: { alignItems: 'center', gap: spacing.xs },
  levelNumber: { fontSize: 40, fontWeight: '900', color: colors.ink },
});
