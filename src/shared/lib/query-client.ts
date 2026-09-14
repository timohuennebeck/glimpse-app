import { AppState, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
/**
 * One client for the app. Server state (inbox, pairs, friends) lives here;
 * screens read it with `useQuery` and change it with `useMutation`, never
 * with a fetch inside a `useEffect`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A moment that was fresh half a minute ago still is; refetch on
      // foreground and after mutations, not on every mount.
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// "Window focus" is a browser idea. On a phone it is the app returning to
// the foreground, which is exactly when the inbox should refresh.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => subscription.remove();
  });
}
