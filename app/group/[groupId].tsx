// A group of topics (e.g. "Shapes & Space"): a colourful hero and a card per topic.
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getGroup, getTopicsIn } from '../../src/engine/loadContent';
import { phrases } from '../../src/engine/phrases';
import { isPlayable, topicStars } from '../../src/engine/topics';
import type { Topic } from '../../src/engine/types';
import { BigButton } from '../../src/kit/BigButton';
import { Bob } from '../../src/kit/Bob';
import { Glyph } from '../../src/kit/Glyph';
import { Gradient } from '../../src/kit/Gradient';
import { Text } from '../../src/kit/Text';
import { TopicCard } from '../../src/screens/TopicCard';
import { useProgress } from '../../src/services/progressStore';
import { speak } from '../../src/services/speech';
import { radii, spacing } from '../../src/theme';
import { tint } from '../../src/theme/color';
import { tr } from '../../src/i18n';

export default function GroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const levels = useProgress((s) => s.levels);
  const group = getGroup(groupId);
  const topics = group ? getTopicsIn(group.id) : [];
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 960) - spacing.md * 2;
  const columns = contentWidth > 760 ? 4 : contentWidth > 520 ? 3 : 2;
  const gap = spacing.md;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;

  useEffect(() => {
    if (group) speak([group.title, group.blurb, 'Pick a topic.']);
  }, [group]);

  if (!group) return <Redirect href="/" />;
  const [c1, c2] = group.colors;

  const open = (topic: Topic) => {
    if (!isPlayable(topic)) return speak(phrases.comingSoon);
    speak(topic.title);
    router.push({ pathname: '/topic/[topicId]', params: { topicId: topic.id } });
  };

  return (
    <Gradient colors={[tint(c1, 0.75), '#FFFFFF']} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { width: contentWidth + spacing.md * 2 }]}>
          <Gradient colors={[c1, c2]} direction="diagonal" style={styles.hero}>
            <View style={styles.heroTop}>
              <BigButton
                label="Home"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                round
                size={52}>
                <Glyph id="🏠" size={24} accessible={false} />
              </BigButton>
              <BigButton label="Hear about this" onPress={() => speak([group.title, group.blurb])} round size={52} sound={null}>
                <Glyph id="🔊" size={24} accessible={false} />
              </BigButton>
            </View>
            <Bob distance={8} wobble>
              <Glyph id={group.emoji} size={80} accessible={false} />
            </Bob>
            <Text style={styles.title}>{tr(group.title)}</Text>
            <Text style={styles.blurb}>{tr(group.blurb)}</Text>
          </Gradient>
          <View style={[styles.grid, { gap }]}>
            {topics.map((topic, i) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={i}
                width={cardWidth}
                stars={topicStars(topic, levels)}
                playable={isPlayable(topic)}
                onPress={() => open(topic)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: {
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  blurb: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
