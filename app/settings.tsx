// Voice & Colours: kids (or grown-ups) pick Ellie's language, how fast she talks, which
// device voice she uses, and her colour. Nothing here is risky, so there is no parent gate.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tr, useLanguage } from '../src/i18n';
import { LANGUAGES, getLanguage, type LanguageId } from '../src/i18n/languages';
import { BigButton } from '../src/kit/BigButton';
import { ELEPHANT_COLORS, Elephant } from '../src/kit/Elephant';
import { ElephantBuddy } from '../src/kit/ElephantBuddy';
import { Glyph } from '../src/kit/Glyph';
import { Gradient } from '../src/kit/Gradient';
import { Text } from '../src/kit/Text';
import { useProgress } from '../src/services/progressStore';
import { SPEECH_RATES as SPEEDS, canSpeak, loadVoices, onVoicesChanged, speakSample, voicesFor } from '../src/services/speech';
import { colors, radii, spacing } from '../src/theme';

const SAMPLE = 'Hello! I am Ellie. Is this a good speed?';

const NO_VOICE =
  'This device has no voice for this language yet, so Ellie talks in English and shows the words in this language. A grown-up can add the voice in the phone’s text-to-speech settings.';

export default function Settings() {
  const router = useRouter();
  const lang = useLanguage();
  const settings = useProgress((s) => s.settings);
  const setSetting = useProgress((s) => s.setSetting);
  const [cheer, setCheer] = useState(0);
  const [, setVoicesVersion] = useState(0);

  useEffect(() => {
    const off = onVoicesChanged(() => setVoicesVersion((v) => v + 1));
    void loadVoices();
    return off;
  }, []);

  const voices = (voicesFor(lang) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const chosenVoice = settings.voices[lang];

  const pickLanguage = (id: LanguageId) => {
    setSetting('language', id);
    speakSample(SAMPLE, id);
    setCheer((c) => c + 1);
  };

  const pickSpeed = (value: number) => {
    setSetting('speechRate', value);
    // read the new rate straight from the store on the next tick
    setTimeout(() => speakSample(SAMPLE, lang), 0);
  };

  const pickVoice = (id: string | undefined) => {
    const next = { ...settings.voices };
    if (id) next[lang] = id;
    else delete next[lang];
    setSetting('voices', next);
    setTimeout(() => speakSample(SAMPLE, lang), 0);
  };

  const pickColor = (id: string) => {
    setSetting('elephantColor', id);
    setCheer((c) => c + 1);
  };

  return (
    <Gradient colors={['#FFE8F3', '#E3F2FF']} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <BigButton label={tr('Done')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} round size={56}>
              <Glyph id="🏠" size={26} accessible={false} />
            </BigButton>
            <Text style={styles.title} accessibilityRole="header">
              {tr('Voice & Colours')}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr(SAMPLE)}
            onPress={() => {
              speakSample(SAMPLE, lang);
              setCheer((c) => c + 1);
            }}
            style={styles.hero}>
            <ElephantBuddy size={110} celebrate={cheer} />
            <View style={styles.heroBubble}>
              <Text style={styles.heroText}>{tr(SAMPLE)}</Text>
              <Text style={styles.heroHint}>🔊</Text>
            </View>
          </Pressable>

          <Section emoji="🗣️" title={tr('Language')}>
            <View style={styles.row}>
              {LANGUAGES.map((l) => (
                <Choice key={l.id} on={lang === l.id} onPress={() => pickLanguage(l.id)} label={l.label}>
                  <Text style={styles.langText}>{l.label}</Text>
                </Choice>
              ))}
            </View>
            {!canSpeak(lang) && <Text style={styles.note}>ℹ️ {tr(NO_VOICE)}</Text>}
          </Section>

          <Section emoji="⏱️" title={tr('Voice speed')}>
            <View style={styles.row}>
              {SPEEDS.map((s) => (
                <Choice
                  key={s.value}
                  on={Math.abs(settings.speechRate - s.value) < 0.01}
                  onPress={() => pickSpeed(s.value)}
                  label={tr(s.label)}>
                  <Text style={styles.choiceEmoji}>{s.emoji}</Text>
                  <Text style={styles.choiceText}>{tr(s.label)}</Text>
                </Choice>
              ))}
            </View>
          </Section>

          {voices.length > 1 && (
            <Section emoji="🎙️" title={tr('Voice')}>
              <View style={styles.row}>
                <Choice on={!chosenVoice} onPress={() => pickVoice(undefined)} label={tr('Any voice')}>
                  <Text style={styles.choiceText}>⭐ {tr('Any voice')}</Text>
                </Choice>
                {voices.map((v, i) => (
                  <Choice
                    key={v.identifier}
                    on={chosenVoice === v.identifier}
                    onPress={() => pickVoice(v.identifier)}
                    label={v.name}>
                    <Text style={styles.choiceText} numberOfLines={2}>
                      {i + 1}. {shortName(v.name, getLanguage(lang).label)}
                    </Text>
                  </Choice>
                ))}
              </View>
            </Section>
          )}

          <Section emoji="🎨" title={tr("Ellie's colour")}>
            <View style={styles.row}>
              {ELEPHANT_COLORS.map((c) => (
                <Choice
                  key={c.id}
                  on={settings.elephantColor === c.id}
                  onPress={() => pickColor(c.id)}
                  label={tr(c.name)}
                  tint={c.color}>
                  <Elephant color={c.color} size={56} />
                </Choice>
              ))}
            </View>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Gradient>
  );
}

/** Device voice names can be long ("Google हिन्दी (India)"); keep the useful part. */
function shortName(name: string, langLabel: string): string {
  const cleaned = name.replace(/^(Microsoft|Google|com\.apple\.\S+\.)\s*/i, '').replace(/\s*[-–]\s*.*$/, '');
  return cleaned || langLabel;
}

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {emoji} {title}
      </Text>
      {children}
    </View>
  );
}

function Choice({
  on,
  onPress,
  label,
  tint,
  children,
}: {
  on: boolean;
  onPress: () => void;
  label: string;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        on && styles.choiceOn,
        on && tint ? { borderColor: tint, backgroundColor: '#FFFFFF' } : null,
        pressed && styles.pressed,
      ]}>
      {children}
      {on && <Text style={styles.tick}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroBubble: { flex: 1, backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, gap: 4 },
  heroText: { fontSize: 18, fontWeight: '600', color: colors.ink },
  heroHint: { fontSize: 18 },
  section: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minWidth: 88,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  choiceOn: { borderColor: colors.sky, backgroundColor: '#E7F5FF' },
  pressed: { transform: [{ scale: 0.96 }] },
  tick: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.success,
    color: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    overflow: 'hidden',
  },
  langText: { fontSize: 22, fontWeight: '700', color: colors.ink },
  choiceEmoji: { fontSize: 28 },
  choiceText: { fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'center', maxWidth: 140 },
  note: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
});
