/**
 * Signed URLs that stay the same across refetches.
 *
 * A fresh signed URL per fetch defeats the image cache: every refetch would be a
 * new URL and a new download. URLs are signed for a day, kept in memory and in
 * storage, and re-signed only when under two hours remain.
 */
export const SIGN_TTL_SECONDS = 86_400;
export const RESIGN_BELOW_MS = 2 * 3_600_000;
const STORAGE_KEY = 'glimpse.signed-urls';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type Signer = (
  paths: string[],
  expiresInSeconds: number,
) => Promise<Array<{ path: string | null; signedUrl: string | null }>>;

type Entries = Record<string, { url: string; expiresAt: number }>;

export function createSignedUrlCache(store: KeyValueStore, sign: Signer, now: () => number = Date.now) {
  let loaded: Promise<Entries> | null = null;
  const load = () =>
    (loaded ??= store.getItem(STORAGE_KEY).then((raw) => (raw ? (JSON.parse(raw) as Entries) : {})));

  return {
    async get(paths: string[]): Promise<Map<string, string>> {
      const entries = await load();
      const result = new Map<string, string>();
      const toSign: string[] = [];

      for (const path of new Set(paths)) {
        const entry = entries[path];
        if (entry && entry.expiresAt - now() > RESIGN_BELOW_MS) result.set(path, entry.url);
        else toSign.push(path);
      }
      if (toSign.length === 0) return result;

      const signed = await sign(toSign, SIGN_TTL_SECONDS);
      const expiresAt = now() + SIGN_TTL_SECONDS * 1000;
      for (const { path, signedUrl } of signed) {
        if (!path || !signedUrl) continue;
        entries[path] = { url: signedUrl, expiresAt };
        result.set(path, signedUrl);
      }
      for (const [path, entry] of Object.entries(entries)) {
        if (entry.expiresAt <= now()) delete entries[path];
      }
      await store.setItem(STORAGE_KEY, JSON.stringify(entries));
      return result;
    },

    async clear(): Promise<void> {
      loaded = Promise.resolve({});
      await store.removeItem(STORAGE_KEY);
    },
  };
}
