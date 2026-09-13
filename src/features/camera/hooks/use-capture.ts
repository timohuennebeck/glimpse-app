import { RefObject, useState } from 'react';
import type { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
/**
 * One-shot capture with a busy guard and the shutter haptic. Shared by the app
 * camera and the onboarding practice shot; only what happens with the URI differs.
 */
export function useCapture(cameraRef: RefObject<CameraView | null>, onCaptured: (uri: string) => void) {
  const [busy, setBusy] = useState(false);

  return async function capture() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (photo?.uri) onCaptured(photo.uri);
    } finally {
      setBusy(false);
    }
  };
}
