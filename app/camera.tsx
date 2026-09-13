import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, GlassButton, Text, CloseIcon, FlipCameraIcon, FlashIcon } from '@/shared/ui';
import { alpha, colors } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { useComposer } from '@/features/moments';

/**
 * Screens `02 Kamera` and `02b First glimpse` — the same viewfinder; `02b` is
 * simply the first time you reach it during onboarding.
 *
 * One shot, no retake from here: the mock has no gallery picker, matching the
 * positioning note's "one shot, no retake, no camera roll upload".
 */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  async function capture() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (photo?.uri) {
        composer.set({ uri: photo.uri, facing: facing === 'front' ? 'front' : 'back' });
        router.push('/compose');
      }
    } finally {
      setBusy(false);
    }
  }

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

            <Pressable
              onPress={capture}
              accessibilityRole="button"
              accessibilityLabel={t('camera.shutterLabel')}
              style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
            >
              <View style={styles.shutterInner} />
            </Pressable>

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
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { opacity: 0.7 },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.white },
  hint: { fontWeight: '500' },
});
