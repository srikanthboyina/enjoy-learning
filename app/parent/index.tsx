// Parent dashboard: progress per topic, badges, settings and reset. Adults only (gated).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLevels, getTopics } from '../../src/engine/loadContent';
import { levelKey } from '../../src/engine/scoring';
import { isPlayable, topicStars } from '../../src/engine/topics';
import { Glyph } from '../../src/kit/Glyph';
import { StarRow } from '../../src/kit/StarRow';
import { badgeIds, useProgress } from '../../src/services/progressStore';
import { useParentGate } from '../../src/services/parentGate';
import { colors, radii, spacing, topicColor } from '../../src/theme';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function ParentDashboard() {
  const router = useRouter();
  const { levels, badges, settings, setSetting, resetProgress } = useProgress();
  const lock = useParentGate((s) => s.lock);
  const [confirmReset, setConfirmReset] = useState(false);

  const close = () => {
    lock();
    router.dismissTo('/');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Progress</Text>
        <Pressable accessibilityRole="button" onPress={close} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {getTopics().map((topic) => {
          const playable = isPlayable(topic);
          const s = topicStars(topic, levels);
          return (
            <View key={topic.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Glyph id={topic.icon} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.meta}>
                    {playable ? `${s.done} of ${s.total} levels · ${s.earned}/${s.max} stars` : 'Coming soon'}
                  </Text>
                </View>
                {badges.includes(badgeIds.complete(topic.id)) && <Text style={styles.badge}>🏅</Text>}
                {badges.includes(badgeIds.allStars(topic.id)) && <Text style={styles.badge}>🏆</Text>}
              </View>
              {playable && (
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${s.total ? (s.done / s.total) * 100 : 0}%`, backgroundColor: topicColor(topic.color) },
                    ]}
                  />
                </View>
              )}
              {getLevels(topic.gameId).map((level) => {
                const p = levels[levelKey(topic.gameId, level.id)];
                return (
                  <View key={level.id} style={styles.levelRow}>
                    <Text style={styles.levelName}>
                      {level.order}. {level.name}
                    </Text>
                    {p ? (
                      <>
                        <Text style={styles.levelMeta}>
                          {p.attempts}× · {formatDate(p.lastPlayedAt)}
                        </Text>
                        <StarRow stars={p.bestStars} size={16} />
                      </>
                    ) : (
                      <Text style={styles.levelMeta}>not played</Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.section}>Settings</Text>
        <View style={styles.card}>
          <SettingRow label="Voice instructions" value={settings.voice} onChange={(v) => setSetting('voice', v)} />
          <SettingRow label="Sound effects" value={settings.sounds} onChange={(v) => setSetting('sounds', v)} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice speed</Text>
            <View style={styles.segment}>
              {[
                { label: 'Slow', value: 0.75 },
                { label: 'Normal', value: 0.9 },
                { label: 'Fast', value: 1.05 },
              ].map((o) => (
                <Pressable
                  key={o.label}
                  accessibilityRole="button"
                  onPress={() => setSetting('speechRate', o.value)}
                  style={[styles.segmentItem, settings.speechRate === o.value && styles.segmentOn]}>
                  <Text style={styles.segmentText}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.section}>Privacy</Text>
        <View style={styles.card}>
          <Text style={styles.privacy}>
            No ads, no accounts, no tracking. Progress is saved only on this device and never sent
            anywhere.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!confirmReset) return setConfirmReset(true);
            resetProgress();
            setConfirmReset(false);
          }}
          style={[styles.reset, confirmReset && styles.resetConfirm]}>
          <Text style={[styles.resetText, confirmReset && { color: colors.card }]}>
            {confirmReset ? 'Tap again to erase all progress' : 'Reset progress'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink },
  done: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  doneText: { fontSize: 17, fontWeight: '700', color: colors.sky },
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radii.sm, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  topicTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.inkSoft },
  badge: { fontSize: 24 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  barFill: { height: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelName: { flex: 1, fontSize: 14, color: colors.ink },
  levelMeta: { fontSize: 12, color: colors.inkSoft },
  section: { fontSize: 15, fontWeight: '700', color: colors.inkSoft, marginTop: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  settingLabel: { fontSize: 16, color: colors.ink },
  segment: { flexDirection: 'row', borderRadius: radii.sm, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  segmentItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  segmentOn: { backgroundColor: colors.mapSky },
  segmentText: { fontSize: 14, color: colors.ink },
  privacy: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  reset: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.tomato,
    alignItems: 'center',
  },
  resetConfirm: { backgroundColor: colors.tomato },
  resetText: { fontSize: 16, fontWeight: '700', color: colors.tomato },
});
