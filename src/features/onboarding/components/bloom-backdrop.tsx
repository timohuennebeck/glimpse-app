import { LinearGradient } from 'expo-linear-gradient';
/** Soft violet glow behind the top of the paywall screen. */
export function BloomBackdrop() {
  return (
    <LinearGradient
      colors={['rgba(180,140,255,.32)', 'rgba(180,140,255,0)']}
      className="absolute left-0 right-0 top-0 h-[320px]"
      pointerEvents="none"
    />
  );
}
