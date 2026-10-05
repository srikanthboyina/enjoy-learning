// Home: the world map. One island per topic from content/topics.json.
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTopics } from '../src/engine/loadContent';
import { phrases } from '../src/engine/phrases';
import { isPlayable, isTopicUnlocked, topicStars } from '../src/engine/topics';
import { BigButton } from '../src/kit/BigButton';
import { Glyph } from '../src/kit/Glyph';
import { useProgress } from '../src/services/progressStore';
import { speak } from '../src/services/speech';
import { colors, radii, spacing, topicColor } from '../src/theme';

const ISLAND = 128;

export default function WorldMap() {
  const router = useRouter();
  const levels = useProgress((s) => s.levels);
  const topics = getTopics();
  const { width } = useWindowDimensions();
  const mapWidth = Math.min(width, 600);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.title} accessibilityRole="header">
          🌈 Learn & Play
        </Text>
        <BigButton
          label="Grown-ups"
          onPress={() => router.push('/parent')}
          color={colors.card}
          size={48}
          sound={null}>
          <Text style={styles.parentLabel}>👪 Grown-ups</Text>
        </BigButton>
      </View>

      <View style={[styles.map, { width: mapWidth }]}>
        <View style={styles.river} />
        {topics.map((topic) => {
          const playable = isPlayable(topic);
          const unlocked = playable && isTopicUnlocked(topic, topics, levels);
          const stars = topicStars(topic, levels);
          return (
            <View
              key={topic.id}
              style={[
                styles.island,
                {
                  left: `${topic.mapPosition.x * 100}%`,
                  top: `${topic.mapPosition.y * 100}%`,
                },
              ]}>
              <BigButton
                label={topic.title}
                round
                size={ISLAND}
                color={unlocked ? topicColor(topic.color) : colors.locked}
                onPress={() => {
                  if (!playable) return speak(phrases.comingSoon);
                  if (!unlocked) return speak(phrases.locked);
                  speak(topic.title);
                  router.push({ pathname: '/topic/[topicId]', params: { topicId: topic.id } });
                }}>
                <Glyph id={topic.icon} size={56} accessible={false} />
                {!playable && <Text style={styles.lock}>🔒</Text>}
              </BigButton>
              <Text style={styles.islandLabel} numberOfLines={2}>
                {topic.title}
              </Text>
              {playable && (
                <Text style={styles.islandStars} accessibilityLabel={`${stars.earned} stars`}>
                  ⭐ {stars.earned}/{stars.max}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mapSky },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  parentLabel: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  map: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: colors.mapGrass,
    borderTopLeftRadius: radii.lg * 2,
    borderTopRightRadius: radii.lg * 2,
    marginTop: spacing.md,
  },
  river: {
    position: 'absolute',
    left: '46%',
    top: 0,
    bottom: 0,
    width: 26,
    backgroundColor: colors.mapWater,
    borderRadius: 13,
    opacity: 0.7,
  },
  island: {
    position: 'absolute',
    width: ISLAND + 40,
    marginLeft: -(ISLAND + 40) / 2,
    marginTop: -ISLAND / 2,
    alignItems: 'center',
  },
  lock: { position: 'absolute', bottom: 10, right: 18, fontSize: 26 },
  islandLabel: {
    marginTop: spacing.xs,
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  islandStars: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
});
