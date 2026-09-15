import { ReactNode } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { CameraIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, PROFILE } from '@/shared/i18n/keys';
import type { Profile } from '@/shared/lib/database.types';
import { PairGrid } from '@/features/profile/components/pair-grid';
import { queries } from '@/shared/lib/queries';
interface ProfileViewProps {
  profile: Profile & { photo: number };
  /** Line under the name: a tagline, or "Trading since …". */
  subtitle: string;
  /** Top-left control: a close button on a friend's profile, a spacer on your own. */
  leading: ReactNode;
  onPressTrade: () => void;
}

/**
 * Header, identity, trade CTA and pair grid — shared by your own profile (the
 * tab) and a friend's profile (pushed from the feed). The two artboards differ
 * only in the top-left control and where the CTA sends you.
 */
export function ProfileView({ profile, subtitle, leading, onPressTrade }: ProfileViewProps) {
  // A failed fetch leaves the grid in its empty state rather than crashing the screen.
  const { data: pairs = [] } = useQuery(queries.moments.pairs(profile.id));

  return (
    <>
      <View className="flex-row items-start justify-between">
        {leading}
        <Image
          source={profile.photo}
          className="-mt-1 h-[104px] w-[104px] rounded-[52px] border-[3px] border-white"
          contentFit="cover"
        />
        <GlassButton size={44} accessibilityLabel={t(COMMON.MORE)}>
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

      <Button
        label={t(PROFILE.TRADE_CTA)}
        size="md"
        className="mt-4"
        icon={<CameraIcon size={22} lensColor={colors.ink} />}
        onPress={onPressTrade}
      />

      <SectionHeading title={t(PROFILE.MOMENTS_TITLE)} className="mb-3.5 mt-4" />

      {pairs.length > 0 ? (
        <PairGrid pairs={pairs} onPressPhoto={(momentId) => router.push(`/photo/${momentId}`)} />
      ) : (
        <Text variant="bodySm" className="mt-8 text-center text-muted-lilac">
          {t(PROFILE.PAIRS_EMPTY)}
        </Text>
      )}
    </>
  );
}
