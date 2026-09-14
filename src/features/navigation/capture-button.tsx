import { Platform, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { CameraIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/clearance';
/**
 * The capture action, floating to the right of the native tab bar.
 *
 * Not a tab: a viewfinder is a modal task rather than a destination, and as a
 * floating button it stays reachable from every tab.
 *
 * Rendered per-screen because a native tab bar has no slot to inject a sibling
 * view into.
 */
export function CaptureButton() {
  const native = isLiquidGlassAvailable();
  const composer = useComposer();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.tradeCta')}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // A fresh moment: drop whatever an abandoned reply left in the draft.
        composer.reset();
        router.push('/camera');
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {native ? (
        <GlassView glassEffectStyle="regular" isInteractive tintColor={colors.purple} style={styles.fill}>
          <CameraIcon size={24} lensColor={colors.purple} />
        </GlassView>
      ) : (
        <CameraIcon size={24} lensColor={colors.purple} />
      )}
    </Pressable>
  );
}

const SIZE = 56;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 18,
    bottom: TAB_BAR_CLEARANCE + (Platform.OS === 'ios' ? 6 : 12),
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.cta,
  },
  fill: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
