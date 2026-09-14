import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon, MoreIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { pairDate } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';

/**
 * Screen `07c Foto Vollbild` — an unlocked moment, full bleed.
 *
 * Resolves the moment by id rather than searching the inbox: photos opened
 * from a profile's pair grid are not in the inbox.
 */
export default function PhotoScreen() {
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const insets = useSafeAreaInsets();
  const { data: moment } = useQuery({ ...queries.moments.photo(momentId ?? ''), enabled: Boolean(momentId) });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {moment ? <Image source={moment.photo} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.45)']}
        locations={[0, 0.22, 0.78, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.chrome, { paddingTop: insets.top + 12 }]}>
        <GlassButton size={40} onDark onPress={() => router.back()} accessibilityLabel={t('common.close')}>
          <CloseIcon size={12} color={colors.white} />
        </GlassButton>

        <View style={styles.meta}>
          {moment?.fromAvatar ? <Avatar source={moment.fromAvatar} size={52} /> : null}
          <Text variant="subtitle" color={alpha.onDarkText} style={styles.metaText} numberOfLines={1}>
            {moment ? t('photo.meta', { name: moment.fromName, date: pairDate(moment.capturedAt) }) : ''}
          </Text>
        </View>

        <GlassButton size={40} onDark accessibilityLabel={t('common.more')}>
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
  meta: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  metaText: { fontWeight: '500', flexShrink: 1 },
});
