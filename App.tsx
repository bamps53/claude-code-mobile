/**
 * Main application entry point
 * @description Root component that sets up providers and navigation
 */

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store';

/**
 * Main App component
 * @description Root component with theme provider and navigation setup
 * @returns React component tree with all providers
 */
export default function App() {
  const colorScheme = useColorScheme();
  const { settings } = useAppStore();

  /**
   * Determines the active theme based on user settings and system preference
   * @returns Material Design theme object
   */
  const getTheme = () => {
    if (settings.theme === 'auto') {
      return colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
    }
    return settings.theme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  };

  const theme = getTheme();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
