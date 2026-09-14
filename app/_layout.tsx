import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, TikTokSans_400Regular, TikTokSans_500Medium, TikTokSans_600SemiBold } from '@expo-google-fonts/tiktok-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { colors } from '@/shared/theme/colors';
import { queryClient } from '@/shared/lib/query-client';
// Side-effect import: configures the locale before any screen renders.
import '@/shared/i18n/i18n';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Keys here must match `fontFamily` in src/shared/theme/fonts.ts.
  const [fontsLoaded] = useFonts({
    TikTokSans_400Regular,
    TikTokSans_500Medium,
    TikTokSans_600SemiBold,
  });

  useEffect(() => {
    // Hold the splash until the type is ready, otherwise the first frame
    // renders in the system face and reflows once TikTok Sans arrives.
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
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
            <Stack.Screen name="(app)" />
            <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="compose" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="recipients" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="moment/[tradeId]" options={{ animation: 'fade' }} />
            <Stack.Screen name="photo/[momentId]" options={{ animation: 'fade' }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
