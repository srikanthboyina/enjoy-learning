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
| `src/kit/` | Reusable kid-friendly UI: `BigButton`, `Glyph`, `Text` (Fredoka font), `Gradient`, `Mascot` (Ollie the owl), `Bob`, `Confetti`, drag-and-drop, feedback. |
| `src/services/` | `speech`, `sound`, `progressStore`, `parentGate`. |
| `src/theme/` | Colours, spacing, sizes, motion. Use tokens, not literals. |
| `src/assets-map.ts` | `GlyphId` → picture (emoji in v1) + spoken name. |

Import boundaries: a game may import from `engine/`, `kit/`, `services/`, `theme/`,
`assets-map` — **never from another game**, never from `app/`. Files imported by
`scripts/` (`schema.ts`, `schemas.ts`, `assets-map.ts`, `engine/types.ts`,
`engine/contentSchema.ts`) must stay free of React Native imports.

## Content (levels) rules

- Topics on the home screen are in `content/topics.json` (`id`, `gameId`, `subject`,
  `title`, `emoji`, `blurb`, `colors` = two-stop gradient). Many topics can share one
  game; most use the data-driven **explore** engine.
- One file per topic: `content/<topicId>.levels.json` with
  `{ topicId, gameId, version: 1, levels }`. Files are auto-discovered
  (`require.context` in `src/engine/loadContent.ts`); no import needed.
- Each level: `id` (unique, e.g. `addition-03`), `difficulty` (`simple` | `medium` |
  `complex`), `order` (within its difficulty), `name`, `intro` prompt, optional
  `stars`, and up to 10 `rounds`. Every level is open; kids choose their difficulty.
- Level pattern the owner likes: **explain → worked examples → questions**. Start with
  1–3 lesson rounds, then questions that carry `explain` (why the answer is right) and
  `why` on wrong options (gentle, never "wrong").
- Round shapes are defined by the game's zod schema in `src/games/<gameId>/schema.ts`.
  The TS type is `z.infer` of that schema. Never hand-write a duplicate type.
- A topic with no levels file shows as "Soon".
- Invalid levels are logged and skipped at runtime; `npm run validate:content` must
  pass before a change is done.

### The explore engine (`src/games/explore/`)

Round modes: `show` (lesson picture + narration + ▶), `choice` (2–4 cards), `sort`
(drag or tap things into 2–3 boxes), `order` (tap cards in sequence), `grow` (water and
sun grow a plant). Pictures come from `visual` kinds: `emoji`, `text`, `groups`, `take`,
`sequence`, `clock`, `shapes`, `pairs`, `sizes`, `numberline`. To add a topic that fits
these, write only JSON. Add a new visual kind or mode in `schema.ts` +
`parts/Visual.tsx` / `ExploreGame.tsx` when a topic needs one.

## Mini-game contract

A game component renders **one round** and receives `GameProps<TRound>`
(`src/engine/types.ts`). It:

- calls `onAttempt(correct)` for each answer it judges (never shows its own error UI),
- calls `onRoundComplete()` once solved,
- may call `speak(prompt)` for in-game narration (e.g. counting aloud),
- reads `hintActive` to show visual help.

**Lesson steps.** A level can teach before it tests: put "watch and learn" rounds
(explanations, worked examples) first and have the definition's `isLesson(round)`
return true for them. The game shows the example with a ▶️ button that calls
`onRoundComplete()`; GameShell moves on without praise or scoring. The round's
prompt (its narration) is spoken automatically. See `src/games/compare/`.

It never touches storage, navigation, scoring, stars, or sounds for right/wrong;
`GameShell` owns those. Remount per round is guaranteed (`key={roundIndex}`), so
round state can live in `useState`.

### Adding a topic

1. `src/games/<id>/schema.ts` (zod round schema), `<Name>Game.tsx`, `index.ts`.
2. Add the id to `GAME_IDS` in `src/engine/contentSchema.ts` (if new), the schema to
   `src/games/schemas.ts`, the definition to `src/games/registry.ts`.
3. `content/<topicId>.levels.json` + an entry in `content/topics.json`.
4. `npm run check`.

For a topic that fits the explore engine, only step 3 is needed.

## Child-focused UX rules

- **Minimal reading.** Every instruction is a `Prompt` = spoken `say` + `icons`.
  Kids never need to read; text is only a small label.
- **Voice** goes through `services/speech.ts` (respects the parent's mute setting).
- **Touch targets ≥ `sizes.touch` (64dp).** Use `BigButton` for anything tappable.
- **Never say "wrong".** Mistakes get a soft wiggle, a gentle sound and phrases from
  `engine/phrases.ts`. A round can't be failed; hints appear after 2 mistakes.
- **Motion** respects reduced motion (`useReducedMotion`): swap big movement for fades.
- Bright colours from `theme` (`gradients`, topic `colors`); one primary action per screen.
- Always import `Text` from `src/kit/Text` (not react-native) so the rounded font applies.

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
