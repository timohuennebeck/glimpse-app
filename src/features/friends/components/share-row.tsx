import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Link2 } from 'lucide-react-native';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
export interface ShareAction {
  label: string;
  icon: ReactNode;
  /** Omitted for actions that are not wired yet; they then render as plain views. */
  onPress?: () => void;
}

interface ShareRowProps {
  /** Label on the hairline above ("or share"). */
  dividerLabel: string;
  /** Your invite link and the caption under it. */
  link: string;
  linkLabel: string;
  /** Round icon buttons to the right of the link. */
  actions: ShareAction[];
  className?: string;
}

/** "or share": your link plus a couple of round share actions (friend search, onboarding). */
export function ShareRow({ dividerLabel, link, linkLabel, actions, className }: ShareRowProps) {
  return (
    <View className={cn('gap-[18px]', className)}>
      <Divider label={dividerLabel} />
      <View className="flex-row items-start gap-2.5">
        <View className="min-w-0 flex-1 items-center gap-1.5">
          <View className="h-field-sm w-full flex-row items-center gap-2 rounded-pill border-[1.6px] border-border px-3.5">
            <Link2 size={16} color={colors.mutedLilac} strokeWidth={2} />
            <Text variant="subtitle" className="flex-1 text-ink-soft" numberOfLines={1}>
              {link}
            </Text>
          </View>
          <Text variant="captionXs" className="text-muted">
            {linkLabel}
          </Text>
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.label}
            className="items-center gap-1.5"
            onPress={action.onPress}
            disabled={!action.onPress}
            accessibilityRole={action.onPress ? 'button' : undefined}
            accessibilityLabel={action.label}
          >
            {/* `controlHeight.fieldSm` (42) is only a height token, so the width is spelled out. */}
            <View className="h-field-sm w-[42px] items-center justify-center rounded-full bg-surface-lilac">
              {action.icon}
            </View>
            <Text variant="captionXs" className="text-muted">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
