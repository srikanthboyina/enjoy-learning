// Minimal drag-and-drop for kids' games: <DragDropProvider> around a scene,
// <DropZone id> targets, and <Draggable onDrop> items (which can also be tapped).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { motion } from '../theme';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragDropApi {
  register: (id: string, view: View) => void;
  unregister: (id: string) => void;
  hitTest: (x: number, y: number) => Promise<string | null>;
}

const Ctx = createContext<DragDropApi | null>(null);

/** Extra forgiveness around drop zones for small fingers. */
const SLOP = 24;

function measure(view: View): Promise<Rect> {
  return new Promise((resolve) =>
    view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })),
  );
}

export function DragDropProvider({ children }: { children: ReactNode }) {
  const zones = useRef(new Map<string, View>());

  const api = useMemo<DragDropApi>(
    () => ({
      register: (id, view) => zones.current.set(id, view),
      unregister: (id) => zones.current.delete(id),
      // Measure at drop time so scrolling or layout changes never leave stale rects.
      hitTest: async (x, y) => {
        const entries = Array.from(zones.current.entries());
        const rects = await Promise.all(entries.map(([, v]) => measure(v)));
        let best: { id: string; dist: number } | null = null;
        rects.forEach((r, i) => {
          const inside =
            x >= r.x - SLOP && x <= r.x + r.width + SLOP && y >= r.y - SLOP && y <= r.y + r.height + SLOP;
          if (!inside) return;
          const dist = Math.hypot(x - (r.x + r.width / 2), y - (r.y + r.height / 2));
          if (!best || dist < best.dist) best = { id: entries[i][0], dist };
        });
        return (best as { id: string } | null)?.id ?? null;
      },
    }),
    [],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function useDragDrop(): DragDropApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('Draggable/DropZone must be inside <DragDropProvider>');
  return api;
}

interface DropZoneProps {
  id: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function DropZone({ id, children, style, accessibilityLabel }: DropZoneProps) {
  const { register, unregister } = useDragDrop();
  const ref = useRef<View>(null);
  useEffect(() => {
    if (ref.current) register(id, ref.current);
    return () => unregister(id);
  }, [id, register, unregister]);
  return (
    <View ref={ref} style={style} accessibilityLabel={accessibilityLabel} collapsable={false}>
      {children}
    </View>
  );
}

interface DraggableProps {
  children: ReactNode;
  /** Return true to accept the drop; false springs the item back. */
  onDrop: (zoneId: string | null) => boolean;
  /** Tapping is an alternative to dragging (easier for younger kids). */
  onTap?: () => void;
  onDragStart?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Draggable({
  children,
  onDrop,
  onTap,
  onDragStart,
  disabled = false,
  style,
  accessibilityLabel,
}: DraggableProps) {
  const { hitTest } = useDragDrop();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const lifted = useSharedValue(0);

  const settle = useCallback(
    async (x: number, y: number) => {
      const zone = await hitTest(x, y);
      const accepted = onDrop(zone);
      if (accepted) {
        tx.value = 0;
        ty.value = 0;
      } else {
        tx.value = withSpring(0, motion.spring);
        ty.value = withSpring(0, motion.spring);
      }
      scale.value = withSpring(1, motion.spring);
      lifted.value = 0;
    },
    [hitTest, onDrop, tx, ty, scale, lifted],
  );

  const handleStart = useCallback(() => onDragStart?.(), [onDragStart]);
  const handleTap = useCallback(() => onTap?.(), [onTap]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(4)
    .onStart(() => {
      lifted.value = 1;
      scale.value = withSpring(1.2, motion.spring);
      scheduleOnRN(handleStart);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      scheduleOnRN(settle, e.absoluteX, e.absoluteY);
    });

  const tap = Gesture.Tap()
    .enabled(!disabled && !!onTap)
    .onEnd(() => {
      scheduleOnRN(handleTap);
    });

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    zIndex: lifted.value ? 100 : 1,
  }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View
        style={[animated, style]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onAccessibilityTap={onTap}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
