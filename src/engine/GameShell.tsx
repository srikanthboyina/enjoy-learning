// Shared frame around every mini-game: Ollie's spoken prompt, hints, gentle feedback,
// round sequencing, stars, saving progress and the end-of-level celebration.
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '../kit/BigButton';
import { Bob } from '../kit/Bob';
import { Confetti } from '../kit/Confetti';
import { FeedbackBadge, useWiggle, type FeedbackKind } from '../kit/Feedback';
import { Glyph } from '../kit/Glyph';
import { Gradient } from '../kit/Gradient';
import { Mascot } from '../kit/Mascot';
import { Text } from '../kit/Text';
import { useProgress } from '../services/progressStore';
import { playSound } from '../services/sound';
import { speak, speakQueued, stopSpeaking } from '../services/speech';
import { colors, gradients, motion, radii, sizes, spacing } from '../theme';
import { shade, tint } from '../theme/color';
import { DIFFICULTY_INFO } from './difficulty';
import { phrases } from './phrases';
import { starsFor } from './scoring';
import type { GameDefinition, Level, Prompt, Stars, Topic } from './types';

/** After this many mistakes in one round the hint turns on by itself. */
const AUTO_HINT_AFTER = 2;

interface Props<TRound> {
  topic: Topic;
  level: Level<TRound>;
  definition: GameDefinition<TRound>;
  nextLevelId?: string;
}

interface Result {
  stars: Stars;
  newBadges: string[];
}

export function GameShell<TRound>({ topic, level, definition, nextLevelId }: Props<TRound>) {
  const router = useRouter();
  const recordLevel = useProgress((s) => s.recordLevel);
  const { style: wiggleStyle, wiggle } = useWiggle();

  const [run, setRun] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [hintActive, setHintActive] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: FeedbackKind; nonce: number }>({ kind: null, nonce: 0 });
  const [burst, setBurst] = useState(0);
  const [happy, setHappy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Counters live in refs so rapid taps never read stale values.
  const mistakes = useRef(0);
  const hints = useRef(0);
  const roundMistakes = useRef(0);
  const transitioning = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = level.rounds[roundIndex];
  const prompt: Prompt = (round as { prompt?: Prompt }).prompt ?? definition.defaultRoundPrompt(round);
  const [c1, c2] = topic.colors;
  const diff = DIFFICULTY_INFO[level.difficulty];

  // Speak the level intro once, then each round's instruction.
  useEffect(() => {
    if (roundIndex === 0) {
      speak(level.intro);
      speakQueued(prompt.say);
    } else {
      speak(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, run]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopSpeaking();
    },
    [],
  );

  const showHint = useCallback(() => {
    if (transitioning.current) return;
    if (definition.isLesson?.(round)) return speak(prompt);
    setHintActive((was) => {
      if (!was) hints.current += 1;
      return true;
    });
    speak(definition.hintFor?.(round) ?? prompt);
  }, [definition, round, prompt]);

  const onAttempt = useCallback(
    (correct: boolean, opts?: { hint?: Prompt }) => {
      if (transitioning.current) return;
      if (correct) {
        playSound('pop');
        return;
      }
      mistakes.current += 1;
      roundMistakes.current += 1;
      playSound('retry');
      wiggle();
      setFeedback((f) => ({ kind: 'retry', nonce: f.nonce + 1 }));
      const extra = opts?.hint?.say ? ` ${opts.hint.say}` : '';
      speak(phrases.tryAgain() + extra);
      if (roundMistakes.current >= AUTO_HINT_AFTER) setHintActive(true);
    },
    [wiggle],
  );

  const onRoundComplete = useCallback(
    (opts?: { explain?: string }) => {
      if (transitioning.current) return;
      transitioning.current = true;
      // Lesson steps (explanations, worked examples) just move on: no praise, no score.
      const lesson = definition.isLesson?.(level.rounds[roundIndex]) ?? false;
      let pause: number = motion.normal;
      if (!lesson) {
        playSound('success');
        setFeedback((f) => ({ kind: 'success', nonce: f.nonce + 1 }));
        setBurst((b) => b + 1);
        setHappy(true);
        const explain = opts?.explain ?? '';
        speak(`${phrases.roundPraise()} ${explain}`.trim());
        // leave time to hear the explanation (~70ms per character)
        pause = Math.max(motion.roundPause, Math.min(6000, 900 + explain.length * 70));
      }

      timer.current = setTimeout(() => {
        setHappy(false);
        const isLast = roundIndex >= level.rounds.length - 1;
        if (!isLast) {
          roundMistakes.current = 0;
          setHintActive(false);
          setFeedback({ kind: null, nonce: 0 });
          setRoundIndex(roundIndex + 1);
          transitioning.current = false;
          return;
        }
        const stars = starsFor(level, mistakes.current, hints.current);
        const newBadges = recordLevel(topic.id, level.id, stars, mistakes.current);
        playSound('celebrate');
        setBurst((b) => b + 1);
        speak(phrases.levelPraise() + (newBadges.length ? ` ${phrases.newBadge}` : ''));
        setResult({ stars, newBadges });
      }, pause);
    },
    [roundIndex, level, definition, recordLevel, topic.id],
  );

  const replay = () => {
    mistakes.current = 0;
    hints.current = 0;
    roundMistakes.current = 0;
    transitioning.current = false;
    setResult(null);
    setHintActive(false);
    setFeedback({ kind: null, nonce: 0 });
    setRoundIndex(0);
    setRun((r) => r + 1);
  };

  const progress = (roundIndex + (result ? 1 : 0)) / level.rounds.length;
  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.max(4, progress * 100)}%`, { duration: 400 }),
  }));

  const Game = definition.Component;

  return (
    <Gradient colors={[tint(c1, 0.72), tint(c2, 0.88)]} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <BigButton label="Back to levels" onPress={() => router.back()} round size={56}>
            <Glyph id="🏠" size={26} accessible={false} />
          </BigButton>
          <View style={styles.progressWrap}>
            <View style={styles.chips}>
              <View style={[styles.chip, { backgroundColor: diff.colors[1] }]}>
                <Text style={styles.chipText}>
                  {diff.emoji} {diff.label}
                </Text>
              </View>
              <Text style={styles.levelName} numberOfLines={1}>
                {level.name}
              </Text>
            </View>
            <View style={styles.track} accessibilityLabel={`Step ${roundIndex + 1} of ${level.rounds.length}`}>
              <Animated.View style={[styles.fill, barStyle]}>
                <Gradient colors={[c1, c2]} direction="diagonal" style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
          </View>
          <BigButton label="Help" onPress={showHint} round size={56} gradient={gradients.lemon}>
            <Glyph id="💡" size={26} accessible={false} />
          </BigButton>
        </View>

        <Mascot prompt={prompt} onSpeak={() => speak(prompt)} mood={happy ? 'happy' : 'talk'} accent={shade(c1, 0.05)} />

        <Animated.View style={[styles.stage, wiggleStyle]}>
          <Game
            key={`${run}-${roundIndex}`}
            round={round}
            roundIndex={roundIndex}
            onAttempt={onAttempt}
            onRoundComplete={onRoundComplete}
            speak={speak}
            hintActive={hintActive}
          />
        </Animated.View>

        <FeedbackBadge kind={feedback.kind} nonce={feedback.nonce} />
        <Confetti burst={burst} count={result ? 60 : 30} />

        {result && (
          <Animated.View entering={FadeIn} style={styles.overlay}>
            <Animated.View entering={ZoomIn.springify()}>
              <Gradient colors={[tint(c1, 0.3), tint(c2, 0.55)]} style={styles.card}>
                <Bob distance={8} wobble>
                  <Glyph id="🦉" size={72} label="Ollie the owl" />
                </Bob>
                <Text style={styles.cardTitle}>Hooray!</Text>
                <View style={styles.bigStars} accessibilityLabel={`${result.stars} of 3 stars`}>
                  {[1, 2, 3].map((i) => (
                    <Animated.View key={i} entering={ZoomIn.delay(250 + i * 250).springify()}>
                      <Text style={[styles.bigStar, i > result.stars && styles.bigStarOff]}>★</Text>
                    </Animated.View>
                  ))}
                </View>
                {result.newBadges.length > 0 && (
                  <Animated.View entering={ZoomIn.delay(1200).springify()} style={styles.badgeRow}>
                    <Glyph id="🏅" size={44} accessible={false} />
                    <Text style={styles.badgeText}>New badge!</Text>
                  </Animated.View>
                )}
                <View style={styles.actions}>
                  <BigButton label="Play again" onPress={replay} round gradient={gradients.primary} size={sizes.bigTouch}>
                    <Glyph id="🔁" size={34} accessible={false} />
                  </BigButton>
                  <BigButton
                    label="All topics"
                    onPress={() => router.dismissTo('/')}
                    round
                    gradient={gradients.success}
                    size={sizes.bigTouch}>
                    <Glyph id="🗺️" size={34} accessible={false} />
                  </BigButton>
                  {nextLevelId && (
                    <BigButton
                      label="Next level"
                      onPress={() =>
                        router.replace({
                          pathname: '/play/[topicId]/[levelId]',
                          params: { topicId: topic.id, levelId: nextLevelId },
                        })
                      }
                      round
                      gradient={[c1, c2]}
                      size={sizes.bigTouch}>
                      <Glyph id="▶️" size={34} accessible={false} />
                    </BigButton>
                  )}
                </View>
              </Gradient>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </Gradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressWrap: { flex: 1, gap: 6 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: { borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 2 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  levelName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  track: {
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  fill: { height: '100%', borderRadius: 8, overflow: 'hidden' },
  stage: {
    flex: 1,
    margin: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,1)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 300,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 36, fontWeight: '700', color: colors.ink },
  bigStars: { flexDirection: 'row', gap: spacing.sm },
  bigStar: {
    fontSize: 64,
    color: colors.star,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  bigStarOff: { color: 'rgba(255,255,255,0.7)' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badgeText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
