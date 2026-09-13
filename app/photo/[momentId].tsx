import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, GlassButton, CloseIcon, MoreIcon, Text } from '@/shared/ui';
import { alpha, colors } from '@/shared/theme';
import { pairDate } from '@/shared/lib/format';
import { useInbox } from '@/features/moments';
import { PHOTOS } from '@/shared/lib/fixtures';

/** Screen `07c Foto Vollbild` — an unlocked moment, full bleed. */
export default function PhotoScreen() {
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const { data } = useInbox();
  const insets = useSafeAreaInsets();

  const moment = useMemo(() => data.find((m) => m.momentId === momentId), [data, momentId]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={moment?.photo ?? PHOTOS.momentOpen}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.45)']}
        locations={[0, 0.22, 0.78, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.chrome, { paddingTop: insets.top + 12 }]}>
        <GlassButton size={40} onDark onPress={() => router.back()}>
          <CloseIcon size={12} color={colors.white} />
        </GlassButton>

        <View style={styles.meta}>
          <Avatar source={moment?.from.avatar ?? ''} size={52} />
          <Text variant="subtitle" color={alpha.onDarkText} style={styles.metaText}>
            {moment ? `${moment.from.name} · ${pairDate(moment.capturedAt)}` : ''}
          </Text>
        </View>

        <GlassButton size={40} onDark>
          <MoreIcon size={19} color={colors.white} />
        </GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blackDeep },
  chrome: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  metaText: { fontWeight: '500' },
});
