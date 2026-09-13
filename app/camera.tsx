import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { CloseIcon, FlipCameraIcon, FlashIcon } from '@/shared/ui/icons';
import { alpha, colors } from '@/shared/theme/colors';
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
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  const capture = useCapture(cameraRef, (uri) => {
    composer.set({ uri, facing });
    router.push('/compose');
  });

  if (!permission?.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style="light" />
        <Text variant="display" color={colors.white} center>
          {t('camera.permissionTitle')}
        </Text>
        <Text variant="bodySm" color={alpha.onDarkText} center>
          {t('camera.permissionBody')}
        </Text>
        <Button label={t('onboarding.camera.cta')} variant="purple" onPress={requestPermission} />
        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      {/* Top and bottom scrims, matching the mock's two-stop gradient. */}
      <LinearGradient
        colors={['rgba(0,0,0,.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.72)']}
        locations={[0, 0.26, 0.58, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.chrome, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.topRow}>
          <GlassButton size={32} onDark onPress={() => router.back()} accessibilityLabel={t('common.close')}>
            <CloseIcon size={11} color={colors.white} />
          </GlassButton>
        </View>

        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <GlassButton
              size={50}
              onDark
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              accessibilityLabel={t('camera.flipLabel')}
            >
              <FlipCameraIcon size={22} />
            </GlassButton>

            <ShutterButton onPress={capture} />

            <GlassButton
              size={50}
              onDark
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              accessibilityLabel={t('camera.flashLabel')}
            >
              <FlashIcon size={22} color={flash === 'on' ? colors.purpleSoft : colors.white} />
            </GlassButton>
          </View>

          <Text variant="buttonSm" color={alpha.onDarkText} style={styles.hint}>
            {t('camera.hint')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  permission: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 18,
  },
  chrome: { ...StyleSheet.absoluteFill, paddingHorizontal: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  controls: { alignItems: 'center', gap: 20 },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 26,
  },
  hint: { fontWeight: '500' },
});
