import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from '../src/store';
import { theme } from '../src/theme';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="server-connection" options={{ title: 'Server Connection' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </PaperProvider>
    </Provider>
  );
}