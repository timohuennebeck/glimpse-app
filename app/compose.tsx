import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Pencil, RotateCcw, X } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, COMPOSE, MOMENT } from '@/shared/i18n/keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { createMoment, respondToTrade } from '@/features/moments/data/moments-api';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { queries } from '@/shared/lib/queries';
import { errorMessage } from '@/shared/lib/error-message';
import { PHOTOS } from '@/shared/lib/fixtures';
/**
 * Screen `03b Senden · Bestätigen` — review the shot and add a caption before
 * choosing who sees it.
 */
export default function ComposeScreen() {
  const composer = useComposer();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState(composer.caption);
  const queryClient = useQueryClient();

  /** Answering a frosted moment: upload, then `respond_to_trade` unlocks the pair. */
  const reply = useMutation({
    mutationFn: async (tradeId: string) => {
      if (!isSupabaseConfigured || !composer.uri) return;
      const momentId = await createMoment({
        localUri: composer.uri,
        caption: caption || null,
        width: composer.width,
        height: composer.height,
      });
      await respondToTrade(tradeId, momentId);
    },
    onSuccess: (_, tradeId) => {
      void queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
      composer.reset();
      // Land on the now-open pair rather than back on the feed. `push`, not
      // `replace`, so the tab root stays underneath and the moment's close
      // button has somewhere to go back to.
      router.dismissAll();
      router.push(`/moment/${tradeId}`);
    },
  });

  /**
   * Two exits. Answering a frosted moment is the unlock itself — the recipient
   * is already known, so it skips recipient selection. Only a fresh moment goes
   * on to choose who sees it.
   */
  function next() {
    composer.set({ caption });
    const tradeId = composer.replyToTradeId;
    if (tradeId) reply.mutate(tradeId);
    else router.push('/recipients');
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <Image
        source={composer.uri ? { uri: composer.uri } : PHOTOS.viewfinder}
        className="absolute inset-0"
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.8)']}
        locations={[0, 0.22, 0.5, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute inset-0"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-start justify-between px-5">
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
            <X size={12} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t(COMPOSE.RETAKE)}>
            <RotateCcw size={17} color={colors.white} strokeWidth={1.9} />
          </GlassButton>
        </View>

        <View className="flex-1" />

        {/* Frosted action bar, matching `rgba(18,16,24,.62)` + blur(22px). */}
        <BlurView
          intensity={40}
          tint="dark"
          className="overflow-hidden border-t border-t-[rgba(255,255,255,.14)]"
        >
          <View className="gap-[18px] px-[22px] pt-[22px]" style={{ paddingBottom: insets.bottom + 22 }}>
            {reply.error ? (
              <Text variant="meta" className="px-1.5 text-on-dark-text">
                {errorMessage(reply.error)}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-[9px] px-1.5">
              <Pencil size={15} color="rgba(255,255,255,.82)" strokeWidth={1.8} />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t(COMPOSE.CAPTION_PLACEHOLDER)}
                placeholderTextColor={alpha.onDarkText}
                className="max-h-[90px] flex-1 p-0 font-sans text-[15px] text-white"
                maxLength={280}
                multiline
              />
            </View>
            <Button
              label={composer.replyToTradeId ? t(MOMENT.LOCKED_CTA) : t(COMPOSE.CONTINUE)}
              variant="purple"
              size="xl"
              onPress={next}
              loading={reply.isPending}
            />
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}
