import { StyleSheet, View, ViewStyle } from 'react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon } from '@/shared/ui/icons';
import { t } from '@/shared/i18n/i18n';
interface CloseRowProps {
  onPress: () => void;
  style?: ViewStyle;
}

/** The lone close button that tops the screens outside the numbered onboarding steps. */
export function CloseRow({ onPress, style }: CloseRowProps) {
  return (
    <View style={[styles.row, style]}>
      <GlassButton size={32} onPress={onPress} accessibilityLabel={t('common.close')}>
        <CloseIcon size={11} />
      </GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 32 },
});
