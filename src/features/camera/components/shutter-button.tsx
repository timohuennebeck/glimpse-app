import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
interface ShutterButtonProps {
  onPress: () => void;
}

/** The 84px ring-and-disc shutter from the mock's viewfinder. */
export function ShutterButton({ onPress }: ShutterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('camera.shutterLabel')}
      style={({ pressed }) => [styles.shutter, pressed && styles.pressed]}
    >
      <View style={styles.inner} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  inner: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.white },
});
