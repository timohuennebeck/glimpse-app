import { View } from 'react-native';
import { X } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { GlassButton } from '@/shared/ui/glass-button';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
interface CloseRowProps {
  onPress: () => void;
  className?: string;
}

/** The lone close button that tops the screens outside the numbered onboarding steps. */
export function CloseRow({ onPress, className }: CloseRowProps) {
  return (
    <View className={cn('h-8 flex-row items-center', className)}>
      <GlassButton size={32} onPress={onPress} accessibilityLabel={t('common.close')}>
        <X size={11} color={colors.inkFaint} strokeWidth={2.2} />
      </GlassButton>
    </View>
  );
}
