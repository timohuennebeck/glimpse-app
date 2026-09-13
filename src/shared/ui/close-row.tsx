import { StyleSheet, View, ViewStyle } from 'react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon } from '@/shared/ui/icons';
interface CloseRowProps {
  onPress: () => void;
  style?: ViewStyle;
}

/** The lone close button that tops the screens outside the numbered onboarding steps. */
export function CloseRow({ onPress, style }: CloseRowProps) {
  return (
    <View style={[styles.row, style]}>
      <GlassButton size={32} onPress={onPress}>
        <CloseIcon size={11} />
      </GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 32 },
});
