import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { cn } from '@/shared/lib/cn';
import { spacing } from '@/shared/theme/page-structure';
interface ScreenProps {
  children: ReactNode;
  /** Background utility, e.g. `bg-surface-alt` or `bg-transparent`. */
  className?: string;
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
  /**
   * The screen's actions, pinned below the scrolling content and always
   * visible — long content scrolls behind it instead of pushing it around.
   * Rises with the keyboard, so a form's CTA is never hidden under it.
   */
  footer?: ReactNode;
}

/**
 * The artboard draws a 72px band above content to clear the notch and status
 * bar. On device we substitute the real top inset plus the 12px the mock leaves
 * between the status row and the first element.
 */
export function Screen({
  children,
  className = 'bg-white',
  gutter = spacing.gutter,
  scroll = false,
  bottomInset = 0,
  backdrop,
  floating,
  footer,
}: ScreenProps) {
  // Safe-area insets are runtime values, so they stay as style.
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, RNStatusBar.currentHeight ?? 0) + 12;
  const safeBottom = Math.max(insets.bottom, 12);
  // With a pinned footer the content only needs breathing room above it; the
  // footer carries the home-indicator inset itself.
  const paddingBottom = footer ? spacing.footerGap : safeBottom + bottomInset;

  const content = (
    <View className="flex-1" style={{ paddingHorizontal: gutter }}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      className={cn('flex-1', className)}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Boolean(footer)}
    >
      <StatusBar style="dark" />
      {backdrop}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          contentContainerStyle={{ paddingTop, paddingBottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View className="flex-1" style={{ paddingTop, paddingBottom }}>
          {content}
        </View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: gutter, paddingBottom: safeBottom + spacing.footerGap }}>
          {footer}
        </View>
      ) : null}
      {floating}
    </KeyboardAvoidingView>
  );
}
