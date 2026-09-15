import { AppState, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';
/**
 * One client for the app. Server state (inbox, pairs, friends) lives here;
 * screens read it with `useQuery` and change it with `useMutation`, never
 * with a fetch inside a `useEffect`.
 */

/** A day-old feed is worth drawing for the half second before the refetch lands. */
export const PERSIST_MAX_AGE = 24 * 3_600_000;

/**
 * Cache buster. A new build may change the shape of what is cached, so the
 * persisted cache is dropped whenever the app version changes.
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A moment that was fresh half a minute ago still is; refetch on
      // foreground and after mutations, not on every mount.
      staleTime: 30_000,
      // At least PERSIST_MAX_AGE, or a restored query is collected before the
      // screen that wants it has mounted.
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
    },
  },
});

/** Written on every cache change, so a cold start has yesterday's data to draw. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'glimpse.query-cache',
  throttleTime: 1000,
});

// "Window focus" is a browser idea. On a phone it is the app returning to
// the foreground, which is exactly when the inbox should refresh.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => subscription.remove();
  });
}
