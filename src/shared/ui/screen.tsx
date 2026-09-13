import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
interface ScreenProps {
  children: ReactNode;
  background?: string;
  /** Horizontal gutter; the mock uses 20 almost everywhere, 18/22 on a few screens. */
  gutter?: number;
  /** Wrap children in a ScrollView. Off for camera / viewer screens. */
  scroll?: boolean;
  /** Extra bottom padding above the home indicator. */
  bottomInset?: number;
  /** Render outside the padded content flow (full-bleed images, overlays). */
  backdrop?: ReactNode;
  /**
   * Rendered as a sibling of the scroll view, after it. Absolutely positioned
   * children here stay fixed on screen; inside `children` they would scroll
   * away with the content.
   */
  floating?: ReactNode;
}

/**
 * The artboard draws a 72px band above content to clear the notch and status
 * bar. On device we substitute the real top inset plus the 12px the mock leaves
 * between the status row and the first element.
 */
export function Screen({
  children,
  background = colors.white,
  gutter = spacing.gutter,
  scroll = false,
  bottomInset = 0,
  backdrop,
  floating,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, RNStatusBar.currentHeight ?? 0) + 12;
  const paddingBottom = Math.max(insets.bottom, 12) + bottomInset;

  const content = (
    <View style={[styles.flex, { paddingHorizontal: gutter }]}>{children}</View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: background }]}>
      <StatusBar style="dark" />
      {backdrop}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingTop, paddingBottom, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingTop, paddingBottom }]}>{content}</View>
      )}
      {floating}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
