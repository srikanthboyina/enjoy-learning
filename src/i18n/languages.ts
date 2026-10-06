// Languages Ellie can speak. English is the source language: every string in the app
// and in content/ is written in English and translated at display/speech time.

export type LanguageId = 'en' | 'te' | 'ta' | 'hi';

export interface Language {
  id: LanguageId;
  /** the language's own name, shown on its button */
  label: string;
  /** BCP-47 tag for text-to-speech */
  tts: string;
}

export const LANGUAGES: Language[] = [
  { id: 'en', label: 'English', tts: 'en-US' },
  { id: 'te', label: 'తెలుగు', tts: 'te-IN' },
  { id: 'ta', label: 'தமிழ்', tts: 'ta-IN' },
  { id: 'hi', label: 'हिन्दी', tts: 'hi-IN' },
];

export function getLanguage(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}
