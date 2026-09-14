import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Avatar } from '@/shared/ui/avatar';
import { CameraIcon, LockedIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { IOS_ICONS, PHOTOS, AVATARS } from '@/shared/lib/fixtures';
interface HomescreenPreviewProps {
  /** `small` = 2x2 tile (screen 07), `large` = 4x2 tile (screen 07b). */
  size?: 'small' | 'large';
}

interface IconCellProps {
  src: number;
  label: string;
}

/** Design width of the homescreen grid: 138 tile + 2×58 icons + 3×22 gaps + 2×20 padding. */
const GRID_WIDTH = 360;

/**
 * A mock iOS homescreen showing the Glimpse widget in place, used by the widget
 * onboarding step. This is a *picture* of the widget drawn in React Native — the
 * real widget is native code under `widgets/`.
 */
export function HomescreenPreview({ size = 'small' }: HomescreenPreviewProps) {
  // The grid is drawn at its design width and scaled down as one piece on
  // phones narrower than that, so the tiles keep their proportions instead of
  // overflowing the panel.
  const [scale, setScale] = useState(1);
  const onLayout = (e: LayoutChangeEvent) => setScale(Math.min(1, e.nativeEvent.layout.width / GRID_WIDTH));

  // An iOS homescreen is a 4-column grid. Laying this out as one wrapping flex
  // row put the 138px widget in the same flow as 58px icons, which is why the
  // tiles collided with each other and with the dock. The grid is now explicit:
  // the 2x2 widget occupies the left two columns of the first two rows.
  const pairs = [
    [IOS_ICONS.weather, t('onboarding.widget.preview.weather')],
    [IOS_ICONS.clock, t('onboarding.widget.preview.clock')],
    [IOS_ICONS.calendar, t('onboarding.widget.preview.calendar')],
    [IOS_ICONS.maps, t('onboarding.widget.preview.maps')],
  ] as const;
  const lastRow = [
    [IOS_ICONS.mail, t('onboarding.widget.preview.mail')],
    [IOS_ICONS.contacts, t('onboarding.widget.preview.contacts')],
    [IOS_ICONS.stock, t('onboarding.widget.preview.stocks')],
    [IOS_ICONS.photos, t('onboarding.widget.preview.photos')],
  ] as const;

  return (
    <LinearGradient
      colors={[colors.widgetTop, colors.widgetMid, colors.widgetBottom]}
      locations={[0, 0.6, 1]}
      style={styles.phone}
      onLayout={onLayout}
    >
      <View style={styles.bloom} pointerEvents="none">
        <LinearGradient
          colors={['rgba(139,92,246,.34)', 'rgba(139,92,246,.10)', 'rgba(139,92,246,0)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.grid, { transform: [{ scale }], transformOrigin: 'top' }]}>
        {size === 'small' ? (
          <View style={styles.topRow}>
            <SmallWidget />
            {/* Two columns of two icons filling the rest of the first two rows. */}
            <View style={styles.iconCol}>
              <IconCell src={pairs[0][0]} label={pairs[0][1]} />
              <IconCell src={pairs[2][0]} label={pairs[2][1]} />
            </View>
            <View style={styles.iconCol}>
              <IconCell src={pairs[1][0]} label={pairs[1][1]} />
              <IconCell src={pairs[3][0]} label={pairs[3][1]} />
            </View>
          </View>
        ) : (
          <LargeWidget />
        )}

        <View style={styles.iconRow}>
          {lastRow.map(([src, label]) => (
            <IconCell key={label} src={src} label={label} />
          ))}
        </View>
      </View>

      <BlurView intensity={30} tint="dark" style={styles.dock}>
        {[IOS_ICONS.phone, IOS_ICONS.safari, IOS_ICONS.photos, IOS_ICONS.camera].map((src, i) => (
          <Image key={i} source={src} style={styles.dockIcon} contentFit="cover" />
        ))}
      </BlurView>
    </LinearGradient>
  );
}

function IconCell({ src, label }: IconCellProps) {
  return (
    <View style={styles.iconCell}>
      <Image source={src} style={styles.icon} contentFit="cover" />
      <Text variant="captionXs" color="rgba(255,255,255,.92)" numberOfLines={1} style={styles.iconLabel}>
        {label}
      </Text>
    </View>
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
              {t('onboarding.widget.preview.sampleMeta')}
            </Text>
            <Text variant="captionXs" color={colors.white} numberOfLines={2} style={styles.tinyBody}>
              {t('onboarding.widget.preview.sampleCaption')}
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
                {t('onboarding.widget.preview.sampleName')}
              </Text>
              <Text variant="captionXs" color={alpha.onDarkTextFaint}>
                {t('onboarding.widget.preview.sampleTime')}
              </Text>
            </View>
            <Text variant="metaXs" color="rgba(255,255,255,.94)" numberOfLines={3}>
              {t('onboarding.widget.preview.sampleCaptionLong')}
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
  phone: { marginTop: 20, height: 360, borderRadius: radius.lg, overflow: 'hidden' },
  bloom: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
  grid: { paddingHorizontal: 20, paddingTop: 18, gap: 14, alignItems: 'center' },
  topRow: { flexDirection: 'row', gap: 22, alignItems: 'flex-start' },
  iconCol: { gap: 14 },
  iconRow: { flexDirection: 'row', gap: 22 },
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
