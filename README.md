# Edu Learn Games

Math and science mini-games for kids aged 5–8. Expo (React Native) app for Android,
iOS and web from one codebase. No ads, no accounts, nothing leaves the device.

## Run it

```bash
npm install
npm run web      # opens in your browser at http://localhost:8081
npm start        # shows a QR code: scan with Expo Go (Android) or the Camera app (iOS)
```

Phone and computer must be on the same Wi-Fi. If they can't see each other, use
`npx expo start --tunnel`.

## Add levels

Edit `content/<topicId>.levels.json` (100 topics in 13 groups, each with Simple / Medium / Complex levels), then run `npm run validate:content`. Most topics use the data-driven explore engine, so a new topic is just JSON; see CLAUDE.md.
See `CLAUDE.md` for conventions and `docs/PROPOSAL.md` for the design.

## Languages and voice

Ellie speaks and shows text in English, Telugu (తెలుగు), Tamil (தமிழ்) or Hindi (हिन्दी).
Tap the 🗣️🎨 button on the home screen to choose the language, the voice speed (Very slow
to Fast), a device voice, and Ellie's colour. Speech uses the device's own text-to-speech
voices; if a device has no voice for the chosen language, Ellie speaks English while the
words on screen stay translated. Translations live in `content/i18n/<lang>/`.
