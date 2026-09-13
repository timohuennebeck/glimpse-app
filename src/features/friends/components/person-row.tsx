import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';
import { VerifiedIcon } from '@/shared/ui/icons';
import { colors } from '@/shared/theme/colors';
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
}: PersonRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Avatar source={avatar} size={size} dimmed={dimmed} ring="halo" />
      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text variant="rowTitleSm" color={colors.ink} numberOfLines={1}>
            {name}
          </Text>
          {verified ? <VerifiedIcon size={15} /> : null}
        </View>
        {subtitle ? (
          <View style={styles.subtitleRow}>
            {subtitleIcon}
            <Text variant="meta" color={colors.mutedViolet} numberOfLines={1} style={styles.flex}>
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  text: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flex: { flex: 1 },
});
