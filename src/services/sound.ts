// Short, soft sound effects. Players are created lazily and reused.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useProgress } from './progressStore';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  success: require('../../assets/sounds/success.wav'),
  retry: require('../../assets/sounds/retry.wav'),
  celebrate: require('../../assets/sounds/celebrate.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

export function playSound(name: SoundName): void {
  if (!useProgress.getState().settings.sounds) return;
  try {
    if (!modeSet) {
      modeSet = true;
      // mix with speech instead of interrupting it; play even when the phone is on silent
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
        () => {},
      );
    }
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = 0.6;
      players[name] = player;
    }
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Sound is a nice-to-have; never let it break a game.
  }
}
