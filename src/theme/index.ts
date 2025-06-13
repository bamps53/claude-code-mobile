import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    tertiary: '#018786',
    surface: '#ffffff',
    background: '#f6f6f6',
    error: '#b00020',
    onSurface: '#000000',
    onBackground: '#000000',
  },
};

export type AppTheme = typeof theme;