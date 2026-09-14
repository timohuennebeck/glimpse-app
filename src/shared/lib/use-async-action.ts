import { useState } from 'react';
import { t } from '@/shared/i18n/i18n';
/** The message a screen shows for a thrown value; unknown shapes fall back to the generic copy. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('errors.generic');
}

/**
 * Busy flag plus error text for a screen's one primary async action (sending a
 * moment, answering a trade). `run` swallows the rejection into `error`, so a
 * failure never escapes the press handler — and a retry cannot fire while the
 * first attempt is still in flight.
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
