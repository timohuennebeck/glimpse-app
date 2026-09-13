import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Avatar, CameraIcon, LockedIcon, Text } from '@/shared/ui';
import { alpha, colors, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { IOS_ICONS, PHOTOS, AVATARS } from '@/shared/lib/fixtures';

type HomescreenPreviewProps = {
  /** `small` = 2x2 tile (screen 07), `large` = 4x2 tile (screen 07b). */
  size?: 'small' | 'large';
};

/**
 * A mock iOS homescreen showing the Glimpse widget in place, used by the widget
 * onboarding step. This is a *picture* of the widget drawn in React Native — the
 * real widget is native code under `widgets/`.
 */
export function HomescreenPreview({ size = 'small' }: HomescreenPreviewProps) {
  const fillerIcons = [
    { src: IOS_ICONS.weather, label: 'Wetter' },
    { src: IOS_ICONS.clock, label: 'Uhr' },
    { src: IOS_ICONS.calendar, label: 'Kalender' },
    { src: IOS_ICONS.maps, label: 'Karten' },
    { src: IOS_ICONS.mail, label: 'Mail' },
    { src: IOS_ICONS.contacts, label: 'Kontakte' },
    { src: IOS_ICONS.stock, label: 'Aktien' },
  ].slice(0, size === 'small' ? 7 : 4);

  return (
    <LinearGradient
      colors={[colors.widgetTop, colors.widgetMid, colors.widgetBottom]}
      locations={[0, 0.6, 1]}
      style={styles.phone}
    >
      {/* Purple bloom behind the top-left of the grid. */}
      <View style={styles.bloom} pointerEvents="none">
        <LinearGradient
          colors={['rgba(139,92,246,.38)', 'rgba(139,92,246,0)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.grid}>
        {size === 'small' ? <SmallWidget /> : <LargeWidget />}

        {fillerIcons.map((icon) => (
          <View key={icon.label} style={styles.iconCell}>
            <Image source={icon.src} style={styles.icon} contentFit="cover" />
            <Text variant="captionXs" color="rgba(255,255,255,.92)" numberOfLines={1} style={styles.iconLabel}>
              {icon.label}
            </Text>
          </View>
        ))}
      </View>

      <BlurView intensity={30} tint="dark" style={styles.dock}>
        {[IOS_ICONS.phone, IOS_ICONS.safari, IOS_ICONS.photos, IOS_ICONS.camera].map((src, i) => (
          <Image key={i} source={src} style={styles.dockIcon} contentFit="cover" />
        ))}
      </BlurView>
    </LinearGradient>
  );
}

/** 2x2: the frosted photo fills the tile, caption and camera button overlaid. */
function SmallWidget() {
  return (
    <View style={styles.smallCell}>
      <View style={styles.smallTile}>
        <Image source={PHOTOS.widgetCard} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={3} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,.78)']}
          locations={[0.38, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.smallPuck}>
          <LockedIcon size={17} />
        </View>
        <View style={styles.smallFooter}>
          <View style={styles.flex}>
            <Text variant="captionXs" color="rgba(255,255,255,.75)" style={styles.tiny}>
              Mia · vor 12 Min
            </Text>
            <Text variant="captionXs" color={colors.white} numberOfLines={2} style={styles.tinyBody}>
              Kurz raus, bevor der Regen kommt
            </Text>
          </View>
          <View style={styles.smallCamera}>
            <CameraIcon size={13} lensColor={colors.purple} />
          </View>
        </View>
      </View>
      <Text variant="captionXs" color="rgba(255,255,255,.92)" center style={styles.iconLabel}>
        {t('onboarding.widget.widgetName')}
      </Text>
    </View>
  );
}

/** 4x2: frosted photo on the left, sender + caption + reply button on the right. */
function LargeWidget() {
  return (
    <View style={styles.largeCell}>
      <View style={styles.largeTile}>
        <View style={styles.largeImage}>
          <Image source={PHOTOS.widgetCard} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={4} />
          <View style={styles.largePuck}>
            <LockedIcon size={16} />
          </View>
        </View>

        <View style={styles.largeBody}>
          <View style={styles.largeHeader}>
            <View style={styles.largeSender}>
              <Avatar source={AVATARS.mia} size={20} />
              <Text variant="caption" color={colors.white} style={styles.tinyBold}>
                Mia
              </Text>
              <Text variant="captionXs" color={alpha.onDarkTextFaint}>
                · 14:07
              </Text>
            </View>
            <Text variant="metaXs" color="rgba(255,255,255,.94)" numberOfLines={3}>
              Kurz raus, bevor der Regen kommt. Zeig mir deinen Blick.
            </Text>
          </View>

          <View style={styles.largeButton}>
            <CameraIcon size={15} lensColor={colors.purple} />
            <Text variant="metaXs" color={colors.white} style={styles.tinyBold}>
              {t('onboarding.widget.widgetReply')}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="captionXs" color="rgba(255,255,255,.92)" center style={styles.iconLabel}>
        {t('onboarding.widget.widgetName')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  phone: { marginTop: 20, height: 386, borderRadius: radius.lg, overflow: 'hidden' },
  bloom: { position: 'absolute', left: '-10%', top: 0, width: '80%', height: '45%' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 18,
    columnGap: 22,
    rowGap: 14,
    justifyContent: 'center',
  },
  iconCell: { alignItems: 'center', gap: 5, width: 58 },
  icon: { width: 58, height: 58, borderRadius: 13 },
  iconLabel: { textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 2 },
  tiny: { fontSize: 9 },
  tinyBody: { fontSize: 11, lineHeight: 13 },
  tinyBold: { fontWeight: '600' },

  smallCell: { width: 138, gap: 5 },
  smallTile: { width: 138, height: 138, borderRadius: 28, overflow: 'hidden' },
  smallPuck: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: alpha.onDarkFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallFooter: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  smallCamera: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeCell: { width: 298, gap: 5 },
  largeTile: {
    width: 298,
    height: 140,
    borderRadius: 28,
    backgroundColor: colors.widgetCard,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,.3)',
    flexDirection: 'row',
    padding: 11,
    gap: 12,
  },
  largeImage: { width: 118, borderRadius: radius.input, overflow: 'hidden' },
  largePuck: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: alpha.onDarkFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBody: { flex: 1, minWidth: 0, justifyContent: 'space-between' },
  largeHeader: { gap: 4 },
  largeSender: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  largeButton: {
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  dock: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    height: 80,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.18)',
  },
  dockIcon: { width: 56, height: 56, borderRadius: 13 },
});
