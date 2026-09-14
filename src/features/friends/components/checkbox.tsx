import { StyleSheet, View } from 'react-native';
import { CheckIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
interface CheckboxProps {
  checked: boolean;
}

/** The 28px circular selection control on the recipients screen. */
export function Checkbox({ checked }: CheckboxProps) {
  return (
    <View style={[styles.base, checked ? styles.checked : styles.unchecked]}>
      {checked ? <CheckIcon size={13} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.purple },
  unchecked: { borderWidth: 1.8, borderColor: colors.borderStrong },
});
