/**
 * Consolidated Jest setup file for all tests
 * Configures mocks and testing utilities
 */

import '@testing-library/jest-native/extend-expect';

// --- Mocks from former jest.setup.js (order might matter for some) ---

// Mock TurboModuleRegistry to prevent DevMenu errors
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  return {
    getEnforcing: jest.fn(() => ({
      show: jest.fn(),
      reload: jest.fn(),
    })),
    get: jest.fn(() => ({
      show: jest.fn(),
      reload: jest.fn(),
    })),
  };
});

// Mock DevMenu
jest.mock('react-native/src/private/devmenu/DevMenu', () => ({
  show: jest.fn(),
  reload: jest.fn(),
}), { virtual: true });

// Mock NativePlatformConstantsIOS
jest.mock('react-native/Libraries/Utilities/Platform.ios', () => {
  return {
    __esModule: true,
    default: {
      getConstants: () => ({
        osVersion: '16.0',
        systemName: 'iOS',
        interfaceIdiom: 'phone',
        isTesting: true,
        isDisableAnimations: true,
      }),
    },
  };
});

// Mock Platform library directly
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'ios',
    select: jest.fn((obj: { ios: any; default: any; }) => obj.ios || obj.default),
  },
}));

// Mock NativeI18nManager module
jest.mock('react-native/Libraries/ReactNative/I18nManager', () => ({
  getConstants: () => ({
    isRTL: false,
    doLeftAndRightSwapInRTL: true,
    localeIdentifier: 'en_US',
  }),
  allowRTL: jest.fn(),
  forceRTL: jest.fn(),
  swapLeftAndRightInRTL: jest.fn(),
  __esModule: true,
  default: {
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'en_US',
    }),
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
  },
}));

// Mock NativeSettingsManager module
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      settings: {},
    }),
  },
}));

// Mock Settings.ios directly
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  __esModule: true,
  default: {
    get: jest.fn((_key: any) => null),
    set: jest.fn(),
    watchKeys: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

// Mock NativeDeviceInfo module
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => {
  return {
    __esModule: true,
    default: {
      getConstants: () => ({
        Dimensions: {
          window: { width: 375, height: 667, scale: 2, fontScale: 1 },
          screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
        },
      }),
    },
  };
});

// Comprehensive mock for React Native itself
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');

  const mockNativeModules = {
    ...reactNative.NativeModules,
    ExpoSecureStore: {
      getValueWithKeyAsync: jest.fn().mockResolvedValue(null),
      setValueWithKeyAsync: jest.fn().mockResolvedValue(undefined),
      deleteValueWithKeyAsync: jest.fn().mockResolvedValue(undefined),
    },
    ExpoNotifications: {
      requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
      getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
      setNotificationHandler: jest.fn(),
      addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
      addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    DevMenu: {
      show: jest.fn(),
      reload: jest.fn(),
    },
    PlatformConstants: {
      getConstants: () => ({
        osVersion: '16.0',
        systemName: 'iOS',
        interfaceIdiom: 'phone',
        isTesting: true,
      }),
    },
    NativeAnimatedModule: {}, // For animations
  };

  const mockPlatform = {
    OS: 'ios',
    Version: 16.0,
    constants: {
      osVersion: '16.0',
      systemName: 'iOS',
      interfaceIdiom: 'phone',
      isTesting: true,
      forceTouchAvailable: false,
      reactNativeVersion: { major: 0, minor: 72, patch: 0 }, // Example version
    },
    isPad: false,
    isTV: false,
    isTesting: true,
    select: (obj: { ios: any; default: any; android?: any; web?:any; }) => obj.ios || obj.default,
  };
  
  const mockTurboModuleRegistry = {
      getEnforcing: jest.fn((name: string) => mockNativeModules[name] || { show: jest.fn(), reload: jest.fn() }),
      get: jest.fn((name: string) => mockNativeModules[name] || { show: jest.fn(), reload: jest.fn() }),
  };

  return {
    ...reactNative,
    NativeModules: mockNativeModules,
    Platform: mockPlatform,
    TurboModuleRegistry: mockTurboModuleRegistry,
  };
});

// --- Mocks from original test/setup.ts and unit-setup.ts ---

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  Link: ({ children, ...props }: any) => jest.requireActual('react-native').View(props, children), // Mock Link as a View
  Stack: jest.fn(), // Mock Stack if used directly
}));

jest.mock('@react-native/virtualized-lists/node_modules/react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

jest.mock('react-native-paper', () => {
  return {
    ...jest.requireActual('react-native-paper'),
    Portal: ({ children }: any) => children,
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });


jest.mock('expo-modules-core', () => {
  const actualExpoModulesCore = jest.requireActual('expo-modules-core');
  return {
    ...actualExpoModulesCore,
    NativeModulesProxy: {
      ...actualExpoModulesCore.NativeModulesProxy,
      ExpoSecureStore: { // This mock is for when SecureStore is accessed via NativeModulesProxy
        getValueWithKeyAsync: jest.fn().mockResolvedValue(null),
        setValueWithKeyAsync: jest.fn().mockResolvedValue(undefined),
        deleteValueWithKeyAsync: jest.fn().mockResolvedValue(undefined),
      },
      // Add other proxied modules if they were in the original jest.setup.js and are needed
    },
  };
});

// --- Global setups ---
(global as any).__fbBatchedBridgeConfig = {
  remoteModuleConfig: {},
};

// Silence specific console warnings and errors
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

jest.spyOn(console, 'warn').mockImplementation((...args: any[]) => {
  const message = args[0];
  if (
    typeof message === 'string' && (
      message.includes('Please update the following components:') ||
      message.includes('componentWillReceiveProps') ||
      message.includes('componentWillMount') ||
      message.includes('Animated: `useNativeDriver` was not specified.') // Common warning to ignore
    )
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
});

jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
  const message = args[0];
  // Example: Ignore specific harmless errors from libraries during tests
  // if (typeof message === 'string' && message.includes('Some specific error string from a library')) {
  //   return;
  // }
  originalConsoleError.apply(console, args);
});