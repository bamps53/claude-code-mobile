module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',

  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/test/setup.ts', // This will be the target for setup file consolidation
  ],

  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
    // This general pattern aims to cover tests in src/, app/, and integration-tests/
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/workspace/', // Assuming /workspace/ isn't for tests run by this config
    // Removed '/integration-tests/' from ignore patterns to include them
  ],

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'integration-tests/**/*.{js,jsx,ts,tsx}', // Include integration tests in coverage
    '!src/**/*.d.ts',
    '!app/**/*.d.ts',
    '!integration-tests/**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    // We will consolidate jest.setup.js later
    '!<rootDir>/test/', // Exclude test utility files from coverage (e.g. setup.ts itself)
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^workspace/(.*)$': '<rootDir>/workspace/$1',
    // The mock for ssh-client.ts is removed as the file was deleted.
    // The mock for ssh2 is kept, assuming src/api/__mocks__/ssh2.ts exists and might be needed.
    '^ssh2$': '<rootDir>/src/api/__mocks__/ssh2.ts',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>'],

  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],

  // setupFiles are executed before the test framework is installed.
  // All setup logic is now in '<rootDir>/test/setup.ts' (via setupFilesAfterEnv).
  setupFiles: [],

  testTimeout: 30000, // General timeout, taken from the integration config

  globals: {
    'ts-jest': {
      isolatedModules: true, // From original jest.config.js, often used with jest-expo
      // tsconfig: 'tsconfig.json' // jest-expo preset should handle tsconfig.json discovery
    },
  },
};