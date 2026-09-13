import { View } from 'react-native';
import { colors } from '@/shared/theme';

/**
 * Placeholder for the Camera tab.
 *
 * The tab's `tabPress` listener in `_layout.tsx` intercepts the press and opens
 * the full-screen `/camera` modal, so this is never actually shown. It exists
 * because a tab needs a route.
 */
export default function CameraTabPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: colors.white }} />;
}
