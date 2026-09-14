import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { CloseIcon, RetakeIcon, PencilIcon } from '@/shared/ui/icons';
import { alpha, colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { t } from '@/shared/i18n/i18n';
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
        facing: composer.facing,
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
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={composer.uri ? { uri: composer.uri } : PHOTOS.viewfinder}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.8)']}
        locations={[0, 0.22, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.topRow}>
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t('common.close')}>
            <CloseIcon size={12} color={colors.white} />
          </GlassButton>
          <GlassButton
            size={38}
            onDark
            onPress={() => router.back()}
            accessibilityLabel={t('compose.retake')}
          >
            <RetakeIcon size={17} />
          </GlassButton>
        </View>

        <View style={styles.spacer} />

        {/* Frosted action bar, matching `rgba(18,16,24,.62)` + blur(22px). */}
        <BlurView intensity={40} tint="dark" style={styles.bar}>
          <View style={[styles.barInner, { paddingBottom: insets.bottom + 22 }]}>
            {reply.error ? (
              <Text variant="meta" color={alpha.onDarkText} style={styles.error}>
                {errorMessage(reply.error)}
              </Text>
            ) : null}
            <View style={styles.captionRow}>
              <PencilIcon size={15} />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t('compose.captionPlaceholder')}
                placeholderTextColor={alpha.onDarkText}
                style={styles.captionInput}
                maxLength={280}
                multiline
              />
            </View>
            <Button
              label={composer.replyToTradeId ? t('moment.lockedCta') : t('compose.continue')}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  spacer: { flex: 1 },
  bar: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.14)', overflow: 'hidden' },
  barInner: { paddingHorizontal: 22, paddingTop: 22, gap: 18 },
  error: { paddingHorizontal: 6 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 6 },
  captionInput: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
    fontFamily: fontFamily.regular,
    maxHeight: 90,
    padding: 0,
  },
});
