import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SwitchCamera, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { CAMERA, COMMON, COMPOSE, ONBOARDING } from '@/shared/i18n/keys';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useCapture } from '@/features/camera/hooks/use-capture';
import { ShutterButton } from '@/features/camera/components/shutter-button';
/**
 * Screen `02b First glimpse` — step 2.5 of onboarding.
 *
 * Its own screen rather than a redirect to `/camera`: the app camera exits to
 * compose -> recipients -> feed and never returns, which would leave steps 3-7
 * unreachable. This takes a practice shot and continues to the avatar step.
 *
 * The shot is kept in the composer draft so the thank-you step can offer it as
 * the user's first real trade.
 */
export default function FirstGlimpseScreen() {
  const [permission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [shot, setShot] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  const granted = permission?.granted ?? false;

  const capture = useCapture(cameraRef, ({ uri, width, height }) => {
    setShot(uri);
    composer.set({ uri, width, height });
  });

  function next() {
    router.push('/(onboarding)/avatar');
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {shot ? (
        <Image source={{ uri: shot }} className="absolute inset-0" contentFit="cover" />
      ) : granted ? (
        // CameraView is not registered with NativeWind's cssInterop, so it keeps a style.
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        // No camera (denied, or a simulator): the step still has to be passable.
        <View className="absolute inset-0 bg-[#141019]" />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.72)']}
        locations={[0, 0.26, 0.58, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <View
        className="absolute inset-0 justify-between px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
      >
        <View className="h-8 flex-row items-center">
          <GlassButton size={32} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.BACK)}>
            <X size={11} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
        </View>

        <View className="gap-5">
          {shot ? (
            <>
              <Text variant="buttonSm" weight="medium" className="text-center text-on-dark-text">
                {t(ONBOARDING.FIRST_GLIMPSE.HINT)}
              </Text>
              <View className="flex-row gap-3">
                <Button
                  label={t(COMPOSE.RETAKE)}
                  variant="outline"
                  size="sm"
                  onPress={() => setShot(null)}
                  className="flex-1"
                />
                <Button label={t(COMMON.NEXT)} variant="purple" size="sm" onPress={next} className="flex-1" />
              </View>
            </>
          ) : granted ? (
            <>
              <View className="flex-row items-center justify-between px-[26px]">
                <GlassButton
                  size={50}
                  onDark
                  onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                  accessibilityLabel={t(CAMERA.FLIP_LABEL)}
                >
                  <SwitchCamera size={22} color={colors.white} strokeWidth={2} />
                </GlassButton>

                <ShutterButton onPress={capture} />

                {/* Spacer keeps the shutter centred. */}
                <View className="w-[50px]" />
              </View>
              <Text variant="buttonSm" weight="medium" className="text-center text-on-dark-text">
                {t(CAMERA.HINT)}
              </Text>
            </>
          ) : (
            <>
              <Text variant="bodySm" className="max-w-[280px] self-center text-center text-on-dark-text">
                {t(CAMERA.PERMISSION_BODY)}
              </Text>
              <Button label={t(COMMON.NEXT)} variant="purple" size="sm" onPress={next} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}
