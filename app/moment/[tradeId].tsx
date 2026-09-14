import { useEffect, useMemo } from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon, LockedIcon, CameraIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { radius } from '@/shared/theme/page-structure';
import { BLUR } from '@/shared/ui/locked-image';
import { t } from '@/shared/i18n/i18n';
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
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={[styles.chrome, { paddingTop: insets.top + 6 }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              {!loading ? (
                <Text variant="bodySm" color={alpha.onDarkText}>
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
              <CloseIcon size={12} color={colors.white} />
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
    <View style={styles.root}>
      <StatusBar style="light" />

      <Image
        source={moment.photo}
        style={StyleSheet.absoluteFill}
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
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.chrome, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.header}>
          <Avatar source={moment.from.avatar ?? ''} size={52} />
          <View style={styles.headerText}>
            <Text variant="rowTitle" color={colors.white}>
              {moment.from.name}
            </Text>
            <Text variant="metaXs" color={alpha.onDarkTextSoft}>
              {relativeTime(moment.capturedAt)}
            </Text>
          </View>
          <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t('common.close')}>
            <CloseIcon size={12} color={colors.white} />
          </GlassButton>
        </View>

        {locked ? (
          <View style={styles.lockBody}>
            <View style={styles.lockPuck}>
              <LockedIcon size={28} />
            </View>
            <Text variant="cardTitleLg" color={colors.white} center>
              {t('moment.lockedTitle')}
            </Text>
            <Text variant="bodyXs" color={alpha.onDarkText} center style={styles.lockCopy}>
              {t('moment.lockedBody', { name: moment.from.name })}
            </Text>
            {countdown ? (
              <Text variant="caption" color={alpha.onDarkTextFaint} center>
                {t('moment.autoUnlock', { time: countdown })}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.flex} />
            {moment.caption ? (
              <Text variant="bodyLg" color={colors.white} style={styles.caption}>
                {moment.caption}
              </Text>
            ) : null}
          </>
        )}

        {/* Reply bar. The camera button is the primary action in both states. */}
        <View style={styles.replyRow}>
          <BlurView intensity={30} tint="dark" style={styles.replyField}>
            <TextInput
              placeholder={t('moment.replyPlaceholder')}
              placeholderTextColor={alpha.onDarkTextSoft}
              style={styles.replyInput}
              editable={!locked}
            />
          </BlurView>
          <Pressable
            onPress={tradeBack}
            accessibilityRole="button"
            accessibilityLabel={t('moment.lockedCta')}
            style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}
          >
            <CameraIcon size={22} lensColor={colors.purple} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  flex: { flex: 1 },
  chrome: { ...StyleSheet.absoluteFill, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  lockBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 60 },
  lockPuck: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: alpha.onDarkFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCopy: { maxWidth: 250 },
  caption: { paddingHorizontal: 4, marginBottom: 16 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  replyField: {
    flex: 1,
    height: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: alpha.onDarkBorder,
  },
  replyInput: { fontSize: 15.5, color: colors.white, fontFamily: fontFamily.regular, padding: 0 },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
