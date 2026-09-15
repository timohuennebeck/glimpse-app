import { View } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/shared/ui/text';
import { GlassButton } from '@/shared/ui/glass-button';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, ONBOARDING } from '@/shared/i18n/keys';
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
    <View className="h-8 flex-row items-center gap-3">
      <GlassButton size={32} onPress={onClose} accessibilityLabel={t(COMMON.CLOSE)}>
        <X size={11} color={colors.inkFaint} strokeWidth={2.2} />
      </GlassButton>
      <View className="h-1.5 flex-1 overflow-hidden rounded bg-border-lilac">
        <View className="h-full rounded bg-purple" style={{ width: `${pct}%` }} />
      </View>
      <Text variant="subtitle" className="text-muted">
        {t(ONBOARDING.STEP_COUNTER, { step, total: TOTAL_STEPS })}
      </Text>
    </View>
  );
}
