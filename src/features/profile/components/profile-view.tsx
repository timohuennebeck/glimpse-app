import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CameraIcon, MoreIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import type { Profile } from '@/shared/lib/database.interfaces';
import { PairGrid } from '@/features/profile/components/pair-grid';
import { fetchPairs } from '@/features/moments/data/moments-api';
import type { MomentPair } from '@/features/moments/interfaces';
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
  const [pairs, setPairs] = useState<MomentPair[]>([]);

  useEffect(() => {
    // A failed fetch must not escape as an unhandled rejection; the grid falls
    // back to its empty state.
    fetchPairs(profile.id)
      .then(setPairs)
      .catch((error: unknown) => {
        if (__DEV__) console.warn('fetchPairs failed', error);
        setPairs([]);
      });
  }, [profile.id]);

  return (
    <>
      <View style={styles.header}>
        {leading}
        <Image source={profile.photo} style={styles.avatar} contentFit="cover" />
        <GlassButton size={44} accessibilityLabel={t('common.more')}>
          <MoreIcon size={20} color={colors.inkSoft} />
        </GlassButton>
      </View>

      <View style={styles.identity}>
        <Text variant="title" color={colors.ink}>
          {profile.display_name}
        </Text>
        <Text variant="body" color={colors.mutedGrey}>
          {subtitle}
        </Text>
      </View>

      <Button
        label={t('profile.tradeCta')}
        size="md"
        style={styles.cta}
        icon={<CameraIcon size={22} lensColor={colors.ink} />}
        onPress={onPressTrade}
      />

      <SectionHeading title={t('profile.momentsTitle')} style={styles.sectionRow} />

      {pairs.length > 0 ? (
        <PairGrid pairs={pairs} onPressPhoto={(momentId) => router.push(`/photo/${momentId}`)} />
      ) : (
        <Text variant="bodySm" color={colors.mutedLilac} center style={styles.empty}>
          {t('profile.pairsEmpty')}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginTop: -4,
    borderWidth: 3,
    borderColor: colors.white,
  },
  identity: { alignItems: 'center', gap: 4, marginTop: 14 },
  cta: { marginTop: 16 },
  sectionRow: { marginTop: 16, marginBottom: 14 },
  empty: { marginTop: 32 },
});
