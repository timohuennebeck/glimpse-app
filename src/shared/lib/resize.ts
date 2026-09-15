import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
/**
 * Everything the app uploads goes through here first.
 *
 * A phone capture is twelve megapixels and several megabytes. Uploading that
 * costs the sender a wait and costs the blur function more CPU than an Edge
 * Function is given, for a rendition that ends up 48px wide.
 */

/** Longest edge of an uploaded capture. */
export const MAX_CAPTURE_EDGE = 1600;
/** Avatars are drawn at 164px at most; 512 covers every screen density. */
export const MAX_AVATAR_EDGE = 512;

export interface Size {
  width: number;
  height: number;
}

export interface ResizedImage extends Size {
  uri: string;
}

/** Fits a size inside a square of `max`, never scaling up. */
export function fitWithin(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * JPEG at quality 0.85, at most `max` on the longest edge. The returned size is
 * what goes on the moment row, so a card can reserve the aspect ratio before
 * the image loads.
 */
export async function resizeJpeg(uri: string, source: Size, max: number): Promise<ResizedImage> {
  const target = fitWithin(source.width, source.height, max);
  const context = ImageManipulator.manipulate(uri);
  // Re-encode either way: the camera may hand back HEIC, and the bucket and
  // the blur function both expect JPEG.
  if (target.width !== source.width || target.height !== source.height) context.resize(target);
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
