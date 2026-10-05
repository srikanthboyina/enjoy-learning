// Shared frame around every mini-game: prompt + voice, hints, gentle feedback,
// round sequencing, stars, saving progress and the end-of-level celebration.
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '../kit/BigButton';
import { FeedbackBadge, useWiggle, type FeedbackKind } from '../kit/Feedback';
import { IconPrompt } from '../kit/IconPrompt';
import { StarRow } from '../kit/StarRow';
import { useProgress } from '../services/progressStore';
import { playSound } from '../services/sound';
import { speak, speakQueued, stopSpeaking } from '../services/speech';
import { colors, motion, radii, sizes, spacing, topicColor } from '../theme';
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
  const [result, setResult] = useState<Result | null>(null);

  // Counters live in refs so rapid taps never read stale values.
  const mistakes = useRef(0);
  const hints = useRef(0);
  const roundMistakes = useRef(0);
  const transitioning = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = level.rounds[roundIndex];
  const prompt: Prompt = (round as { prompt?: Prompt }).prompt ?? definition.defaultRoundPrompt(round);
  const color = topicColor(topic.color);

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

  const onRoundComplete = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;
    playSound('success');
    setFeedback((f) => ({ kind: 'success', nonce: f.nonce + 1 }));
    speak(phrases.roundPraise());

    timer.current = setTimeout(() => {
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
      const newBadges = recordLevel(definition.id, level.id, stars, mistakes.current);
      playSound('celebrate');
      speak(phrases.levelPraise() + (newBadges.length ? ` ${phrases.newBadge}` : ''));
      setResult({ stars, newBadges });
    }, motion.roundPause);
  }, [roundIndex, level, definition.id, recordLevel]);

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

  const Game = definition.Component;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BigButton label="Back to levels" onPress={() => router.back()} round>
          <Text style={styles.headerIcon}>🏠</Text>
        </BigButton>
        <View style={styles.dots} accessibilityLabel={`Round ${roundIndex + 1} of ${level.rounds.length}`}>
          {level.rounds.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i < roundIndex || (i === roundIndex && result) ? color : colors.line },
                i === roundIndex && !result && { borderWidth: 3, borderColor: color },
              ]}
            />
          ))}
        </View>
        <BigButton label="Help" onPress={showHint} round color={colors.sunshine}>
          <Text style={styles.headerIcon}>💡</Text>
        </BigButton>
      </View>

      <IconPrompt prompt={prompt} onSpeak={() => speak(prompt)} />

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

      {result && (
        <Animated.View entering={FadeIn} style={styles.overlay}>
          <Animated.View entering={ZoomIn.springify()} style={styles.card}>
            <Text style={styles.trophy}>🎉</Text>
            <StarRow stars={result.stars} size={56} />
            {result.newBadges.length > 0 && (
              <Text style={styles.badge} accessibilityLabel="New badge">
                🏅
              </Text>
            )}
            <View style={styles.actions}>
              <BigButton label="Play again" onPress={replay} round color={colors.sky} size={sizes.bigTouch}>
                <Text style={styles.actionIcon}>🔁</Text>
              </BigButton>
              <BigButton
                label="Map"
                onPress={() => router.dismissTo('/')}
                round
                color={colors.leaf}
                size={sizes.bigTouch}>
                <Text style={styles.actionIcon}>🗺️</Text>
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
                  color={color}
                  size={sizes.bigTouch}>
                  <Text style={styles.actionIcon}>▶️</Text>
                </BigButton>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerIcon: { fontSize: 30 },
  dots: { flexDirection: 'row', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8 },
  stage: { flex: 1, padding: spacing.md },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 280,
  },
  trophy: { fontSize: 72 },
  badge: { fontSize: 56 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionIcon: { fontSize: 36 },
});
