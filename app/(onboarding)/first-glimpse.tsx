import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { CloseIcon, FlipCameraIcon } from '@/shared/ui/icons';
import { alpha, colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useCapture } from '@/features/camera/hooks/use-capture';
import { ShutterButton } from '@/features/camera/components/shutter-button';
/**
 * Screen `02b First glimpse` — step 2.5 of onboarding.
 *
 * This used to be a bare `<Redirect href="/camera" />`, which broke the flow:
 * the app camera exits to compose -> recipients -> feed and never returns here,
 * so steps 3-7 of onboarding were unreachable. It is now its own screen that
 * takes a practice shot and continues to the avatar step.
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

  const capture = useCapture(cameraRef, (uri) => {
    setShot(uri);
    composer.set({ uri, facing });
  });

  function next() {
    router.push('/(onboarding)/avatar');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {shot ? (
        <Image source={{ uri: shot }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        // No camera (denied, or a simulator): the step still has to be passable.
        <View style={styles.noCamera} />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,.55)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.72)']}
        locations={[0, 0.26, 0.58, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.chrome, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.topRow}>
          <GlassButton size={32} onDark onPress={() => router.back()} accessibilityLabel={t('common.back')}>
            <CloseIcon size={11} color={colors.white} />
          </GlassButton>
        </View>

        <View style={styles.controls}>
          {shot ? (
            <>
              <Text variant="buttonSm" color={alpha.onDarkText} style={styles.hint}>
                {t('onboarding.firstGlimpse.hint')}
              </Text>
              <View style={styles.ctaRow}>
                <Button label={t('compose.retake')} variant="outline" size="sm" onPress={() => setShot(null)} style={styles.flex} />
                <Button label={t('common.next')} variant="purple" size="sm" onPress={next} style={styles.flex} />
              </View>
            </>
          ) : granted ? (
            <>
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

                {/* Spacer keeps the shutter centred. */}
                <View style={styles.spacer} />
              </View>
              <Text variant="buttonSm" color={alpha.onDarkText} style={styles.hint}>
                {t('camera.hint')}
              </Text>
            </>
          ) : (
            <>
              <Text variant="bodySm" color={alpha.onDarkText} center style={styles.denied}>
                {t('camera.permissionBody')}
              </Text>
              <Button label={t('common.next')} variant="purple" size="sm" onPress={next} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.black },
  noCamera: { ...StyleSheet.absoluteFill, backgroundColor: '#141019' },
  chrome: { ...StyleSheet.absoluteFill, paddingHorizontal: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  controls: { gap: 20 },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
  },
  spacer: { width: 50 },
  hint: { fontWeight: '500', textAlign: 'center' },
  ctaRow: { flexDirection: 'row', gap: 12 },
  denied: { maxWidth: 280, alignSelf: 'center' },
});
