import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
/** Soft violet glow behind the top of the paywall and share-code screens. */
export function BloomBackdrop() {
  return (
    <LinearGradient
      colors={['rgba(180,140,255,.32)', 'rgba(180,140,255,0)']}
      style={styles.bloom}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  bloom: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
});
