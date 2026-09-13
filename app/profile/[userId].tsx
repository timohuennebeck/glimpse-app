import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CameraIcon, CloseIcon, FilterIcon, MoreIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { memberSince } from '@/shared/lib/format';
import { PairGrid } from '@/features/profile/components/pair-grid';
import { fetchPairs } from '@/features/moments/data/moments-api';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { type MomentPair } from '@/features/moments/interfaces';
import { demoProfiles } from '@/shared/lib/fixtures';
/**
 * Screens `07 Profil` and `07b Profil · 2 Paare pro Reihe`.
 *
 * The two artboards differ only in grid density, so `perRow` selects between
 * them; 2-per-row is the default since it is the later iteration in the mock.
 */
export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const profile = demoProfiles[userId ?? 'mia'] ?? demoProfiles.mia;
  const composer = useComposer();
  const [pairs, setPairs] = useState<MomentPair[]>([]);

  useEffect(() => {
    void fetchPairs(profile.id).then(setPairs);
  }, [profile.id]);

  return (
    <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
      <View style={styles.header}>
        <GlassButton size={44} onPress={() => router.back()}>
          <CloseIcon size={15} color={colors.inkSoft} />
        </GlassButton>
        <Image source={profile.photo} style={styles.avatar} contentFit="cover" />
        <GlassButton size={44}>
          <MoreIcon size={20} color={colors.inkSoft} />
        </GlassButton>
      </View>

      <View style={styles.identity}>
        <Text variant="title" color={colors.ink}>
          {profile.display_name}
        </Text>
        <Text variant="body" color={colors.mutedGrey}>
          {profile.tagline || memberSince(profile.created_at)}
        </Text>
      </View>

      <Button
        label={t('profile.tradeCta')}
        size="md"
        style={styles.cta}
        icon={<CameraIcon size={22} lensColor={colors.ink} />}
        onPress={() => {
          composer.set({ recipientIds: [profile.id] });
          router.push('/camera');
        }}
      />

      <View style={styles.sectionRow}>
        <Text variant="section" color={colors.ink}>
          {t('profile.momentsTitle')}
        </Text>
        <GlassButton size={36}>
          <FilterIcon size={20} />
        </GlassButton>
      </View>

      {pairs.length > 0 ? (
        <PairGrid
          pairs={pairs}
          perRow={2}
          onPressPhoto={(pairId, side) => router.push(`/photo/${pairId}-${side}`)}
        />
      ) : (
        <Text variant="bodySm" color={colors.mutedLilac} center style={styles.empty}>
          {t('profile.pairsEmpty')}
        </Text>
      )}
    </Screen>
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
  },
  empty: { marginTop: 32 },
});
