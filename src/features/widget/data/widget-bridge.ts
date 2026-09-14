import { NativeModules } from 'react-native';
import type { InboxMoment } from '@/features/moments/interfaces';
/**
 * The snapshot the native widget renders.
 *
 * The widget process has no network and no JS runtime, so it cannot call
 * Supabase. Instead the app writes this small blob plus a cached image into the
 * shared container, and the widget reads it. See widgets/README.md.
 */
export interface WidgetSnapshot {
  /** `null` renders the "nothing waiting" state. */
  moment: {
    tradeId: string;
    fromName: string;
    caption: string | null;
    capturedAt: string;
    /** Filename inside the shared container, not a URL. */
    imageFile: string;
    /** Whether to draw the frosted treatment. */
    locked: boolean;
  } | null;
  updatedAt: string;
}

interface GlimpseWidgetModule {
  writeSnapshot(json: string): Promise<void>;
  reloadWidget(): Promise<void>;
}

/**
 * Resolved lazily and tolerated as missing: in Expo Go, or before the config
 * plugin has run a prebuild, the native module simply is not there and widget
 * updates become no-ops rather than crashes.
 */
function nativeModule(): GlimpseWidgetModule | null {
  return (NativeModules as Record<string, GlimpseWidgetModule | undefined>).GlimpseWidget ?? null;
}

/**
 * Push the oldest unanswered moment to the homescreen — the person who has
 * waited longest is the one looking back at you.
 *
 * Call this after any change to the inbox — a new moment arriving, or a trade
 * unlocking — and from the silent-push handler so the widget stays honest even
 * while the app is closed.
 */
export async function publishSnapshot(inbox: InboxMoment[]): Promise<void> {
  const module = nativeModule();
  if (!module) return;

  // The widget only ever shows one thing: the oldest unanswered moment, so the
  // person who has been waiting longest is the one looking back at you.
  const pending = inbox.filter((m) => !m.isOpen);
  const next = pending[pending.length - 1] ?? null;

  const snapshot: WidgetSnapshot = {
    moment: next
      ? {
          tradeId: next.tradeId,
          fromName: next.from.name,
          caption: next.caption,
          capturedAt: next.capturedAt,
          // Written by the native module's download step (widgets/README.md);
          // the JS side only names the file.
          imageFile: `${next.momentId}.jpg`,
          locked: true,
        }
      : null,
    updatedAt: new Date().toISOString(),
  };

  await module.writeSnapshot(JSON.stringify(snapshot));
  await module.reloadWidget();
}
