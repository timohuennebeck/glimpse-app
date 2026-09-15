import { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CameraIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import type { Profile } from '@/shared/lib/database.types';
import type { MomentPair } from '@/features/moments/interfaces';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { PairGrid } from '@/features/profile/components/pair-grid';
interface ProfileViewProps {
  profile: Profile;
  /** Line under the name: a tagline, or "Trading since …". */
  subtitle: string;
  /** Top-left control: a close button on a friend's profile, a spacer on your own. */
  leading: ReactNode;
  /** Passed in rather than fetched: the two screens ask different questions. */
  pairs: MomentPair[];
  /** Omitted when there is no trade to offer — a profile you are not friends with. */
  onPressTrade?: () => void;
  /** Only your own profile has anything behind "more". */
  onPressMore?: () => void;
}

/**
 * Header, identity, trade CTA and pair grid — shared by your own profile (the
 * tab) and a friend's profile (pushed from the feed). The two artboards differ
 * only in the top-left control, what the grid holds, and where the CTA sends you.
 */
export function ProfileView({
  profile,
  subtitle,
  leading,
  pairs,
  onPressTrade,
  onPressMore,
}: ProfileViewProps) {
  return (
    <>
      <View className="flex-row items-start justify-between">
        {leading}
        <Avatar
          source={avatarUrl(profile.avatar_storage_path)}
          name={profile.first_name}
          size={104}
          ring="halo"
          className="-mt-1"
        />
        <GlassButton size={44} onPress={onPressMore} accessibilityLabel={t('common.more')}>
          <MoreHorizontal size={20} color={colors.inkSoft} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View className="mt-3.5 items-center gap-1">
        <Text variant="title" className="text-ink">
          {profile.first_name}
        </Text>
        <Text variant="body" className="text-muted-grey">
          {subtitle}
        </Text>
      </View>

      {onPressTrade ? (
        <Button
          label={t('profile.tradeCta')}
          size="md"
          className="mt-4"
          icon={<CameraIcon size={22} lensColor={colors.ink} />}
          onPress={onPressTrade}
        />
      ) : null}

      <SectionHeading title={t('profile.momentsTitle')} className="mb-3.5 mt-4" />

      {pairs.length > 0 ? (
        <PairGrid pairs={pairs} onPressPhoto={(momentId) => router.push(`/photo/${momentId}`)} />
      ) : (
        <Text variant="bodySm" className="mt-8 text-center text-muted-lilac">
          {t('profile.pairsEmpty')}
        </Text>
      )}
    </>
  );
}
