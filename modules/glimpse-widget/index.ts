import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * The homescreen widget's native half.
 *
 * `requireOptionalNativeModule` rather than `requireNativeModule`: in Expo Go,
 * and in any build made before the config plugin ran a prebuild, the module is
 * simply absent. Widget updates then become no-ops instead of crashing the app.
 */
export interface GlimpseWidgetModule {
  /** False when the iOS App Group entitlement is missing from the build. */
  isAvailable(): boolean;
  writeSnapshot(json: string): Promise<void>;
  /** Downloads a signed URL into the container the widget reads from. */
  cacheImage(url: string, fileName: string): Promise<void>;
  /** Deletes every cached photo except the one named. */
  pruneImages(keep: string | null): Promise<void>;
  reloadWidget(): Promise<void>;
}

export default requireOptionalNativeModule<GlimpseWidgetModule>('GlimpseWidget');
