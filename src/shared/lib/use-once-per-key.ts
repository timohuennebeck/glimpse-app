import { useEffect, useRef } from 'react';
/**
 * Runs `run` once for each distinct `key`, and never twice for the same one.
 * `null` means there is nothing to act on yet.
 *
 * Three background writes — stamping onboarding done, marking a trade seen,
 * marking a thread read — are fired from an effect whose condition is read back
 * out of the very cache the mutation optimistically patches. `optimistic()`
 * restores that snapshot on error, which re-satisfies the condition and fires
 * the effect again: an unbounded write + refetch loop for as long as the
 * request keeps failing, with no backoff anywhere to stop it.
 *
 * Keying the attempt breaks the cycle. A rollback restores the same key, so
 * nothing re-fires; only genuinely new work (a different trade, a newly arrived
 * message) changes the key and runs again.
 */
export function useOncePerKey(key: string | null, run: () => void): void {
  const attempted = useRef<string | null>(null);
  // Held in a ref so a caller can pass an inline closure without the effect
  // re-running on every render — the key alone decides when this fires.
  const latest = useRef(run);
  latest.current = run;

  useEffect(() => {
    if (key === null || attempted.current === key) return;
    attempted.current = key;
    latest.current();
  }, [key]);
}
