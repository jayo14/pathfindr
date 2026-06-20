import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    useFonts as useDMSansFonts,
} from '@expo-google-fonts/dm-sans';
import {
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    useFonts as usePoppinsFonts,
} from '@expo-google-fonts/poppins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { theme } from '@/constants/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 30 * 60 * 1000,     // 30 minutes
    },
  },
});

/** Apply DM Sans as the default body font across all Text and TextInput
 *  elements without requiring per-component font style overrides. */
function applyGlobalFont(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TextAny = Text as any;
  TextAny.defaultProps = TextAny.defaultProps ?? {};
  TextAny.defaultProps.style = [
    { fontFamily: 'DMSans_400Regular' },
    TextAny.defaultProps.style,
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const InputAny = TextInput as any;
  InputAny.defaultProps = InputAny.defaultProps ?? {};
  InputAny.defaultProps.style = [
    { fontFamily: 'DMSans_400Regular' },
    InputAny.defaultProps.style,
  ];
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
  );
}

export default function RootLayout() {
  const [dmSansLoaded, dmSansError] = useDMSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const [poppinsLoaded, poppinsError] = usePoppinsFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const fontsLoaded = dmSansLoaded && poppinsLoaded;
  const fontsError = dmSansError ?? poppinsError;

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      if (fontsLoaded) {
        applyGlobalFont();
      }
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <AppErrorBoundary>
            <StatusBar style="dark" />
            <RootLayoutNav />
          </AppErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
