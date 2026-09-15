import { useSyncExternalStore } from 'react';
/**
 * A ~30-line external store for client-only state (the composer draft), so it
 * can be shared across screens without a state library. Server state is not
 * kept here: that is TanStack Query's job (see `src/shared/lib/queries.ts`).
 *
 * The returned hook also carries `set`, `reset` and `getState` as static
 * members, so the store can be updated from outside React.
 */
export function create<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  const getSnapshot = () => state;
  const set = (patch: Partial<T>) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const reset = () => {
    state = initial;
    listeners.forEach((fn) => fn());
  };

  function useStore() {
    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return { ...value, set, reset };
  }

  return Object.assign(useStore, { set, reset, getState: getSnapshot });
}
