import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/ui/text';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
interface ProgressHeaderProps {
  /** 1-based step index. */
  step: number;
  onClose?: () => void;
}

const TOTAL_STEPS = 7;

/** The "1 of 7" onboarding header: close button, track, counter. */
export function ProgressHeader({ step, onClose }: ProgressHeaderProps) {
  const pct = Math.min(100, Math.max(0, (step / TOTAL_STEPS) * 100));

  return (
    <View style={styles.row}>
      <GlassButton size={32} onPress={onClose} accessibilityLabel={t('common.close')}>
        <CloseIcon size={11} />
      </GlassButton>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text variant="subtitle" color={colors.muted}>
        {t('onboarding.stepCounter', { step, total: TOTAL_STEPS })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 32 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.borderLilac,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.purple },
});
