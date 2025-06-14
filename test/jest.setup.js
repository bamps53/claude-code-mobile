/**
 * Global Jest setup file
 * This file runs before tests to set up the testing environment
 */

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

// Mock Platform library directly for Button component
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios || obj.default),
  },
}));

// Mock NativeI18nManager module for Modal
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

// Mock NativeSettingsManager module needed by Settings.ios
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
    get: jest.fn(key => null),
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
          window: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 375,
            height: 667,
            scale: 2,
            fontScale: 1,
          },
        },
      }),
    },
  };
});

// Mock for React Native's NativeModules
jest.mock('react-native', () => {
  const reactNative = jest.requireActual('react-native');
  
  // Mock NativeModules to prevent "fbBatchedBridgeConfig is not set" errors
  reactNative.NativeModules = {
    ...reactNative.NativeModules,
    ExpoSecureStore: {
      getValueWithKeyAsync: jest.fn(async (key) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
        return null;
      }),
      setValueWithKeyAsync: jest.fn(async (key, value) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
        return null;
      }),
      deleteValueWithKeyAsync: jest.fn(async (key) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
        return null;
      }),
    },
    ExpoNotifications: {
      requestPermissionsAsync: jest.fn(),
      getExpoPushTokenAsync: jest.fn(),
      setNotificationHandler: jest.fn(),
      addNotificationReceivedListener: jest.fn(),
      addNotificationResponseReceivedListener: jest.fn(),
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
  };

  // Create a complete Platform mock
  const Platform = {
    OS: 'ios',
    Version: 16.0,
    constants: {
      osVersion: '16.0',
      systemName: 'iOS',
      interfaceIdiom: 'phone',
      isTesting: true,
      forceTouchAvailable: false,
      reactNativeVersion: {
        major: 0,
        minor: 79,
        patch: 3,
      },
    },
    isPad: false,
    isTV: false,
    isTesting: true,
    select: obj => obj.ios,
  };

  // Mock missing React Native modules needed by tests
  return {
    ...reactNative,
    Platform,
    NativeModules: reactNative.NativeModules,
    NativeAnimatedModule: {},
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({
        show: jest.fn(),
        reload: jest.fn(),
      })),
      get: jest.fn(() => ({
        show: jest.fn(),
        reload: jest.fn(),
      })),
    },
  };
});

// Mock expo modules
jest.mock('expo-modules-core', () => {
  return {
    ...jest.requireActual('expo-modules-core'),
    NativeModulesProxy: {
      ExpoSecureStore: {
        getValueWithKeyAsync: jest.fn(async (key) => {
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
          return null;
        }),
        setValueWithKeyAsync: jest.fn(async (key, value) => {
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
          return null;
        }),
        deleteValueWithKeyAsync: jest.fn(async (key) => {
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate loading
          return null;
        }),
      },
    },
  };
});

// Set up global mocks
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: {},
};

// Silence expected warnings
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message) => {
  if (
    message?.includes?.('Please update the following components:') ||
    message?.includes?.('componentWillReceiveProps') ||
    message?.includes?.('componentWillMount')
  ) {
    return;
  }
  // Call the original warn function, not recursively calling our mock
  originalWarn(message);
});

// The ssh-client module is now mocked globally via moduleNameMapper in jest.config.js
// pointing to /test/mocks/ssh-client.js
