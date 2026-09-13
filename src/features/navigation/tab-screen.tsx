import { ReactNode } from 'react';
import { Screen } from '@/shared/ui/screen';
import { spacing } from '@/shared/theme/page-structure';
import { CaptureButton } from '@/features/navigation/capture-button';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/clearance';
interface TabScreenProps {
  children: ReactNode;
  gutter?: number;
}

/**
 * A scrollable tab root: reserves room under the content for the tab bar and
 * mounts the capture button, which a native tab bar has no slot for.
 *
 * The button goes in `floating`, not `children` — as a child it lived inside
 * the ScrollView and was only reachable at the very end of a long feed.
 */
export function TabScreen({ children, gutter }: TabScreenProps) {
  return (
    <Screen
      scroll
      gutter={gutter}
      bottomInset={spacing.contentBottom + TAB_BAR_CLEARANCE}
      floating={<CaptureButton />}
    >
      {children}
    </Screen>
  );
}
