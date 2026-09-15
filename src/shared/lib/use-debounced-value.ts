import { useEffect, useState } from 'react';
/**
 * A search field fires on every keystroke; the query behind it should not.
 * 250ms skips the middle of a word without feeling laggy.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
