import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CameraIcon } from '@/shared/ui/icons';
import { LockedImage } from '@/shared/ui/locked-image';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { relativeTime, timeUntilUnlock } from '@/shared/lib/format';
import { t } from '@/shared/i18n/i18n';
import type { InboxMoment } from '@/features/moments/interfaces';
interface LockedMomentCardProps {
  moment: InboxMoment;
  onPressTrade: () => void;
  onPressCard?: () => void;
}

/**
 * The feed's centrepiece: a received moment you cannot see yet.
 *
 * This card is the product thesis made visible — the photo is present, named,
 * and deliberately withheld. The CTA opens the camera, not the photo.
 */
export function LockedMomentCard({ moment, onPressTrade, onPressCard }: LockedMomentCardProps) {
  const countdown = timeUntilUnlock(moment.autoUnlockAt);

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={onPressCard}>
        <Avatar source={moment.from.avatar ?? ''} size={46} ring="halo" />
        <View style={styles.headerText}>
          <Text variant="cardTitle" color={colors.inkStrong}>
            {moment.from.name}
          </Text>
          <Text variant="meta" color={colors.mutedGrey}>
            {relativeTime(moment.capturedAt)}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text variant="metaSm" color={colors.purpleInk} style={styles.badgeText}>
            {t('feed.lockedBadge')}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={onPressCard}>
        <LockedImage source={moment.photo} radius={radius.thumbSm} style={styles.image} />
      </Pressable>

      {moment.caption ? (
        <Text variant="bodySm" color={colors.inkSoft} numberOfLines={2}>
          {moment.caption}
        </Text>
      ) : null}

      <Button
        label={t('feed.lockedCta')}
        onPress={onPressTrade}
        size="xs"
        icon={<CameraIcon size={21} lensColor={colors.ink} />}
      />

      {countdown ? (
        <Text variant="caption" color={colors.mutedLilac} center>
          {t('feed.unlockHint', { time: countdown })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.borderFaint,
    borderRadius: radius.card,
    padding: 14,
    backgroundColor: colors.surface,
    gap: 13,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerText: { flex: 1, minWidth: 0 },
  badge: {
    backgroundColor: colors.surfaceVioletDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontWeight: '600' },
  // The mock drew this 16:10, but a moment is a phone photo — always portrait.
  // 4:5 keeps the card from eating the whole screen the way 3:4 or 9:16 would.
  image: { width: '100%', aspectRatio: 4 / 5 },
});
