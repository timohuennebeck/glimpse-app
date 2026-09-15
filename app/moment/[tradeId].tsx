import { useEffect, useMemo } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { LockedIcon, CameraIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { BLUR } from '@/shared/ui/locked-image';
import { t } from '@/shared/i18n/i18n';
import { COMMON, MOMENT } from '@/shared/i18n/keys';
import { relativeTime, timeUntilUnlock } from '@/shared/lib/format';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { markTradeSeen } from '@/features/moments/data/moments-api';
/**
 * Screens `04 Moment geöffnet` and `04b Moment verschwommen`.
 *
 * These are the same screen in two states, which is the point: the frosted
 * version is not an error or an empty state, it is the photo, withheld. The only
 * way forward is the camera.
 */
export default function MomentScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>();
  const { data, loading } = useInbox();
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();

  const moment = useMemo(() => data.find((m) => m.tradeId === tradeId), [data, tradeId]);

  // Opening the frosted card stamps it as seen, so the sender can tell it
  // landed. This is a genuine side effect of viewing, not a fetch — hence the
  // one `useEffect` on this screen.
  const markSeen = useMutation({
    mutationFn: markTradeSeen,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey }),
  });
  // Primitive deps only: the refetch after invalidation yields a new object
  // for the same moment, which must not stamp it a second time.
  const found = moment !== undefined;
  const seenAt = moment?.seenAt;
  const { mutate } = markSeen;
  useEffect(() => {
    if (tradeId && found && !seenAt) mutate(tradeId);
  }, [tradeId, found, seenAt, mutate]);

  // Before the inbox has loaded (deep link, cold start) there is no moment yet.
  // The chrome still renders so the screen is never a black box with no way out.
  if (!moment) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        {/* Safe-area insets are runtime values, so they stay as style. */}
        <View className="absolute inset-0 px-4" style={{ paddingTop: insets.top + 6 }}>
          <View className="mt-4 flex-row items-center gap-3">
            <View className="min-w-0 flex-1 gap-0.5">
              {!loading ? (
                <Text variant="bodySm" className="text-on-dark-text">
                  {t(MOMENT.NOT_FOUND)}
                </Text>
              ) : null}
            </View>
            <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
              <X size={12} color={colors.white} strokeWidth={2.2} />
            </GlassButton>
          </View>
        </View>
      </View>
    );
  }

  const locked = !moment.isOpen;
  const countdown = timeUntilUnlock(moment.autoUnlockAt);

  const tradeBack = () => {
    composer.set({ replyToTradeId: moment.tradeId });
    router.push('/camera');
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <Image
        source={moment.photo}
        className="absolute inset-0"
        contentFit="cover"
        blurRadius={locked ? BLUR.full : 0}
      />
      <LinearGradient
        colors={
          locked
            ? ['rgba(0,0,0,.62)', 'rgba(0,0,0,.18)', 'rgba(0,0,0,.22)', 'rgba(0,0,0,.8)']
            : ['rgba(0,0,0,.62)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.78)']
        }
        locations={[0, 0.24, 0.46, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <View
        className="absolute inset-0 px-4"
        style={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }}
      >
        <View className="mt-4 flex-row items-center gap-3">
          <Avatar source={moment.from.avatarUrl} name={moment.from.name} size={52} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text variant="rowTitle" className="text-white">
              {moment.from.name}
            </Text>
            <Text variant="metaXs" className="text-on-dark-text-soft">
              {relativeTime(moment.capturedAt)}
            </Text>
          </View>
          <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
            <X size={12} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
        </View>

        {locked ? (
          <View className="flex-1 items-center justify-center gap-4 pb-[60px]">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-[36px] border border-[rgba(255,255,255,.28)] bg-on-dark-fill">
              <LockedIcon size={28} />
            </View>
            <Text variant="cardTitleLg" className="text-center text-white">
              {t(MOMENT.LOCKED_TITLE)}
            </Text>
            <Text variant="bodyXs" className="max-w-[250px] text-center text-on-dark-text">
              {t(MOMENT.LOCKED_BODY, { name: moment.from.name })}
            </Text>
            {countdown ? (
              <Text variant="caption" className="text-center text-on-dark-text-faint">
                {t(MOMENT.AUTO_UNLOCK, { time: countdown })}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View className="flex-1" />
            {moment.caption ? (
              <Text variant="bodyLg" className="mb-4 px-1 text-white">
                {moment.caption}
              </Text>
            ) : null}
          </>
        )}

        {/* Reply bar. The camera button is the primary action in both states. */}
        <View className="flex-row items-center gap-2.5 px-1">
          <BlurView
            intensity={30}
            tint="dark"
            className="h-[52px] flex-1 justify-center overflow-hidden rounded-pill border border-on-dark-border px-5"
          >
            <TextInput
              placeholder={t(MOMENT.REPLY_PLACEHOLDER)}
              placeholderTextColor={alpha.onDarkTextSoft}
              className="p-0 font-sans text-[15.5px] text-white"
              editable={!locked}
            />
          </BlurView>
          <Pressable
            onPress={tradeBack}
            accessibilityRole="button"
            accessibilityLabel={t(MOMENT.LOCKED_CTA)}
            className="h-[52px] w-[52px] items-center justify-center rounded-[26px] bg-purple active:opacity-85"
          >
            <CameraIcon size={22} lensColor={colors.purple} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
