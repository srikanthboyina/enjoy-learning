# Edu Learn Games: conventions

A cross-platform (Android, iOS, web) Expo app that teaches math and science to
children aged 5–8 through mini-games. Expo-specific tooling rules are in
`AGENTS.md`; this file covers how *this* app is organised. The approved design is
in `docs/PROPOSAL.md`.

## Stack

Expo SDK 57, expo-router, TypeScript (strict), react-native-reanimated 4 +
react-native-worklets, react-native-gesture-handler, expo-speech, expo-audio,
AsyncStorage, zustand, zod. No backend.

- Add packages with `npx expo install <pkg>` (use `EXPO_OFFLINE=1` if the Expo API is
  unreachable), never plain `npm install`, so versions match the SDK.
- Worklet → JS calls use `scheduleOnRN` from `react-native-worklets` (not `runOnJS`).

## Commands

```bash
npm run web               # browser
npm start                 # QR code for Expo Go / dev build
npm run typecheck
npm run validate:content  # checks every content/*.json against the game schemas
npm run check             # both of the above; run before calling work done
```

## Layout

| Path | What lives there |
|---|---|
| `app/` | expo-router screens. Route + compose only; no game logic. |
| `content/` | Level and topic **data** (JSON). No code. |
| `src/games/<gameId>/` | One mini-game: `schema.ts`, `<Name>Game.tsx`, `index.ts`, `parts/`. |
| `src/games/schemas.ts` | gameId → round schema (pure TS, used by app and validator). |
| `src/games/registry.ts` | gameId → `GameDefinition` (the only registration point). |
| `src/engine/` | Game-agnostic runtime: `GameShell`, scoring, content loading, types. |
| `src/kit/` | Reusable kid-friendly UI: `BigButton`, `Glyph`, drag-and-drop, feedback. |
| `src/services/` | `speech`, `sound`, `progressStore`, `parentGate`. |
| `src/theme/` | Colours, spacing, sizes, motion. Use tokens, not literals. |
| `src/assets-map.ts` | `GlyphId` → picture (emoji in v1) + spoken name. |

Import boundaries: a game may import from `engine/`, `kit/`, `services/`, `theme/`,
`assets-map` — **never from another game**, never from `app/`. Files imported by
`scripts/` (`schema.ts`, `schemas.ts`, `assets-map.ts`, `engine/types.ts`,
`engine/contentSchema.ts`) must stay free of React Native imports.

## Content (levels) rules

- One file per game: `content/<gameId>.levels.json` with `{ gameId, version: 1, levels }`.
- Each level: `id` (unique, e.g. `counting-05`), `order`, `name` (parent screen only),
  `intro` prompt, optional `stars`, and 3–6 `rounds`.
- Round shapes are defined by the game's zod schema in `src/games/<gameId>/schema.ts`.
  The TS type is `z.infer` of that schema. Never hand-write a duplicate type.
- Topics on the world map are in `content/topics.json`. A topic whose game has no
  levels file shows as "coming soon".
- Invalid levels are logged and skipped at runtime; `npm run validate:content` must
  pass before a change is done.

## Mini-game contract

A game component renders **one round** and receives `GameProps<TRound>`
(`src/engine/types.ts`). It:

- calls `onAttempt(correct)` for each answer it judges (never shows its own error UI),
- calls `onRoundComplete()` once solved,
- may call `speak(prompt)` for in-game narration (e.g. counting aloud),
- reads `hintActive` to show visual help.

It never touches storage, navigation, scoring, stars, or sounds for right/wrong;
`GameShell` owns those. Remount per round is guaranteed (`key={roundIndex}`), so
round state can live in `useState`.

### Adding a topic

1. `src/games/<id>/schema.ts` (zod round schema), `<Name>Game.tsx`, `index.ts`.
2. Add the id to `GAME_IDS` in `src/engine/contentSchema.ts` (if new), the schema to
   `src/games/schemas.ts`, the definition to `src/games/registry.ts`.
3. `content/<id>.levels.json` + an entry in `content/topics.json`.
4. Import the JSON in `src/engine/loadContent.ts`.
5. `npm run check`.

## Child-focused UX rules

- **Minimal reading.** Every instruction is a `Prompt` = spoken `say` + `icons`.
  Kids never need to read; text is only a small label.
- **Voice** goes through `services/speech.ts` (respects the parent's mute setting).
- **Touch targets ≥ `sizes.touch` (64dp).** Use `BigButton` for anything tappable.
- **Never say "wrong".** Mistakes get a soft wiggle, a gentle sound and phrases from
  `engine/phrases.ts`. A round can't be failed; hints appear after 2 mistakes.
- **Motion** respects reduced motion (`useReducedMotion`): swap big movement for fades.
- Bright colours from `theme`; one primary action per screen.

## Child safety & privacy (hard rules)

- No ads, accounts, analytics, crash reporters, or network calls. All assets bundled.
- Progress is stored only in AsyncStorage (`services/progressStore.ts`).
- Anything for adults (parent screen, external links, reset) sits behind the parent
  gate (`app/parent/_layout.tsx`). External links must use `ParentGatedLink`-style
  gating; none exist in v1.
- No microphone/camera/location permissions (blocked in `app.json`).

## Code style

- TypeScript strict, function components, named exports (screens use default export
  as expo-router requires).
- Styles via `StyleSheet.create` at the bottom of the file, values from `theme`.
- Keep components small; game-private pieces go in `src/games/<id>/parts/`.
- Progress data is versioned (`schemaVersion`); bump it and add a `migrate` step for
  any shape change. Never drop a child's stars.
