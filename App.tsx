/**
 * Main application entry point
 * @description Root component that sets up providers and navigation
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  useFonts as useRobotoMono,
  RobotoMono_400Regular,
  RobotoMono_500Medium,
  RobotoMono_700Bold,
} from '@expo-google-fonts/roboto-mono';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store';
import { darkTheme, lightTheme } from './src/theme';

/**
 * Main App component
 * @description Root component with theme provider and navigation setup
 * @returns React component tree with all providers
 */
export default function App() {
  const colorScheme = useColorScheme();
  const { settings } = useAppStore();
  const [fontsLoaded] = useRobotoMono({
    RobotoMono_400Regular,
    RobotoMono_500Medium,
    RobotoMono_700Bold,
  });

  /**
   * Determines the active theme based on user settings and system preference
   * @returns Material Design theme object
   */
  const getTheme = () => {
    if (settings.theme === 'auto') {
      return colorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return settings.theme === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getTheme();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0A0A0A',
        }}
      >
        <ActivityIndicator size="large" color="#00FF41" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
