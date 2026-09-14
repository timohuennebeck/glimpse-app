import { t } from '@/shared/i18n/i18n';
/** The message a screen shows for a thrown value; unknown shapes fall back to the generic copy. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('errors.generic');
}
