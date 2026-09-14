import { Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { CameraIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/clearance';
/** Sits just above the tab bar; the gap differs per platform's bar height. */
const BOTTOM = TAB_BAR_CLEARANCE + (Platform.OS === 'ios' ? 6 : 12);

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
      className="absolute right-[18px] h-14 w-14 items-center justify-center overflow-hidden rounded-[28px] bg-purple active:scale-[0.96] active:opacity-85"
      // The offset is computed and the shadow has no NativeWind mapping, so both stay a style.
      style={[{ bottom: BOTTOM }, shadow.cta]}
    >
      {native ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          tintColor={colors.purple}
          className="h-14 w-14 items-center justify-center rounded-[28px]"
        >
          <CameraIcon size={24} lensColor={colors.purple} />
        </GlassView>
      ) : (
        <CameraIcon size={24} lensColor={colors.purple} />
      )}
    </Pressable>
  );
}
