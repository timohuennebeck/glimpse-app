import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';

/**
 * The floating navigation bar.
 *
 * On iOS 26+ this is the real system Liquid Glass material, which refracts the
 * content scrolling underneath. Elsewhere it falls back to a blur plus a tint —
 * a pure blur over white content has nothing to refract and reads as invisible.
 *
 * It floats over the content rather than sitting in an opaque strip, so the
 * full-bleed screens from the mock still run edge to edge.
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const native = isLiquidGlassAvailable();

  const inner = (
    <View style={styles.row}>
      {state.routes.map((route: (typeof state.routes)[number], index: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
        const tint = focused ? colors.purpleDeep : colors.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            {options.tabBarIcon?.({ focused, color: tint, size: 23 })}
            <Text variant="captionXs" color={tint} style={focused ? styles.labelActive : undefined}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      {native ? (
        <GlassView glassEffectStyle="regular" isInteractive style={styles.bar}>
          {inner}
        </GlassView>
      ) : (
        <BlurView intensity={Platform.OS === 'android' ? 60 : 34} tint="light" style={styles.bar}>
          <View style={[StyleSheet.absoluteFill, styles.tintFallback]} />
          {inner}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    shadowColor: '#4C2878',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tintFallback: { backgroundColor: 'rgba(255,255,255,.72)' },
  row: { flexDirection: 'row', paddingVertical: 9 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 3 },
  pressed: { opacity: 0.6 },
  labelActive: { fontWeight: '600' },
});
