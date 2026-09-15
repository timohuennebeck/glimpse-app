import { View } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { cn } from '@/shared/lib/cn';
import { DottedDisc } from '@/shared/ui/dotted-disc';
import { colors } from '@/shared/theme/colors';
interface AvatarProps {
  /** `null` — or the empty string a profile with no avatar resolves to — draws the placeholder. */
  source: ImageSource | string | number | null;
  /** Its first letter goes in the placeholder. */
  name?: string;
  size?: number;
  /**
   * Ring styles from the mock:
   *  - `none`    plain circle
   *  - `halo`    2px white border + 1.5px #DCD0F7 outer ring (feed header, profile)
   *  - `active`  solid purple ring with a white gap (you / unread story)
   *  - `idle`    grey ring with a white gap (read story)
   */
  ring?: 'none' | 'halo' | 'active' | 'idle';
  dimmed?: boolean;
  className?: string;
}

export function Avatar({ source, name, size = 52, ring = 'none', dimmed = false, className }: AvatarProps) {
  const img = typeof source === 'string' ? { uri: source } : source;
  // Size is a prop, so the frame stays a style. The Image itself is styled
  // entirely through `style`: on web, NativeWind cannot mix `className` with a
  // numeric `style` on a registered third-party component.
  const round = { borderRadius: size / 2 };
  const opacity = dimmed ? 0.55 : 1;
  const letter = name?.trim().charAt(0).toUpperCase() || undefined;

  if (ring === 'active' || ring === 'idle') {
    // Mock: a coloured disc with 2.4px padding, and the photo carries a white
    // border of the same thickness.
    const ringWidth = size * 0.041;
    return (
      <View
        className={cn(ring === 'active' ? 'bg-purple' : 'bg-avatar-ring-idle', className)}
        style={[round, { width: size, height: size, padding: ringWidth }]}
      >
        {source ? (
          <Image
            source={img}
            style={[
              round,
              { width: '100%', height: '100%', borderWidth: ringWidth, borderColor: colors.white, opacity },
            ]}
            contentFit="cover"
          />
        ) : (
          // The disc draws its own white gap ring, so it replaces the border.
          <View style={{ opacity }}>
            <DottedDisc size={size - ringWidth * 2} letter={letter} gapColor={colors.white} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={className}>
      {source ? (
        <Image
          source={img}
          style={[
            round,
            { width: size, height: size, opacity },
            ring === 'halo' && { borderWidth: 2, borderColor: colors.white },
          ]}
          contentFit="cover"
        />
      ) : (
        <View style={{ opacity }}>
          <DottedDisc size={size} letter={letter} gapColor={colors.white} />
        </View>
      )}
      {ring === 'halo' ? (
        <View
          className="absolute inset-0 -m-[1.5px] border-[1.5px] border-purple-halo"
          style={round}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}
