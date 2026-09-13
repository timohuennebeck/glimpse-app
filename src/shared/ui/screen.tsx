import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
interface ScreenProps {
  children: ReactNode;
  /** Background fill. Dark screens also flip the status-bar content to light. */
  background?: string;
  dark?: boolean;
  /** Horizontal gutter; the mock uses 20 almost everywhere, 18/22 on a few screens. */
  gutter?: number;
  /** Wrap children in a ScrollView. Off for camera / viewer screens. */
  scroll?: boolean;
  /** Extra bottom padding above the home indicator. */
  bottomInset?: number;
  style?: ViewStyle;
  /** Render outside the padded content flow (full-bleed images, overlays). */
  backdrop?: ReactNode;
}

/**
 * The artboard draws a 72px band above content to clear the notch and status
 * bar. On device we substitute the real top inset plus the 12px the mock leaves
 * between the status row and the first element.
 */
export function Screen({
  children,
  background = colors.white,
  dark = false,
  gutter = spacing.gutter,
  scroll = false,
  bottomInset = 0,
  style,
  backdrop,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, RNStatusBar.currentHeight ?? 0) + 12;
  const paddingBottom = Math.max(insets.bottom, 12) + bottomInset;

  const content = (
    <View style={[styles.flex, { paddingHorizontal: gutter }, style]}>{children}</View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: background }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
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
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
