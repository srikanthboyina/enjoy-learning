// All spoken instructions go through here so the parent's voice setting is respected.
import * as Speech from 'expo-speech';

import type { Prompt } from '../engine/types';
import { useProgress } from './progressStore';

export function speak(prompt: Prompt | string): void {
  const { voice, speechRate } = useProgress.getState().settings;
  if (!voice) return;
  const text = typeof prompt === 'string' ? prompt : prompt.say;
  Speech.stop();
  Speech.speak(text, { language: 'en-US', rate: speechRate, pitch: 1.1 });
}

/** Queue speech after whatever is currently being said (used for counting aloud). */
export function speakQueued(text: string): void {
  const { voice, speechRate } = useProgress.getState().settings;
  if (!voice) return;
  Speech.speak(text, { language: 'en-US', rate: speechRate, pitch: 1.1 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
