import { useSyncExternalStore, useCallback } from 'react';
/**
 * A ~30-line external store, so the composer draft can be shared across screens
 * without pulling in a state library for one use case.
 */
export function create<T extends object>(initial: T, resetTo: T) {
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
    state = resetTo;
    listeners.forEach((fn) => fn());
  };

  return function useStore() {
    const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return { ...value, set: useCallback(set, []), reset: useCallback(reset, []) };
  };
}
