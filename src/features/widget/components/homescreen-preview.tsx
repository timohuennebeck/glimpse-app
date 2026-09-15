import { useState } from 'react';
import { LayoutChangeEvent, TextStyle, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Avatar } from '@/shared/ui/avatar';
import { CameraIcon, LockedIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
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

/** Text shadows have no NativeWind utility, so the icon labels keep this as a style. */
const LABEL_SHADOW: TextStyle = { textShadowColor: 'rgba(0,0,0,.5)', textShadowRadius: 2 };

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

  // An iOS homescreen is a 4-column grid, laid out explicitly: the 2x2 widget
  // occupies the left two columns of the first two rows. One wrapping flex row
  // would put the 138px widget in the same flow as 58px icons and collide.
  const pairs = [
    [IOS_ICONS.weather, t(ONBOARDING.WIDGET.PREVIEW.WEATHER)],
    [IOS_ICONS.clock, t(ONBOARDING.WIDGET.PREVIEW.CLOCK)],
    [IOS_ICONS.calendar, t(ONBOARDING.WIDGET.PREVIEW.CALENDAR)],
    [IOS_ICONS.maps, t(ONBOARDING.WIDGET.PREVIEW.MAPS)],
  ] as const;
  const lastRow = [
    [IOS_ICONS.mail, t(ONBOARDING.WIDGET.PREVIEW.MAIL)],
    [IOS_ICONS.contacts, t(ONBOARDING.WIDGET.PREVIEW.CONTACTS)],
    [IOS_ICONS.stock, t(ONBOARDING.WIDGET.PREVIEW.STOCKS)],
    [IOS_ICONS.photos, t(ONBOARDING.WIDGET.PREVIEW.PHOTOS)],
  ] as const;

  return (
    <LinearGradient
      colors={[colors.widgetTop, colors.widgetMid, colors.widgetBottom]}
      locations={[0, 0.6, 1]}
      className="mt-5 h-[360px] overflow-hidden rounded-lg"
      onLayout={onLayout}
    >
      <View className="absolute left-0 right-0 top-0 h-[55%]" pointerEvents="none">
        <LinearGradient
          colors={['rgba(139,92,246,.34)', 'rgba(139,92,246,.10)', 'rgba(139,92,246,0)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      {/* The scale is measured at runtime and `transformOrigin` has no utility, so both stay a style. */}
      <View
        className="items-center gap-3.5 px-5 pt-[18px]"
        style={{ transform: [{ scale }], transformOrigin: 'top' }}
      >
        {size === 'small' ? (
          <View className="flex-row items-start gap-[22px]">
            <SmallWidget />
            {/* Two columns of two icons filling the rest of the first two rows. */}
            <View className="gap-3.5">
              <IconCell src={pairs[0][0]} label={pairs[0][1]} />
              <IconCell src={pairs[2][0]} label={pairs[2][1]} />
            </View>
            <View className="gap-3.5">
              <IconCell src={pairs[1][0]} label={pairs[1][1]} />
              <IconCell src={pairs[3][0]} label={pairs[3][1]} />
            </View>
          </View>
        ) : (
          <LargeWidget />
        )}

        <View className="flex-row gap-[22px]">
          {lastRow.map(([src, label]) => (
            <IconCell key={label} src={src} label={label} />
          ))}
        </View>
      </View>

      <BlurView
        intensity={30}
        tint="dark"
        className="absolute bottom-3.5 left-3.5 right-3.5 h-20 flex-row items-center justify-center gap-[22px] overflow-hidden rounded-lg border border-[rgba(255,255,255,.18)]"
      >
        {[IOS_ICONS.phone, IOS_ICONS.safari, IOS_ICONS.photos, IOS_ICONS.camera].map((src, i) => (
          <Image key={i} source={src} className="h-14 w-14 rounded-[13px]" contentFit="cover" />
        ))}
      </BlurView>
    </LinearGradient>
  );
}

function IconCell({ src, label }: IconCellProps) {
  return (
    <View className="w-[58px] items-center gap-[5px]">
      <Image source={src} className="h-[58px] w-[58px] rounded-[13px]" contentFit="cover" />
      <Text
        variant="captionXs"
        className="text-[rgba(255,255,255,.92)]"
        numberOfLines={1}
        style={LABEL_SHADOW}
      >
        {label}
      </Text>
    </View>
  );
}

/** 2x2: the frosted photo fills the tile, caption and camera button overlaid. */
function SmallWidget() {
  return (
    <View className="w-[138px] gap-[5px]">
      <View className="h-[138px] w-[138px] overflow-hidden rounded-[28px]">
        <Image source={PHOTOS.widgetCard} className="absolute inset-0" contentFit="cover" blurRadius={3} />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,.78)']}
          locations={[0.38, 1]}
          className="absolute inset-0"
        />
        <View className="absolute left-1/2 top-[35%] -ml-[22px] h-11 w-11 items-center justify-center rounded-[22px] border border-[rgba(255,255,255,.3)] bg-on-dark-fill">
          <LockedIcon size={17} />
        </View>
        <View className="absolute bottom-2 left-[9px] right-[9px] flex-row items-end gap-[7px]">
          <View className="min-w-0 flex-1">
            <Text variant="captionXs" className="text-[9px] text-[rgba(255,255,255,.75)]">
              {t(ONBOARDING.WIDGET.PREVIEW.SAMPLE_META)}
            </Text>
            <Text variant="captionXs" className="text-[11px] leading-[13px] text-white" numberOfLines={2}>
              {t(ONBOARDING.WIDGET.PREVIEW.SAMPLE_CAPTION)}
            </Text>
          </View>
          <View className="h-[27px] w-[27px] items-center justify-center rounded-[13.5px] bg-purple">
            <CameraIcon size={13} lensColor={colors.purple} />
          </View>
        </View>
      </View>
      <Text variant="captionXs" className="text-center text-[rgba(255,255,255,.92)]" style={LABEL_SHADOW}>
        {t(ONBOARDING.WIDGET.WIDGET_NAME)}
      </Text>
    </View>
  );
}

/** 4x2: frosted photo on the left, sender + caption + reply button on the right. */
function LargeWidget() {
  return (
    <View className="w-[298px] gap-[5px]">
      <View className="h-[140px] w-[298px] flex-row gap-3 rounded-[28px] border border-[rgba(167,139,250,.3)] bg-widget-card p-[11px]">
        <View className="w-[118px] overflow-hidden rounded-input">
          <Image source={PHOTOS.widgetCard} className="absolute inset-0" contentFit="cover" blurRadius={4} />
          <View className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 items-center justify-center rounded-[20px] border border-[rgba(255,255,255,.3)] bg-on-dark-fill">
            <LockedIcon size={16} />
          </View>
        </View>

        <View className="min-w-0 flex-1 justify-between">
          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <Avatar source={AVATARS.mia} size={20} />
              <Text variant="caption" weight="semibold" className="text-white">
                {t(ONBOARDING.WIDGET.PREVIEW.SAMPLE_NAME)}
              </Text>
              <Text variant="captionXs" className="text-on-dark-text-faint">
                {t(ONBOARDING.WIDGET.PREVIEW.SAMPLE_TIME)}
              </Text>
            </View>
            <Text variant="metaXs" className="text-[rgba(255,255,255,.94)]" numberOfLines={3}>
              {t(ONBOARDING.WIDGET.PREVIEW.SAMPLE_CAPTION_LONG)}
            </Text>
          </View>

          <View className="h-[34px] flex-row items-center justify-center gap-[7px] rounded-pill bg-purple">
            <CameraIcon size={15} lensColor={colors.purple} />
            <Text variant="metaXs" weight="semibold" className="text-white">
              {t(ONBOARDING.WIDGET.WIDGET_REPLY)}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="captionXs" className="text-center text-[rgba(255,255,255,.92)]" style={LABEL_SHADOW}>
        {t(ONBOARDING.WIDGET.WIDGET_NAME)}
      </Text>
    </View>
  );
}
