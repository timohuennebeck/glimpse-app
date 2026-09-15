import { useMemo, useState } from 'react';
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
import { relativeTime, timeUntilUnlock } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error-message';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useMarkTradeSeen } from '@/features/moments/data/moments-mutations';
import { draftMessage, useSendMessage } from '@/features/chat/data/chat-mutations';
import { useMe } from '@/features/profile/hooks/use-me';
import { useOncePerKey } from '@/shared/lib/use-once-per-key';
import { useOutbox } from '@/features/moments/hooks/use-outbox';
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

  const moment = useMemo(() => data.find((m) => m.tradeId === tradeId), [data, tradeId]);

  // Opening the frosted card stamps it as seen, so the sender can tell it
  // landed. A genuine side effect of viewing, not a fetch.
  const outbox = useOutbox();
  const { mutate } = useMarkTradeSeen();
  // Keyed by the trade, not by `seenAt`: marking seen patches `seenAt` and a
  // failure rolls it straight back, which used to re-arm this write forever.
  const found = moment !== undefined;
  const seenAt = moment?.seenAt;
  useOncePerKey(tradeId && found && !seenAt ? tradeId : null, () => mutate(tradeId));

  const [reply, setReply] = useState('');
  const { data: me } = useMe();
  const myId = me?.id ?? '';
  // Whoever sent the moment is the partner this reply goes to — useSendMessage
  // takes a partnerId. Not to be confused with draftMessage's `senderId`, which
  // is me.
  const partnerId = moment?.from.id ?? '';
  const sendReply = useSendMessage(partnerId);

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
                  {t('moment.notFound')}
                </Text>
              ) : null}
            </View>
            <GlassButton
              size={34}
              onDark
              onPress={() => router.back()}
              accessibilityLabel={t('common.close')}
            >
              <X size={12} color={colors.white} strokeWidth={2.2} />
            </GlassButton>
          </View>
        </View>
      </View>
    );
  }

  // The cache flips `isOpen` the moment the answer is enqueued, but the server
  // only signs the original once the answer actually lands — until then `photo`
  // is still the 48px blurred rendition. Rendering that at blurRadius 0 showed
  // a smeared blob as the reveal, so keep it frosted while the outbox is still
  // carrying the reply.
  const revealPending = outbox.entries.some((entry) => entry.replyToTradeIds.includes(tradeId ?? ''));
  const locked = !moment.isOpen || revealPending;
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
          <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t('common.close')}>
            <X size={12} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
        </View>

        {locked ? (
          <View className="flex-1 items-center justify-center gap-4 pb-[60px]">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-[36px] border border-[rgba(255,255,255,.28)] bg-on-dark-fill">
              <LockedIcon size={28} />
            </View>
            <Text variant="cardTitleLg" className="text-center text-white">
              {t('moment.lockedTitle')}
            </Text>
            <Text variant="bodyXs" className="max-w-[250px] text-center text-on-dark-text">
              {t('moment.lockedBody', { name: moment.from.name })}
            </Text>
            {countdown ? (
              <Text variant="caption" className="text-center text-on-dark-text-faint">
                {t('moment.autoUnlock', { time: countdown })}
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

        {sendReply.error ? (
          <Text variant="meta" className="px-1 text-center text-on-dark-text">
            {errorMessage(sendReply.error)}
          </Text>
        ) : null}

        {/* Reply bar. The camera button is the primary action in both states. */}
        <View className="flex-row items-center gap-2.5 px-1">
          <BlurView
            intensity={30}
            tint="dark"
            className="h-[52px] flex-1 justify-center overflow-hidden rounded-pill border border-on-dark-border px-5"
          >
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder={t('moment.replyPlaceholder')}
              placeholderTextColor={alpha.onDarkTextSoft}
              className="p-0 font-sans text-[15.5px] text-white"
              editable={!locked}
              returnKeyType="send"
              onSubmitEditing={() => {
                const content = reply.trim();
                if (content.length === 0 || myId.length === 0) return;
                // `trade_id` ties the message to the moment it is about, which
                // is what makes the chat readable later.
                sendReply.mutate(
                  draftMessage({
                    senderId: myId,
                    recipientId: moment.from.id,
                    content,
                    tradeId: moment.tradeId,
                  }),
                  {
                    // The optimistic bubble is rolled back on failure; without
                    // this the text goes with it and there is nothing to retry
                    // from — put it back, unless something was typed since.
                    onError: () => setReply((current) => (current.length === 0 ? content : current)),
                  },
                );
                setReply('');
              }}
            />
          </BlurView>
          <Pressable
            onPress={tradeBack}
            accessibilityRole="button"
            accessibilityLabel={t('moment.lockedCta')}
            className="h-[52px] w-[52px] items-center justify-center rounded-[26px] bg-purple active:opacity-85"
          >
            <CameraIcon size={22} lensColor={colors.purple} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
