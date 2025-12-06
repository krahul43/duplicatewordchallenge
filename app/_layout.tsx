import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { store, persistor } from '../src/store';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="game/[id]" />
            <Stack.Screen name="subscription-required" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
