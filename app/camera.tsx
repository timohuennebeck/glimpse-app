import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwitchCamera, X, Zap } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useCapture } from '@/features/camera/hooks/use-capture';
import { ShutterButton } from '@/features/camera/components/shutter-button';
/**
 * Screen `02 Kamera` — the viewfinder for a real trade. (The onboarding
 * practice shot, `02b`, is its own screen: `(onboarding)/first-glimpse.tsx`.)
 *
 * One shot, no retake from here: the mock has no gallery picker, matching the
 * positioning note's "one shot, no retake, no camera roll upload".
 */
export default function CameraScreen() {
  // The widget deep-links to `glimpse://camera?trade=<id>`: this capture answers
  // that frosted moment rather than starting a fresh one.
  const { trade } = useLocalSearchParams<{ trade?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  const capture = useCapture(cameraRef, (uri) => {
    // A widget deep link names the trade in the URL; the in-app path set it
    // on the draft before opening the camera.
    composer.set({ uri, facing, replyToTradeId: trade ?? composer.replyToTradeId });
    router.push('/compose');
  });

  /** Abandoning the capture drops the draft, so a stale reply target cannot hijack the next fresh one. */
  function close() {
    composer.reset();
    router.back();
  }

  // `null` means the permission is still being read; a black frame beats a
  // "not allowed" screen that flashes on every open.
  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    // Safe-area insets are runtime values, so they stay as style.
    return (
      <View
        className="flex-1 justify-center gap-[18px] bg-black px-7"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <StatusBar style="light" />
        <Text variant="display" className="text-center text-white">
          {t('camera.permissionTitle')}
        </Text>
        <Text variant="bodySm" className="text-center text-on-dark-text">
          {permission.canAskAgain ? t('camera.permissionBody') : t('camera.permissionSettingsBody')}
        </Text>
        <Button
          label={permission.canAskAgain ? t('onboarding.camera.cta') : t('camera.openSettings')}
          variant="purple"
          // Once the system stops asking, the only way back in is Settings.
          onPress={permission.canAskAgain ? requestPermission : () => void Linking.openSettings()}
        />
        <Button label={t('common.back')} variant="ghost" onPress={close} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      {/* CameraView is not registered with NativeWind's cssInterop, so it keeps a plain style. */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      {/* Top and bottom scrims, matching the mock's two-stop gradient. */}
      <LinearGradient
        colors={['rgba(0,0,0,.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.72)']}
        locations={[0, 0.26, 0.58, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <View
        className="absolute inset-0 justify-between px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
      >
        <View className="h-8 flex-row items-center">
          <GlassButton size={32} onDark onPress={close} accessibilityLabel={t('common.close')}>
            <X size={11} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
        </View>

        <View className="items-center gap-5">
          <View className="w-full flex-row items-center justify-between px-[26px]">
            <GlassButton
              size={50}
              onDark
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              accessibilityLabel={t('camera.flipLabel')}
            >
              <SwitchCamera size={22} color={colors.white} strokeWidth={2} />
            </GlassButton>

            <ShutterButton onPress={capture} />

            <GlassButton
              size={50}
              onDark
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              accessibilityLabel={t('camera.flashLabel')}
              accessibilityState={{ selected: flash === 'on' }}
            >
              <Zap size={22} color={flash === 'on' ? colors.purpleSoft : colors.white} strokeWidth={2} />
            </GlassButton>
          </View>

          <Text variant="buttonSm" weight="medium" className="text-on-dark-text">
            {t('camera.hint')}
          </Text>
        </View>
      </View>
    </View>
  );
}
