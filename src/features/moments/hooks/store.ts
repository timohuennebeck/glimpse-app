import { useSyncExternalStore } from 'react';
/**
 * A ~30-line external store, so the composer draft and the inbox can be shared
 * across screens without pulling in a state library for two use cases.
 *
 * The returned hook also carries `set`, `reset` and `getState` as static
 * members, so data modules can update the store from outside React.
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
