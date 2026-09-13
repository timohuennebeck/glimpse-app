import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  CameraIcon,
  CloseIcon,
  FilterIcon,
  GlassButton,
  MoreIcon,
  Screen,
  Text,
} from '@/shared/ui';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { PairGrid } from '@/features/profile/components/PairGrid';
import { fetchPairs, useComposer, type MomentPair } from '@/features/moments';
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
          {profile.tagline}
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
