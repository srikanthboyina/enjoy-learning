import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import type { GameProps } from '../../engine/types';
import { DragDropProvider, Draggable, DropZone } from '../../kit/DragDrop';
import { Glyph } from '../../kit/Glyph';
import { playSound } from '../../services/sound';
import { colors, radii, sizes, spacing } from '../../theme';
import { Thermometer } from './parts/Thermometer';
import { applyTool, STATES, TOOLS, type MatterRound, type MatterState, type Tool } from './schema';
import { changeWords, needWords } from './words';
import { Text } from '../../kit/Text';

type ChangeRound = Extract<MatterRound, { mode: 'change' }>;
type PredictRound = Extract<MatterRound, { mode: 'predict' }>;

const TOOL_GLYPH = { heat: 'fire', cool: 'snow' } as const;
const TOOL_COLOR = { heat: '#FFE3E3', cool: '#E7F5FF' } as const;
const STATE_BG: Record<MatterState, string> = { ice: '#E7F5FF', water: '#D0EBFF', steam: '#F1F3F5' };

export function MatterGame(props: GameProps<MatterRound>) {
  return props.round.mode === 'change' ? (
    <Change {...props} round={props.round} />
  ) : (
    <Predict {...props} round={props.round} />
  );
}

/* ---------- change: drag the substance onto heat or cold ---------- */

function Change({ round, onAttempt, onRoundComplete, speak, hintActive }: GameProps<ChangeRound>) {
  const [state, setState] = useState<MatterState>(round.start);
  const [done, setDone] = useState(false);
  const tools = round.tools ?? TOOLS;
  const rank = (s: MatterState) => STATES.indexOf(s);
  const rightTool: Tool = rank(round.goal) > rank(state) ? 'heat' : 'cool';

  const use = (tool: Tool) => {
    if (done) return;
    const next = applyTool(state, tool);
    const closer = Math.abs(rank(round.goal) - rank(next)) < Math.abs(rank(round.goal) - rank(state));
    setState(next);
    if (next === round.goal) {
      setDone(true);
      speak(changeWords(state, next, tool));
      onAttempt(true);
      onRoundComplete();
    } else if (closer) {
      // a correct first step on a two-step change (ice → water → steam)
      playSound('pop');
      speak(`${changeWords(state, next, tool)} Keep going!`);
    } else {
      onAttempt(false, {
        hint: { say: `${changeWords(state, next, tool)} ${needWords(next, round.goal)}`, icons: [TOOL_GLYPH[tool], round.goal] },
      });
    }
  };

  return (
    <DragDropProvider>
      <View style={styles.change}>
        <View style={styles.goalRow} accessibilityLabel={`Make ${round.goal}`}>
          <Glyph id={round.start} size={40} accessible={false} />
          <Text style={styles.arrow}>➜</Text>
          <View style={styles.goalBox}>
            <Glyph id={round.goal} size={48} accessible={false} />
          </View>
        </View>

        <View style={styles.middle}>
          <Thermometer state={state} />
          <View style={[styles.stage, { backgroundColor: STATE_BG[state] }]}>
            <Draggable
              key={state}
              disabled={done}
              accessibilityLabel={`${state}, drag to heat or cold`}
              onDrop={(zone) => {
                if (zone !== 'heat' && zone !== 'cool') return false;
                use(zone);
                return true;
              }}
              style={styles.substance}>
              <Animated.View entering={ZoomIn.springify()}>
                <Glyph id={state} size={sizes.bigGlyph * 1.4} accessible={false} />
              </Animated.View>
            </Draggable>
          </View>
        </View>

        <View style={styles.tools}>
          {tools.map((tool) => (
            <DropZone key={tool} id={tool} style={styles.toolZone}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tool === 'heat' ? 'Heat' : 'Cold'}
                onPress={() => use(tool)}
                style={[
                  styles.tool,
                  { backgroundColor: TOOL_COLOR[tool] },
                  hintActive && tool === rightTool && styles.toolHint,
                ]}>
                <Glyph id={TOOL_GLYPH[tool]} size={56} accessible={false} />
              </Pressable>
            </DropZone>
          ))}
        </View>
      </View>
    </DragDropProvider>
  );
}

/* ---------- predict: what happens if we heat / cool it? ---------- */

function Predict({ round, onAttempt, onRoundComplete, hintActive }: GameProps<PredictRound>) {
  const [tried, setTried] = useState<MatterState[]>([]);
  const answer = applyTool(round.start, round.tool);

  const choose = (s: MatterState) => {
    playSound('tap');
    if (s === answer) {
      onAttempt(true);
      onRoundComplete();
      return;
    }
    setTried((t) => (t.includes(s) ? t : [...t, s]));
    onAttempt(false, {
      hint: {
        say: round.tool === 'heat' ? 'Heat makes things melt and turn to steam.' : 'Cold makes things freeze.',
        icons: [TOOL_GLYPH[round.tool], round.start],
      },
    });
  };

  return (
    <View style={styles.predict}>
      <View style={styles.equation}>
        <View style={[styles.card, { backgroundColor: STATE_BG[round.start] }]}>
          <Glyph id={round.start} size={46} />
        </View>
        <Text style={styles.plus}>+</Text>
        <View style={[styles.card, { backgroundColor: TOOL_COLOR[round.tool] }]}>
          <Glyph id={TOOL_GLYPH[round.tool]} size={46} />
        </View>
        <Text style={styles.plus}>=</Text>
        <View style={styles.card}>
          <Glyph id="question" size={46} />
        </View>
      </View>
      {hintActive && <Thermometer state={round.start} />}
      <View style={styles.choices}>
        {STATES.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={s}
            onPress={() => choose(s)}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: STATE_BG[s] },
              tried.includes(s) && styles.tried,
              pressed && styles.pressed,
            ]}>
            <Glyph id={s} size={64} accessible={false} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  change: { flex: 1, justifyContent: 'space-between', gap: spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  arrow: { fontSize: 32, color: colors.inkSoft },
  goalBox: {
    borderWidth: 4,
    borderColor: colors.sky,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.card,
  },
  middle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, zIndex: 2 },
  stage: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  substance: { padding: spacing.md },
  tools: { flexDirection: 'row', justifyContent: 'space-around', gap: spacing.md, zIndex: 1 },
  toolZone: { flex: 1 },
  tool: {
    height: sizes.bigTouch + 24,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.line,
  },
  toolHint: { borderColor: colors.sunshine, borderWidth: 6 },
  predict: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly' },
  equation: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  card: { borderRadius: radii.md, padding: spacing.sm, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.line },
  plus: { fontSize: 32, fontWeight: '900', color: colors.inkSoft },
  choices: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  choice: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.line,
  },
  tried: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.95 }], borderColor: colors.sky },
});
