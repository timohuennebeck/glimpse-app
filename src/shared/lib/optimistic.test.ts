import { QueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';

type Item = { id: string; done: boolean };

/** gcTime Infinity schedules no garbage-collection timers, so Jest exits cleanly. */
const newClient = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });

const markDone = patch<Item[], string>(['todos'], (old, id) =>
  old.map((item) => (item.id === id ? { ...item, done: true } : item)),
);

describe('optimistic', () => {
  it('patches the cache before the request resolves', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    await optimistic(queryClient, [markDone]).onMutate('a');
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: true }]);
  });

  it('restores the snapshot when the request fails', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    const handlers = optimistic(queryClient, [markDone]);
    const context = await handlers.onMutate('a');
    handlers.onError(new Error('offline'), 'a', context);
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: false }]);
  });

  it('restores overlapping patches in reverse order', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    const append = patch<Item[], string>(['todos'], (old, id) => [...old, { id: `${id}2`, done: false }]);
    const handlers = optimistic(queryClient, [markDone, append]);
    const context = await handlers.onMutate('a');
    handlers.onError(new Error('offline'), 'a', context);
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: false }]);
  });

  it('leaves queries that were never loaded alone', async () => {
    const queryClient = newClient();
    await optimistic(queryClient, [markDone]).onMutate('a');
    expect(queryClient.getQueryData(['todos'])).toBeUndefined();
  });

  it('patches every cached query under a prefix', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['search', 'mi'], [{ id: 'a', done: false }]);
    queryClient.setQueryData<Item[]>(['search', 'be'], [{ id: 'a', done: false }]);
    const handlers = optimistic(queryClient, [
      patch<Item[], string>(['search'], (old, id) => old.map((item) => ({ ...item, done: item.id === id }))),
    ]);
    await handlers.onMutate('a');
    expect(queryClient.getQueryData(['search', 'mi'])).toEqual([{ id: 'a', done: true }]);
    expect(queryClient.getQueryData(['search', 'be'])).toEqual([{ id: 'a', done: true }]);
  });

  it('marks patched queries stale once settled', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], []);
    await optimistic(queryClient, [markDone]).onSettled();
    expect(queryClient.getQueryState(['todos'])?.isInvalidated).toBe(true);
  });
});
