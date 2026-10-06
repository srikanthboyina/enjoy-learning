// All spoken instructions go through here so the voice settings are respected: on/off,
// speed, language and the chosen device voice. Text is written in English and translated
// just before speaking. If the device has no voice for the chosen language, Ellie speaks
// English instead (the screen still shows the translated text).
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import type { Prompt } from '../engine/types';
import { tr } from '../i18n';
import { getLanguage, type LanguageId } from '../i18n/languages';
import { useProgress } from './progressStore';

export type Speakable = Prompt | string | string[];

/** Voice speeds offered to families (Slow is the default: young children need time). */
export const SPEECH_RATES = [
  { label: 'Very slow', emoji: '🐌', value: 0.6 },
  { label: 'Slow', emoji: '🐢', value: 0.75 },
  { label: 'Normal', emoji: '🚶', value: 0.9 },
  { label: 'Fast', emoji: '🐇', value: 1.05 },
];

let voiceList: Speech.Voice[] | null = null;
const listeners = new Set<() => void>();

function langPrefix(tag: string): string {
  return tag.replace('_', '-').toLowerCase().split('-')[0];
}

/** Reads the device's voices (they can arrive late on the web). */
export async function loadVoices(): Promise<Speech.Voice[]> {
  try {
    voiceList = await Speech.getAvailableVoicesAsync();
  } catch {
    voiceList = [];
  }
  listeners.forEach((l) => l());
  return voiceList;
}

export function onVoicesChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => void loadVoices());
}
void loadVoices();

/** Device voices for a language; null while we don't know yet. */
export function voicesFor(lang: LanguageId): Speech.Voice[] | null {
  if (voiceList === null) return null;
  const want = langPrefix(getLanguage(lang).tts);
  return voiceList.filter((v) => langPrefix(v.language) === want);
}

/** True when the device can speak this language (unknown counts as yes). */
export function canSpeak(lang: LanguageId): boolean {
  if (lang === 'en') return true;
  const voices = voicesFor(lang);
  return voices === null || voices.length > 0;
}

function toParts(what: Speakable): string[] {
  if (Array.isArray(what)) return what;
  return [typeof what === 'string' ? what : what.say];
}

function options(lang: LanguageId): Speech.SpeechOptions {
  const { speechRate, voices } = useProgress.getState().settings;
  const chosen = voices[lang];
  const available = voicesFor(lang);
  const voice = chosen && available?.some((v) => v.identifier === chosen) ? chosen : undefined;
  return { language: getLanguage(lang).tts, voice, rate: speechRate, pitch: 1.1 };
}

/** What to say and how: translated when a voice exists, otherwise the English original. */
function prepare(what: Speakable): { text: string; opts: Speech.SpeechOptions } | null {
  const { voice, language } = useProgress.getState().settings;
  if (!voice) return null;
  const parts = toParts(what).filter((p) => p && p.trim());
  if (parts.length === 0) return null;
  const lang = language as LanguageId;
  if (lang !== 'en' && canSpeak(lang)) {
    return { text: parts.map((p) => tr(p, lang)).join(' '), opts: options(lang) };
  }
  return { text: parts.join(' '), opts: options('en') };
}

/** Speak now, cutting off anything already being said. Pass parts for composite lines. */
export function speak(what: Speakable): void {
  const prepared = prepare(what);
  if (!prepared) return;
  Speech.stop();
  Speech.speak(prepared.text, prepared.opts);
}

/** Queue speech after whatever is currently being said (used for counting aloud). */
export function speakQueued(what: Speakable): void {
  const prepared = prepare(what);
  if (!prepared) return;
  Speech.speak(prepared.text, prepared.opts);
}

/** Try a voice out on the settings screen. */
export function speakSample(text: string, lang: LanguageId): void {
  Speech.stop();
  if (lang !== 'en' && !canSpeak(lang)) {
    Speech.speak(text, options('en'));
    return;
  }
  Speech.speak(tr(text, lang), options(lang));
}

export function stopSpeaking(): void {
  Speech.stop();
}
