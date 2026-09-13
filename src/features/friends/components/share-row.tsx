import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Divider } from '@/shared/ui/divider';
import { LinkIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { controlHeight, radius } from '@/shared/theme/page-structure';
export interface ShareAction {
  label: string;
  icon: ReactNode;
}

interface ShareRowProps {
  /** Label on the hairline above ("or share"). */
  dividerLabel: string;
  /** Your invite link and the caption under it. */
  link: string;
  linkLabel: string;
  /** Round icon buttons to the right of the link. */
  actions: ShareAction[];
  style?: ViewStyle;
}

/** "or share": your link plus a couple of round share actions (friend search, onboarding). */
export function ShareRow({ dividerLabel, link, linkLabel, actions, style }: ShareRowProps) {
  return (
    <View style={[styles.section, style]}>
      <Divider label={dividerLabel} />
      <View style={styles.row}>
        <View style={styles.linkCol}>
          <View style={styles.link}>
            <LinkIcon size={16} />
            <Text variant="subtitle" color={colors.inkSoft} numberOfLines={1} style={styles.flex}>
              {link}
            </Text>
          </View>
          <Text variant="captionXs" color={colors.muted}>
            {linkLabel}
          </Text>
        </View>

        {actions.map((action) => (
          <View key={action.label} style={styles.action}>
            <View style={styles.circle}>{action.icon}</View>
            <Text variant="captionXs" color={colors.muted}>
              {action.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  linkCol: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  link: {
    width: '100%',
    height: controlHeight.fieldSm,
    borderRadius: radius.pill,
    borderWidth: 1.6,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  action: { alignItems: 'center', gap: 6 },
  circle: {
    width: controlHeight.fieldSm,
    height: controlHeight.fieldSm,
    borderRadius: controlHeight.fieldSm / 2,
    backgroundColor: colors.surfaceLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
