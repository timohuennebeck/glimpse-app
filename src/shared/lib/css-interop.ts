import { cssInterop } from 'nativewind';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
/**
 * NativeWind only maps `className` on React Native's own components. These
 * third-party views take the same `style` prop, so register them once here
 * (imported for its side effect from the root layout).
 */
cssInterop(Image, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
cssInterop(GlassView, { className: 'style' });
