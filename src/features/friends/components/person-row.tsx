import { ReactNode } from 'react';
import { AccessibilityRole, AccessibilityState, Pressable, View } from 'react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';
import { VerifiedIcon } from '@/shared/ui/icons';
import { avatarSize } from '@/shared/theme/page-structure';
export interface PersonRowProps {
  avatar: string | number;
  name: string;
  subtitle?: string;
  /** Purple rosette next to the name. */
  verified?: boolean;
  /** Trailing control: a button, a checkbox, a status pill. */
  trailing?: ReactNode;
  dimmed?: boolean;
  size?: number;
  onPress?: () => void;
  /** Optional leading icon rendered inline before the subtitle. */
  subtitleIcon?: ReactNode;
  /** Set when the row itself is a selection control (recipient checkbox). */
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
}

/**
 * The list row used by friends, requests, recipients and search — one component,
 * because the mock draws all four identically apart from the trailing control.
 */
export function PersonRow({
  avatar,
  name,
  subtitle,
  verified,
  trailing,
  dimmed,
  size = avatarSize.row,
  onPress,
  subtitleIcon,
  accessibilityRole,
  accessibilityState,
}: PersonRowProps) {
  return (
    <Pressable
      className="flex-row items-center gap-[13px]"
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={accessibilityRole ?? (onPress ? 'button' : undefined)}
      accessibilityState={accessibilityState}
      accessibilityLabel={name}
    >
      <Avatar source={avatar} size={size} dimmed={dimmed} ring="halo" />
      <View className="min-w-0 flex-1 gap-[3px]">
        <View className="flex-row items-center gap-1.5">
          <Text variant="rowTitleSm" className="text-ink" numberOfLines={1}>
            {name}
          </Text>
          {verified ? <VerifiedIcon size={15} /> : null}
        </View>
        {subtitle ? (
          <View className="flex-row items-center gap-[5px]">
            {subtitleIcon}
            <Text variant="meta" className="flex-1 text-muted-violet" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}
