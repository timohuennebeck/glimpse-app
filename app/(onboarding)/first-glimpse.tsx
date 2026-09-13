import { Redirect } from 'expo-router';

/**
 * Screen `02b First glimpse`.
 *
 * The artboard is the camera viewfinder — identical to `02 Kamera` — shown the
 * first time during onboarding. Rather than duplicating the viewfinder, this
 * routes to the real camera, which is what the step is for.
 */
export default function FirstGlimpseScreen() {
  return <Redirect href="/camera" />;
}
