/**
 * Jest setup file for testing environment
 * @description Configures testing environment and mocks
 */

// Setup Platform early for react-native-paper
const mockPlatform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default || Object.values(obj)[0]),
  Version: 14,
};

// Mock react-native before anything else loads
jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native');
  Object.defineProperty(RN, 'Platform', {
    value: mockPlatform,
    writable: true,
    configurable: true,
  });
  return RN;
});

// Mock Expo's new runtime system
global.__ExpoImportMetaRegistry = new Map();
global.__METRO_GLOBAL_PREFIX__ = '';
global.__DEV__ = true;

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo-google-fonts/roboto-mono', () => ({
  useFonts: () => [true],
  RobotoMono_400Regular: 'RobotoMono_400Regular',
  RobotoMono_500Medium: 'RobotoMono_500Medium',
  RobotoMono_700Bold: 'RobotoMono_700Bold',
}));

// Mock WebView
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock React Native components that cause issues
jest.mock('react-native/Libraries/Modal/Modal', () => 'Modal');

// Mock SSH library
jest.mock('@dylankenneally/react-native-ssh-sftp', () => ({
  SSHClient: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Additional Platform mock for compatibility
jest.mock('react-native/Libraries/Utilities/Platform', () => mockPlatform);

// Ensure Platform is available globally
Object.defineProperty(global, 'Platform', {
  value: mockPlatform,
  writable: true,
});

// Mock Expo modules that cause issues
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Mock react-native-paper theme system that uses Platform.select
jest.mock('react-native-paper/src/styles/themes/v3/tokens', () => ({
  ...jest.requireActual('react-native-paper/src/styles/themes/v3/tokens'),
  Platform: mockPlatform,
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
