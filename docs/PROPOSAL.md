# Edu Learn Games: v1 architecture proposal

Status: **approved 2026-10-05**.

Stack: Expo SDK 57 (latest stable, `expo@57.0.x`), expo-router, TypeScript (strict),
react-native-reanimated 4 + react-native-gesture-handler, expo-speech (voice),
expo-audio (sound effects), @react-native-async-storage/async-storage (local
progress; uses localStorage on web), zustand (state + persistence), zod (validates
level data files). No backend, no analytics, no network calls.

---

## 1. Folder structure

```
edu-learn-games/
├── app/                              # expo-router screens (thin; no game logic here)
│   ├── _layout.tsx                   # providers: gestures, theme, audio, progress hydration
│   ├── index.tsx                     # World map: one island per topic
│   ├── topic/[topicId].tsx           # Level picker for a topic (stars per level)
│   ├── play/[topicId]/[levelId].tsx  # Loads the level + mounts the game inside <GameShell>
│   └── parent/
│       ├── _layout.tsx               # Redirects to gate unless unlocked this session
│       ├── gate.tsx                  # Parent gate (adult-only challenge)
│       └── index.tsx                 # Progress dashboard, reset progress, settings
│
├── content/                          # ← EDIT THESE TO ADD LEVELS. Pure data, no code.
│   ├── topics.json                   # Topics on the world map (order, colour, icon, game)
│   ├── counting.levels.json
│   ├── fractions.levels.json
│   ├── matter.levels.json
│   └── plants.levels.json
│
├── src/
│   ├── games/                        # One folder per mini-game
│   │   ├── registry.ts               # gameId → GameDefinition (the only place to register)
│   │   ├── counting/
│   │   │   ├── index.ts              # exports the GameDefinition
│   │   │   ├── schema.ts             # zod schema + TS type for this game's level params
│   │   │   ├── CountingGame.tsx      # the interactive game component
│   │   │   └── parts/                # game-private components (e.g. Basket, FruitItem)
│   │   ├── fractions/ …
│   │   ├── matter/ …
│   │   └── plants/ …
│   │
│   ├── engine/                       # Shared game runtime, game-agnostic
│   │   ├── types.ts                  # GameDefinition, GameProps, LevelResult, etc.
│   │   ├── GameShell.tsx             # header, voice replay, hint, feedback, round flow, stars
│   │   ├── useRounds.ts              # round sequencing + mistake/hint counting
│   │   ├── scoring.ts                # mistakes/hints → 0–3 stars
│   │   └── loadContent.ts            # reads + validates content/*.json via each game's schema
│   │
│   ├── kit/                          # Reusable kid-friendly building blocks
│   │   ├── Draggable.tsx             # gesture-handler + reanimated drag with snap-back
│   │   ├── DropZone.tsx              # registers a target rect; highlights on hover
│   │   ├── DragDropProvider.tsx      # hit-testing between Draggables and DropZones
│   │   ├── BigButton.tsx             # ≥ 64dp touch target, press animation, sound
│   │   ├── IconPrompt.tsx            # renders a row of instruction icons
│   │   ├── SpeakButton.tsx           # replays the spoken instruction
│   │   ├── Feedback.tsx              # gentle "try again" wiggle / celebration burst
│   │   └── StarRow.tsx, Badge.tsx
│   │
│   ├── services/
│   │   ├── speech.ts                 # expo-speech wrapper (rate/pitch for kids, mute setting)
│   │   ├── sound.ts                  # preloaded SFX: tap, pop, success, gentle-retry
│   │   └── progressStore.ts          # zustand + persist(AsyncStorage), versioned schema
│   │
│   ├── theme/                        # colours, spacing, typography, motion durations
│   └── assets-map.ts                 # IconId / spriteId → require('...') lookup
│
├── assets/
│   ├── images/                       # sprites (apple, pizza, ice cube, seed, …)
│   ├── icons/                        # instruction icons (tap, drag, heat, cool, water, sun…)
│   └── sounds/
├── scripts/validate-content.ts       # `npm run validate:content` checks every JSON file
└── CLAUDE.md                         # conventions (step 2)
```

Rules this layout enforces:
- `app/` screens only route and compose. Game logic lives in `src/games/<id>/`.
- `content/` holds only data. Adding a level never touches code.
- A game may import from `engine/`, `kit/`, `services/`, `theme/`, but never from another game.

---

## 2. Level data model

### 2.1 Shared types (`src/engine/types.ts`)

```ts
export type GameId = 'counting' | 'fractions' | 'matter' | 'plants';
export type Subject = 'math' | 'science';

/** An instruction is always speech + icons, never text alone. */
export interface Prompt {
  say: string;          // spoken by expo-speech; also used as accessibilityLabel
  icons: IconId[];      // e.g. ['drag', 'apple', 'basket'] shown as a picture sentence
}

export interface StarRule {
  /** max mistakes (wrong attempts) allowed for 3 / 2 stars; finishing = 1 star */
  three: number;
  two: number;
}

export interface LevelBase<TRound> {
  id: string;           // unique within the game, e.g. "counting-03"
  order: number;        // display + unlock order (1-based)
  name: string;         // short label for the parent screen only (kids see icons)
  intro: Prompt;        // spoken when the level opens
  stars?: StarRule;     // defaults to { three: 0, two: 2 }
  rounds: TRound[];     // a level = 3–6 short rounds
}

export interface LevelFile<TRound> {
  gameId: GameId;
  version: 1;
  levels: LevelBase<TRound>[];
}

export interface Topic {
  id: string;            // route param, e.g. "counting"
  gameId: GameId;
  subject: Subject;
  title: string;         // spoken on tap, shown small
  icon: IconId;
  color: string;         // theme token name, e.g. "sunshine"
  mapPosition: { x: number; y: number };   // 0–1 relative position on the world map
  unlockAfter?: string;  // topic id; omitted = always open
}
```

### 2.2 Per-game round shapes

Each game owns a zod schema in `src/games/<id>/schema.ts`; the TS type is inferred
from it, so the JSON and the code can't drift.

```ts
// counting: tap or drag N objects into a basket / match a number to a group
type CountingRound =
  | { mode: 'collect'; target: number; item: SpriteId; available: number; prompt?: Prompt }
  | { mode: 'match';   groups: number[]; showNumeral: number; item: SpriteId; prompt?: Prompt };

// fractions: cut a shape into equal parts, or pick which picture shows the fraction
type FractionsRound =
  | { mode: 'split'; shape: 'pizza' | 'cake'; parts: 2 | 3 | 4 | 6 | 8; prompt?: Prompt }
  | { mode: 'pick';  shape: 'pizza' | 'cake'; target: { num: number; den: number };
      choices: { num: number; den: number }[]; prompt?: Prompt };

// matter: drag a substance onto heat/cool to reach a goal state
type MatterState = 'ice' | 'water' | 'steam';
type MatterRound = {
  start: MatterState;
  goal: MatterState;               // ice→steam needs two heat steps
  tools: ('heat' | 'cool')[];      // which tools are on screen
  prompt?: Prompt;
};

// plants: order life-cycle cards, or grow a plant by giving the right care
type PlantStage = 'seed' | 'sprout' | 'plant' | 'flower';
type PlantsRound =
  | { mode: 'order'; stages: PlantStage[]; shuffled: true; prompt?: Prompt }
  | { mode: 'grow';  needs: { water: number; sun: number };   // taps of each per stage
      tooMuchWater?: boolean;                                // level 4+: overwatering droops
      prompt?: Prompt };
```

### 2.3 JSON shape (example: `content/counting.levels.json`)

```json
{
  "gameId": "counting",
  "version": 1,
  "levels": [
    {
      "id": "counting-01",
      "order": 1,
      "name": "Count to 3",
      "intro": { "say": "Put the apples in the basket!", "icons": ["drag", "apple", "basket"] },
      "rounds": [
        { "mode": "collect", "target": 2, "item": "apple", "available": 4 },
        { "mode": "collect", "target": 3, "item": "apple", "available": 5 },
        { "mode": "collect", "target": 1, "item": "star",  "available": 3 }
      ]
    },
    {
      "id": "counting-02",
      "order": 2,
      "name": "Count to 5",
      "intro": { "say": "How many? Drag that many!", "icons": ["ear", "drag", "basket"] },
      "stars": { "three": 0, "two": 2 },
      "rounds": [
        { "mode": "collect", "target": 4, "item": "fish", "available": 6 },
        { "mode": "match", "groups": [3, 5, 2], "showNumeral": 5, "item": "ball" }
      ]
    }
  ]
}
```

`content/topics.json`:

```json
[
  { "id": "counting",  "gameId": "counting",  "subject": "math",    "title": "Counting",  "icon": "numbers", "color": "sunshine", "mapPosition": { "x": 0.2, "y": 0.3 } },
  { "id": "fractions", "gameId": "fractions", "subject": "math",    "title": "Fractions", "icon": "pizza",   "color": "tomato",   "mapPosition": { "x": 0.7, "y": 0.25 } },
  { "id": "matter",    "gameId": "matter",    "subject": "science", "title": "Ice, Water, Steam", "icon": "drop", "color": "sky", "mapPosition": { "x": 0.3, "y": 0.7 } },
  { "id": "plants",    "gameId": "plants",    "subject": "science", "title": "Growing Plants",   "icon": "sprout", "color": "leaf", "mapPosition": { "x": 0.75, "y": 0.7 } }
]
```

Unlocking: level *n* opens when level *n−1* has at least 1 star. Topics are all open
unless `unlockAfter` is set.

### 2.4 Progress data (stored on device only)

```ts
interface ProgressV1 {
  schemaVersion: 1;
  levels: Record<string /* `${gameId}/${levelId}` */, {
    bestStars: 0 | 1 | 2 | 3;
    attempts: number;
    lastPlayedAt: number;      // epoch ms
    bestMistakes: number;
  }>;
  badges: string[];            // e.g. "counting-complete", "all-three-stars-matter"
  settings: { voice: boolean; sounds: boolean; speechRate: number };
}
```

Saved under one AsyncStorage key (`edu-learn-games/progress`), with a `migrate`
function so future versions don't wipe a child's stars. The parent screen reads
this to show per-topic completion, stars, time of last play and a "reset progress"
button.

---

## 3. Reusable mini-game pattern

### 3.1 The contract

```ts
// src/engine/types.ts
export interface GameProps<TRound> {
  round: TRound;                 // the current round (GameShell owns sequencing)
  roundIndex: number;
  /** Report each attempt. GameShell plays gentle feedback / counts mistakes. */
  onAttempt: (correct: boolean, opts?: { hint?: Prompt }) => void;
  /** Call once the round is solved. GameShell celebrates and advances. */
  onRoundComplete: () => void;
  speak: (p: Prompt) => void;    // voice + icon banner, respects mute setting
  showHint: () => void;          // games can expose a level-appropriate hint
}

export interface GameDefinition<TRound> {
  id: GameId;
  roundSchema: z.ZodType<TRound>;              // validates content JSON
  Component: React.ComponentType<GameProps<TRound>>;
  defaultRoundPrompt: (round: TRound) => Prompt; // used when a round has no prompt
  hintFor?: (round: TRound) => Prompt;
}
```

### 3.2 Who does what

| `GameShell` (shared, written once) | Game component (one per topic) |
|---|---|
| Loads level, speaks intro, shows icon prompt | Renders the scene for **one round** |
| Speaker button to replay voice, hint button | Handles taps / drags with `kit/` pieces |
| Counts mistakes + hints, computes stars | Decides if an attempt is right, calls `onAttempt` |
| Encouraging feedback ("Almost! Let's try again" + wiggle, never "wrong") | Animates the concept itself (ice melting, pizza splitting) |
| Round transitions, end-of-level celebration, star + badge award | Calls `onRoundComplete` when solved |
| Writes result to `progressStore` | Never touches storage, routing or scoring |

### 3.3 A game in practice (sketch)

```tsx
// src/games/counting/index.ts
export const countingGame: GameDefinition<CountingRound> = {
  id: 'counting',
  roundSchema: CountingRoundSchema,
  Component: CountingGame,
  defaultRoundPrompt: (r) =>
    r.mode === 'collect'
      ? { say: `Put ${r.target} in the basket`, icons: ['drag', r.item, 'basket'] }
      : { say: `Find the group with ${r.showNumeral}`, icons: ['tap', 'numbers'] },
};

// src/games/registry.ts
export const games = { counting: countingGame, fractions: fractionsGame,
                       matter: matterGame, plants: plantsGame } satisfies Record<GameId, GameDefinition<any>>;
```

### 3.4 Adding a new topic later

1. Create `src/games/<new>/` with `schema.ts`, the component, and `index.ts`.
2. Add one line to `src/games/registry.ts` (and the id to `GameId`).
3. Add `content/<new>.levels.json` and an entry in `content/topics.json`.
4. Run `npm run validate:content`.

Adding a **level** to an existing topic is step 3 only: edit the JSON.

---

## 4. Cross-cutting decisions (defaults I'm picking; tell me to change any)

- **Parent gate:** a multiplication question read aloud is too guessable; instead,
  "press and hold these 3 numbers in order" shown as written words (e.g. "seven, two,
  nine"). Unlock lasts until the app goes to background. Also guards any external link
  and the reset button.
- **Feedback tone:** mistakes trigger a soft wiggle + "Let's try again!" voice. After 2
  mistakes on a round, the hint auto-shows. A round can never be failed outright.
- **Stars:** finish = 1★, ≤ `two` mistakes = 2★, ≤ `three` mistakes = 3★. Hints count
  as half a mistake. A badge per topic for finishing all levels, plus one for all 3★.
- **Accessibility:** touch targets ≥ 64dp, every interactive element has an
  `accessibilityLabel` from its prompt, respects reduced-motion (reanimated
  `useReducedMotion`) by swapping big animations for fades.
- **Web:** drag-and-drop uses gesture-handler, which works with mouse and touch on web.
  Speech uses the browser's Web Speech API through expo-speech.
- **Privacy:** no network permissions used, no analytics or crash SDKs, no fonts or
  images fetched at runtime (all bundled).
- **Assets:** v1 uses simple bundled SVG/PNG illustrations and a small set of free-licence
  sound effects; artwork can be swapped later via `assets-map.ts`.
- **Levels per game:** 4 levels each to start (within your 3–5), easy → harder:
  - Counting: 1–3 → 1–5 → 1–10 with distractors → match numeral to group
  - Fractions: split in halves → thirds/quarters → pick ½ ¼ ¾ → compare two fractions
  - Matter: ice→water → water→steam/back → ice→steam (two steps) → "what happens if…" pick
  - Plants: order 3 stages → order 4 stages → grow with water+sun → grow without over-watering
- **Location:** built in `/mnt/project-files/edu-learn-games/` unless you add a GitHub
  repo in Project settings, in which case I'll push there instead.
