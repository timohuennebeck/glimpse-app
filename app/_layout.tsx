import { useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  TikTokSans_400Regular,
  TikTokSans_500Medium,
  TikTokSans_600SemiBold,
} from '@expo-google-fonts/tiktok-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { colors } from '@/shared/theme/colors';
import { APP_VERSION, PERSIST_MAX_AGE, queryClient, queryPersister } from '@/shared/lib/query-client';
import { startSessionSync, useSession } from '@/features/auth/hooks/use-session';
// Side-effect imports: locale, Tailwind stylesheet, className support for third-party views.
import '@/shared/i18n/i18n';
import '../global.css';
import '@/shared/lib/css-interop';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Keys here must match `fontFamily` in src/shared/theme/fonts.ts.
  const [fontsLoaded] = useFonts({
    TikTokSans_400Regular,
    TikTokSans_500Medium,
    TikTokSans_600SemiBold,
  });
  const { status } = useSession();
  const ready = fontsLoaded && status !== 'loading';

  // Once, before any render that could route somewhere.
  useEffect(() => startSessionSync(), []);

  useEffect(() => {
    // Hold the splash until the type is ready and we know who is signed in.
    // Otherwise the first frame renders in the system face, or lands on the
    // welcome screen of an account that was signed in all along.
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE, buster: APP_VERSION }}
      >
        <SafeAreaProvider>
          <RootStack signedIn={status === 'signed-in'} />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

interface RootStackProps {
  signedIn: boolean;
}

/**
 * `Stack.Protected` takes the guarded routes out of the navigator rather than
 * redirecting away from them, so a deep link into `/moment/…` while signed out
 * cannot render the screen for a frame before bouncing.
 *
 * `invite/[token]` is deliberately open: the whole point of the link is that
 * the visitor has no account yet.
 */
function RootStack({ signedIn }: RootStackProps) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        // The mock shows a modal sheet for capture and viewing.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="invite/[token]" />

      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="compose" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recipients" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="moment/[tradeId]" options={{ animation: 'fade' }} />
        <Stack.Screen name="photo/[momentId]" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="chat/[partnerId]" />
      </Stack.Protected>
    </Stack>
  );
}
