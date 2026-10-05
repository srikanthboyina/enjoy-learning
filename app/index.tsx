// Home: a bright sky with Ellie the Elephant, then Math Land and Science Land, each a shelf of topic groups.
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getGroups, getTopics, getTopicsIn } from '../src/engine/loadContent';
import { topicStars } from '../src/engine/topics';
import type { Group, Topic } from '../src/engine/types';
import { Bob } from '../src/kit/Bob';
import { Glyph } from '../src/kit/Glyph';
import { Gradient } from '../src/kit/Gradient';
import { Text } from '../src/kit/Text';
import { Sky } from '../src/screens/Sky';
import { GroupCard } from '../src/screens/GroupCard';
import { useProgress } from '../src/services/progressStore';
import { speak } from '../src/services/speech';
import { colors, radii, spacing, type GradientPair } from '../src/theme';

const TITLE = 'Learn & Play';
const TITLE_COLORS = ['#FF6B6B', '#FF922B', '#FCC419', '#51CF66', '#339AF0', '#845EF7', '#F06595'];

const LANDS: { subject: Topic['subject']; title: string; emoji: string; colors: GradientPair }[] = [
  { subject: 'math', title: 'Math Land', emoji: '🔢', colors: ['#FF8A65', '#FF5E7E'] },
  { subject: 'science', title: 'Science Land', emoji: '🔬', colors: ['#26C6DA', '#5C6BC0'] },
];

const GREETING = "Hi, I'm Ellie the elephant! Pick a world and let's learn together.";

export default function Home() {
  const router = useRouter();
  const levels = useProgress((s) => s.levels);
  const topics = getTopics();
  const groups = getGroups();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 960) - spacing.md * 2;
  const columns = contentWidth > 760 ? 4 : contentWidth > 520 ? 3 : 2;
  const gap = spacing.md;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;

  const open = (group: Group) => {
    speak(group.title);
    router.push({ pathname: '/group/[groupId]', params: { groupId: group.id } });
  };

  const groupStars = (group: Group) =>
    getTopicsIn(group.id).reduce(
      (acc, t) => {
        const s = topicStars(t, levels);
        return { earned: acc.earned + s.earned, max: acc.max + s.max };
      },
      { earned: 0, max: 0 },
    );

  return (
    <Gradient colors={['#7DD3FC', '#E0F2FE']} style={styles.screen}>
      <Sky />
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { width: contentWidth + spacing.md * 2 }]}>
          <View style={styles.topBar}>
            <View style={styles.titleRow} accessibilityRole="header" accessibilityLabel={TITLE}>
              {TITLE.split('').map((ch, i) => (
                <Text key={i} style={[styles.titleChar, { color: TITLE_COLORS[i % TITLE_COLORS.length] }]}>
                  {ch}
                </Text>
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/parent')} style={styles.parentButton}>
              <Text style={styles.parentLabel}>👪 Grown-ups</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={GREETING} onPress={() => speak(GREETING)} style={styles.greeting}>
            <Bob distance={6} wobble>
              <Glyph id="🐘" size={64} accessible={false} />
            </Bob>
            <View style={styles.greetingBubble}>
              <Text style={styles.greetingText}>{GREETING}</Text>
              <Text style={styles.greetingHint}>🔊 Tap me to hear it</Text>
            </View>
          </Pressable>

          {LANDS.map((land) => {
            const list = groups.filter((g) => g.subject === land.subject);
            if (!list.length) return null;
            const count = topics.filter((t: Topic) => t.subject === land.subject).length;
            return (
              <View key={land.subject} style={styles.land}>
                <Gradient colors={land.colors} direction="diagonal" style={styles.landHeader}>
                  <Text style={styles.landTitle}>
                    {land.emoji} {land.title}
                  </Text>
                  <Text style={styles.landCount}>{count} topics</Text>
                </Gradient>
                <View style={[styles.grid, { gap }]}>
                  {list.map((group, i) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      topics={getTopicsIn(group.id)}
                      index={i}
                      width={cardWidth}
                      stars={groupStars(group)}
                      onPress={() => open(group)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  content: { alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', flexShrink: 1 },
  titleChar: {
    fontSize: 36,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  parentButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  parentLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  greetingBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: '#FFE066',
  },
  greetingText: { fontSize: 18, fontWeight: '600', color: colors.ink, lineHeight: 24 },
  greetingHint: { fontSize: 13, fontWeight: '500', color: colors.inkSoft, marginTop: 2 },
  land: { gap: spacing.md },
  landHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  landTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  landCount: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
