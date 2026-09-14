import { RefObject, useRef } from 'react';
import type { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * One-shot capture with a busy guard and the shutter haptic. Shared by the app
 * camera and the onboarding practice shot; only what happens with the photo differs.
 */
export function useCapture(
  cameraRef: RefObject<CameraView | null>,
  onCaptured: (photo: CapturedPhoto) => void,
) {
  // A ref, not state: two taps before the next render would both read stale
  // state and push the compose screen twice.
  const busy = useRef(false);

  return async function capture() {
    if (busy.current || !cameraRef.current) return;
    busy.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (photo?.uri) onCaptured({ uri: photo.uri, width: photo.width, height: photo.height });
    } finally {
      busy.current = false;
    }
  };
}
