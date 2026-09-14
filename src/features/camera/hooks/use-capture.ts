import { RefObject, useRef } from 'react';
import type { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
/**
 * One-shot capture with a busy guard and the shutter haptic. Shared by the app
 * camera and the onboarding practice shot; only what happens with the URI differs.
 */
export function useCapture(cameraRef: RefObject<CameraView | null>, onCaptured: (uri: string) => void) {
  // A ref, not state: two taps before the next render both read stale state
  // and used to push the compose screen twice.
  const busy = useRef(false);

  return async function capture() {
    if (busy.current || !cameraRef.current) return;
    busy.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (photo?.uri) onCaptured(photo.uri);
    } finally {
      busy.current = false;
    }
  };
}
