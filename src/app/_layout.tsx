import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View, ActivityIndicator, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppProvider } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { HeadsUpNotificationBanner } from '@/components/HeadsUpNotificationBanner';
import { AlarmRingingModal } from '@/components/AlarmRingingModal';

// Register Android Home Screen Widgets in standalone APK builds (safely skipped in Expo Go)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (Platform.OS === 'android' && !isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('@/widgets/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err) {
    console.log('[Widget] Registration error:', err);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <HeadsUpNotificationBanner />
        <AlarmRingingModal />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="materi/index" options={{ headerShown: false }} />
          <Stack.Screen name="catatan/index" options={{ headerShown: false }} />
          <Stack.Screen name="reminder/index" options={{ headerShown: false }} />
          <Stack.Screen name="statistik/index" options={{ headerShown: false }} />
          <Stack.Screen name="kebiasaan/index" options={{ headerShown: false }} />
          <Stack.Screen name="profil/index" options={{ headerShown: false }} />
          <Stack.Screen name="daftar-tugas/index" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
