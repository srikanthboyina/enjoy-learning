// A topic: what it's about (spoken), then Simple / Medium / Complex level paths.
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DIFFICULTY_INFO } from '../../src/engine/difficulty';
import { getLevelsFor, getTopic } from '../../src/engine/loadContent';
import { levelKey } from '../../src/engine/scoring';
import { difficultyStars, isPlayable } from '../../src/engine/topics';
import { DIFFICULTIES } from '../../src/engine/contentSchema';
import { BigButton } from '../../src/kit/BigButton';
import { Bob } from '../../src/kit/Bob';
import { Glyph } from '../../src/kit/Glyph';
import { Gradient } from '../../src/kit/Gradient';
import { StarRow } from '../../src/kit/StarRow';
import { Text } from '../../src/kit/Text';
import { useProgress } from '../../src/services/progressStore';
import { speak } from '../../src/services/speech';
import { colors, radii, spacing } from '../../src/theme';
import { tint } from '../../src/theme/color';

export default function TopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const progress = useProgress((s) => s.levels);
  const topic = getTopic(topicId);

  useEffect(() => {
    if (topic) speak(`${topic.title}. ${topic.blurb} Choose simple, medium or complex.`);
  }, [topic]);

  if (!topic || !isPlayable(topic)) return <Redirect href="/" />;
  const [c1, c2] = topic.colors;

  return (
    <Gradient colors={[tint(c1, 0.7), '#FFFFFF']} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Gradient colors={[c1, c2]} direction="diagonal" style={styles.hero}>
            <View style={styles.heroTop}>
              <BigButton
                label="All topics"
                onPress={() =>
                  router.canGoBack()
                    ? router.back()
                    : router.replace({ pathname: '/group/[groupId]', params: { groupId: topic.group } })
                }
                round
                size={52}>
                <Glyph id="🗺️" size={24} accessible={false} />
              </BigButton>
              <BigButton
                label="Hear about this topic"
                onPress={() => speak(`${topic.title}. ${topic.blurb}`)}
                round
                size={52}
                sound={null}>
                <Glyph id="🔊" size={24} accessible={false} />
              </BigButton>
            </View>
            <Bob distance={8} wobble>
              <Glyph id={topic.emoji} size={84} accessible={false} />
            </Bob>
            <Text style={styles.title}>{topic.title}</Text>
            <Text style={styles.blurb}>{topic.blurb}</Text>
          </Gradient>

          {DIFFICULTIES.map((d, di) => {
            const levels = getLevelsFor(topic.id, d);
            if (!levels.length) return null;
            const info = DIFFICULTY_INFO[d];
            const s = difficultyStars(topic, d, progress);
            return (
              <Animated.View key={d} entering={FadeInDown.delay(120 * di).springify()} style={styles.section}>
                <Pressable accessibilityRole="button" onPress={() => speak(info.say)}>
                  <Gradient colors={info.colors} direction="diagonal" style={styles.sectionHeader}>
                    <Text style={styles.sectionEmoji}>{info.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>{info.label}</Text>
                      <Text style={styles.sectionSub}>{info.tag}</Text>
                    </View>
                    <View style={styles.sectionStars}>
                      <Text style={styles.sectionStarsText}>
                        ⭐ {s.earned}/{s.max}
                      </Text>
                    </View>
                  </Gradient>
                </Pressable>
                <View style={styles.levels}>
                  {levels.map((level, i) => {
                    const stars = progress[levelKey(topic.id, level.id)]?.bestStars ?? 0;
                    return (
                      <View key={level.id} style={styles.level}>
                        <BigButton
                          label={`${info.label} level ${i + 1}: ${level.name}`}
                          round
                          size={78}
                          gradient={stars > 0 ? info.colors : [tint(info.colors[0], 0.25), info.colors[1]]}
                          onPress={() =>
                            router.push({
                              pathname: '/play/[topicId]/[levelId]',
                              params: { topicId: topic.id, levelId: level.id },
                            })
                          }>
                          <Text style={styles.levelNumber}>{i + 1}</Text>
                        </BigButton>
                        <StarRow stars={stars} size={20} />
                        <Text style={styles.levelName} numberOfLines={2}>
                          {level.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center', paddingBottom: spacing.xxl },
  hero: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  heroTop: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  blurb: { fontSize: 17, fontWeight: '500', color: '#FFFFFF', textAlign: 'center', lineHeight: 23, maxWidth: 520 },
  section: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.md,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionEmoji: { fontSize: 36 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  sectionSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.95)' },
  sectionStars: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 4 },
  sectionStarsText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', paddingBottom: spacing.sm },
  level: { alignItems: 'center', gap: 2, width: 100 },
  levelNumber: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  levelName: { fontSize: 13, fontWeight: '600', color: colors.ink, textAlign: 'center' },
});
