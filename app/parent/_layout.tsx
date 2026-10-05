// Everything under /parent is for adults and sits behind the parent gate.
import { Redirect, Stack, useSegments } from 'expo-router';

import { useParentGate } from '../../src/services/parentGate';
import { colors } from '../../src/theme';

export default function ParentLayout() {
  const unlocked = useParentGate((s) => s.unlocked);
  const segments = useSegments() as string[];
  const onGate = segments[segments.length - 1] === 'gate';
  if (!unlocked && !onGate) return <Redirect href="/parent/gate" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.card } }} />;
}
