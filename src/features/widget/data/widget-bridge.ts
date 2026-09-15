import GlimpseWidget from '../../../../modules/glimpse-widget';
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

/**
 * Push the oldest unanswered moment to the homescreen — the person who has
 * waited longest is the one looking back at you.
 *
 * Call this after any change to the inbox — a new moment arriving, or a trade
 * unlocking — and from the silent-push handler so the widget stays honest even
 * while the app is closed.
 *
 * The module is absent in Expo Go and in any build made before the config
 * plugin ran a prebuild, so this is a no-op there rather than a crash.
 */
export async function publishSnapshot(inbox: InboxMoment[]): Promise<void> {
  if (!GlimpseWidget?.isAvailable()) return;

  const pending = inbox.filter((m) => !m.isOpen);
  // v_inbox is newest first, so the last pending row is the longest waiting.
  const next = pending[pending.length - 1] ?? null;
  const imageFile = next ? `${next.momentId}.jpg` : null;

  // The photo has to be in the container before the snapshot names it: the
  // widget reloads as soon as the snapshot lands, and a snapshot pointing at a
  // file that is not there yet renders as a missing image. A signing failure
  // leaves `photo` empty, which is a snapshot worth skipping rather than a
  // widget showing a blank frame.
  if (next && imageFile) {
    if (!next.photo) return;
    try {
      await GlimpseWidget.cacheImage(next.photo, imageFile);
    } catch {
      // Offline, or an expired URL. Leave whatever the widget already shows;
      // the next inbox change tries again.
      return;
    }
  }

  const snapshot: WidgetSnapshot = {
    moment:
      next && imageFile
        ? {
            tradeId: next.tradeId,
            fromName: next.from.name,
            caption: next.caption,
            capturedAt: next.capturedAt,
            imageFile,
            locked: true,
          }
        : null,
    updatedAt: new Date().toISOString(),
  };

  await GlimpseWidget.writeSnapshot(JSON.stringify(snapshot));
  // Every earlier moment's photo is dead weight in the shared container.
  await GlimpseWidget.pruneImages(imageFile).catch(() => {});
  await GlimpseWidget.reloadWidget();
}
