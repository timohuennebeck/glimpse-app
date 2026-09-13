import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button, CameraIcon, FilterIcon, GlassButton, MoreIcon, Screen, Text } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { memberSince } from '@/shared/lib/format';
import { PairGrid } from '@/features/profile/components/PairGrid';
import { fetchPairs, type MomentPair } from '@/features/moments';
import { demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/clearance';

/** Your own profile — the Profile tab. */
export default function OwnProfileScreen() {
  const me = demoProfiles[DEMO_USER_ID];
  const [pairs, setPairs] = useState<MomentPair[]>([]);

  useEffect(() => {
    void fetchPairs(me.id).then(setPairs);
  }, [me.id]);

  return (
    <Screen
      scroll
      gutter={spacing.gutterTight}
      bottomInset={spacing.contentBottom + TAB_BAR_CLEARANCE}
    >
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Image source={me.photo} style={styles.avatar} contentFit="cover" />
        <GlassButton size={44}>
          <MoreIcon size={20} color={colors.inkSoft} />
        </GlassButton>
      </View>

      <View style={styles.identity}>
        <Text variant="title" color={colors.ink}>
          {me.display_name}
        </Text>
        <Text variant="body" color={colors.mutedGrey}>
          {memberSince(me.created_at)}
        </Text>
      </View>

      <Button
        label={t('profile.tradeCta')}
        size="md"
        style={styles.cta}
        icon={<CameraIcon size={22} lensColor={colors.ink} />}
        onPress={() => router.push('/camera')}
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
        <PairGrid pairs={pairs} perRow={2} onPressPhoto={(id, side) => router.push(`/photo/${id}-${side}`)} />
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
  spacer: { width: 44 },
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
