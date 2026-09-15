import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoreHorizontal, X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, MOMENT, PHOTO } from '@/shared/i18n/keys';
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
  const { data: moment, isPending } = useQuery({
    ...queries.moments.photo(momentId ?? ''),
    enabled: Boolean(momentId),
  });

  return (
    <View className="flex-1 bg-black-deep">
      <StatusBar style="light" />
      {moment ? <Image source={moment.photo} className="absolute inset-0" contentFit="cover" /> : null}
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.45)']}
        locations={[0, 0.22, 0.78, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <View
        className="absolute inset-0 flex-row items-start justify-between px-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <GlassButton size={40} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={12} color={colors.white} strokeWidth={2.2} />
        </GlassButton>

        <View className="min-w-0 flex-1 flex-row items-center gap-[9px] px-3">
          {moment?.fromAvatarUrl ? (
            <Avatar source={moment.fromAvatarUrl} name={moment.fromName} size={52} />
          ) : null}
          <Text variant="subtitle" weight="medium" className="shrink text-on-dark-text" numberOfLines={1}>
            {moment
              ? t(PHOTO.META, { name: moment.fromName, date: pairDate(moment.capturedAt) })
              : isPending
                ? ''
                : t(MOMENT.NOT_FOUND)}
          </Text>
        </View>

        <GlassButton size={40} onDark accessibilityLabel={t(COMMON.MORE)}>
          <MoreHorizontal size={19} color={colors.white} strokeWidth={2.4} />
        </GlassButton>
      </View>
    </View>
  );
}
