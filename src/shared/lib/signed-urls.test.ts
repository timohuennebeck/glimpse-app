import {
  createSignedUrlCache,
  KeyValueStore,
  RESIGN_BELOW_MS,
  SIGN_TTL_SECONDS,
} from '@/shared/lib/signed-urls';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

function signer(clock: { now: number }) {
  return jest.fn(async (paths: string[]) =>
    paths.map((path) => ({
      path,
      signedUrl: path === 'missing' ? null : `https://signed/${path}?at=${clock.now}`,
    })),
  );
}

describe('createSignedUrlCache', () => {
  it('signs only paths it has not seen, and returns the same URL again', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    const first = await cache.get(['a', 'b']);
    const second = await cache.get(['a', 'c']);

    expect(sign).toHaveBeenNthCalledWith(1, ['a', 'b'], SIGN_TTL_SECONDS);
    expect(sign).toHaveBeenNthCalledWith(2, ['c'], SIGN_TTL_SECONDS);
    expect(second.get('a')).toBe(first.get('a'));
  });

  it('re-signs once less than two hours remain', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    await cache.get(['a']);
    clock.now += SIGN_TTL_SECONDS * 1000 - RESIGN_BELOW_MS + 1;
    await cache.get(['a']);

    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('survives a restart through the store', async () => {
    const clock = { now: 1_000_000 };
    const store = memoryStore();
    await createSignedUrlCache(store, signer(clock), () => clock.now).get(['a']);

    const afterRestart = signer(clock);
    const url = (await createSignedUrlCache(store, afterRestart, () => clock.now).get(['a'])).get('a');

    expect(afterRestart).not.toHaveBeenCalled();
    expect(url).toBe('https://signed/a?at=1000000');
  });

  it('leaves out paths that could not be signed and tries them again next time', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    expect((await cache.get(['missing'])).has('missing')).toBe(false);
    await cache.get(['missing']);
    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('forgets everything on clear', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    await cache.get(['a']);
    await cache.clear();
    await cache.get(['a']);

    expect(sign).toHaveBeenCalledTimes(2);
  });
});
