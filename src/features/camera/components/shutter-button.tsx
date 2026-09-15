import { Pressable, View } from 'react-native';
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
      className="h-[84px] w-[84px] items-center justify-center rounded-[42px] border-[5px] border-white active:opacity-70"
    >
      <View className="h-[66px] w-[66px] rounded-[33px] bg-white" />
    </Pressable>
  );
}
