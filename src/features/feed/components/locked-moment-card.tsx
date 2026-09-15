import { Pressable, View } from 'react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CameraIcon } from '@/shared/ui/icons';
import { LockedImage } from '@/shared/ui/locked-image';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { relativeTime, timeUntilUnlock } from '@/shared/lib/format';
import { t } from '@/shared/i18n/i18n';
import { FEED } from '@/shared/i18n/keys';
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
    <View className="gap-[13px] rounded-card border-[1.5px] border-border-faint bg-surface p-3.5">
      <Pressable className="flex-row items-center gap-[11px]" onPress={onPressCard}>
        <Avatar source={moment.from.avatarUrl} name={moment.from.name} size={46} ring="halo" />
        <View className="min-w-0 flex-1">
          <Text variant="cardTitle" className="text-ink-strong">
            {moment.from.name}
          </Text>
          <Text variant="meta" className="text-muted-grey">
            {relativeTime(moment.capturedAt)}
          </Text>
        </View>
        <View className="rounded-pill bg-surface-violet-deep px-3 py-1.5">
          <Text variant="metaSm" weight="semibold" className="text-purple-ink">
            {t(FEED.LOCKED_BADGE)}
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={onPressCard}>
        {/*
          The mock drew this 16:10, but a moment is a phone photo — always portrait.
          4:5 keeps the card from eating the whole screen the way 3:4 or 9:16 would.
        */}
        <LockedImage source={moment.photo} radius={radius.thumbSm} className="aspect-[4/5] w-full" />
      </Pressable>

      {moment.caption ? (
        <Text variant="bodySm" className="text-ink-soft" numberOfLines={2}>
          {moment.caption}
        </Text>
      ) : null}

      <Button
        label={t(FEED.LOCKED_CTA)}
        onPress={onPressTrade}
        size="xs"
        icon={<CameraIcon size={21} lensColor={colors.ink} />}
      />

      {countdown ? (
        <Text variant="caption" className="text-center text-muted-lilac">
          {t(FEED.UNLOCK_HINT, { time: countdown })}
        </Text>
      ) : null}
    </View>
  );
}
