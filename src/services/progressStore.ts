// Child progress, stored only on this device (AsyncStorage; localStorage on web).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLevels, getTopics } from '../engine/loadContent';
import { levelKey } from '../engine/scoring';
import type { GameId, Stars } from '../engine/types';

export interface LevelProgress {
  bestStars: Stars;
  attempts: number;
  bestMistakes: number;
  lastPlayedAt: number;
}

export interface Settings {
  voice: boolean;
  sounds: boolean;
  /** 0.5–1.2; kids usually prefer slightly slow speech */
  speechRate: number;
}

interface ProgressState {
  schemaVersion: 1;
  levels: Record<string, LevelProgress>;
  badges: string[];
  settings: Settings;

  /** Saves a finished level and returns any badges earned just now. */
  recordLevel: (gameId: GameId, levelId: string, stars: Stars, mistakes: number) => string[];
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetProgress: () => void;
}

const DEFAULT_SETTINGS: Settings = { voice: true, sounds: true, speechRate: 0.9 };

export const badgeIds = {
  complete: (topicId: string) => `${topicId}-complete`,
  allStars: (topicId: string) => `${topicId}-all-stars`,
};

function computeBadges(levels: Record<string, LevelProgress>): string[] {
  const badges: string[] = [];
  for (const topic of getTopics()) {
    const topicLevels = getLevels(topic.gameId);
    if (topicLevels.length === 0) continue;
    const stars = topicLevels.map((l) => levels[levelKey(topic.gameId, l.id)]?.bestStars ?? 0);
    if (stars.every((s) => s >= 1)) badges.push(badgeIds.complete(topic.id));
    if (stars.every((s) => s === 3)) badges.push(badgeIds.allStars(topic.id));
  }
  return badges;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      schemaVersion: 1,
      levels: {},
      badges: [],
      settings: DEFAULT_SETTINGS,

      recordLevel: (gameId, levelId, stars, mistakes) => {
        const key = levelKey(gameId, levelId);
        const prev = get().levels[key];
        const levels = {
          ...get().levels,
          [key]: {
            bestStars: Math.max(prev?.bestStars ?? 0, stars) as Stars,
            attempts: (prev?.attempts ?? 0) + 1,
            bestMistakes: Math.min(prev?.bestMistakes ?? Infinity, mistakes),
            lastPlayedAt: Date.now(),
          },
        };
        const before = new Set(get().badges);
        const badges = Array.from(new Set([...get().badges, ...computeBadges(levels)]));
        set({ levels, badges });
        return badges.filter((b) => !before.has(b));
      },

      setSetting: (key, value) => set({ settings: { ...get().settings, [key]: value } }),

      resetProgress: () => set({ levels: {}, badges: [] }),
    }),
    {
      name: 'edu-learn-games/progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ schemaVersion, levels, badges, settings }) => ({
        schemaVersion,
        levels,
        badges,
        settings,
      }),
      // Add a case per schema bump. Never discard a child's stars.
      migrate: (persisted) => persisted as ProgressState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
        };
      },
    },
  ),
);

export function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useProgress.persist.hasHydrated());
  useEffect(() => {
    const unsub = useProgress.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useProgress.persist.hasHydrated());
    // If storage is blocked (private browsing, sandboxed web views), play without saved progress.
    const fallback = setTimeout(() => setHydrated(true), 1500);
    return () => {
      unsub();
      clearTimeout(fallback);
    };
  }, []);
  return hydrated;
}

export function levelProgress(gameId: GameId, levelId: string): LevelProgress | undefined {
  return useProgress.getState().levels[levelKey(gameId, levelId)];
}

/** Level n is open when level n-1 has at least one star. */
export function isLevelUnlocked(
  levels: Record<string, LevelProgress>,
  gameId: GameId,
  index: number,
): boolean {
  if (index === 0) return true;
  const prev = getLevels(gameId)[index - 1];
  return (levels[levelKey(gameId, prev.id)]?.bestStars ?? 0) >= 1;
}
