import { StyleSheet, View, ViewStyle } from 'react-native';
import { CheckIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
interface CheckCircleProps {
  checked: boolean;
  size?: number;
  style?: ViewStyle;
}

/** Circular selection mark: a grey ring when off, a purple disc with a tick when on. */
export function CheckCircle({ checked, size = 26, style }: CheckCircleProps) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        checked && styles.on,
        style,
      ]}
    >
      {checked ? <CheckIcon size={12} strokeWidth={2.6} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.8,
    borderColor: colors.swatchGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.purpleDeep, borderColor: colors.purpleDeep },
});
