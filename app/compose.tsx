import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Button, GlassButton, CloseIcon, RetakeIcon, PencilIcon, Text } from '@/shared/ui';
import { alpha, colors, fontFamily } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { useComposer } from '@/features/moments';
import { PHOTOS } from '@/shared/lib/fixtures';

/**
 * Screen `03b Senden · Bestätigen` — review the shot and add a caption before
 * choosing who sees it.
 */
export default function ComposeScreen() {
  const composer = useComposer();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState(composer.caption);

  function next() {
    composer.set({ caption });
    router.push('/recipients');
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
          <GlassButton size={38} onDark onPress={() => router.back()}>
            <CloseIcon size={12} color={colors.white} />
          </GlassButton>
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t('compose.retake')}>
            <RetakeIcon size={17} />
          </GlassButton>
        </View>

        <View style={styles.spacer} />

        {/* Frosted action bar, matching `rgba(18,16,24,.62)` + blur(22px). */}
        <BlurView intensity={40} tint="dark" style={styles.bar}>
          <View style={[styles.barInner, { paddingBottom: insets.bottom + 22 }]}>
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
            <Button label={t('compose.continue')} variant="purple" size="xl" onPress={next} />
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
