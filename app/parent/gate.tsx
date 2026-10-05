// Parent gate: the adult taps three digits that are written as words.
// Young children can't easily read "seven, two, nine", so this keeps them out.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { newChallenge, useParentGate } from '../../src/services/parentGate';
import { colors, radii, spacing } from '../../src/theme';
import { Text } from '../../src/kit/Text';

export default function ParentGate() {
  const router = useRouter();
  const unlock = useParentGate((s) => s.unlock);
  const [challenge, setChallenge] = useState(newChallenge);
  const [entered, setEntered] = useState<number[]>([]);
  const [failed, setFailed] = useState(false);

  const press = (d: number) => {
    const next = [...entered, d];
    if (challenge.digits[next.length - 1] !== d) {
      setFailed(true);
      setEntered([]);
      setChallenge(newChallenge());
      return;
    }
    setFailed(false);
    if (next.length === challenge.digits.length) {
      unlock();
      router.replace('/parent');
      return;
    }
    setEntered(next);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.close}>
        <Text style={styles.closeText}>✕ Back</Text>
      </Pressable>
      <Text style={styles.heading}>For grown-ups</Text>
      <Text style={styles.instruction}>Tap these numbers in order:</Text>
      <Text style={styles.words}>{challenge.words}</Text>
      <View style={styles.progress}>
        {challenge.digits.map((_, i) => (
          <View key={i} style={[styles.pip, i < entered.length && styles.pipOn]} />
        ))}
      </View>
      {failed && <Text style={styles.failed}>Not quite. Here is a new set.</Text>}
      <View style={styles.pad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={String(d)}
            onPress={() => press(d)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
            <Text style={styles.keyText}>{d}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', padding: spacing.lg, backgroundColor: colors.card },
  close: { alignSelf: 'flex-start', padding: spacing.sm },
  closeText: { fontSize: 16, color: colors.inkSoft, fontWeight: '600' },
  heading: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: spacing.lg },
  instruction: { fontSize: 16, color: colors.inkSoft, marginTop: spacing.sm },
  words: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  progress: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  pip: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.line },
  pipOn: { backgroundColor: colors.ink },
  failed: { color: colors.inkSoft, marginBottom: spacing.sm },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 252, gap: 12, justifyContent: 'center' },
  key: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.line },
  keyText: { fontSize: 26, fontWeight: '600', color: colors.ink },
});
