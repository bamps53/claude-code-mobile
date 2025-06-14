/**
 * Jest configuration for Claude Code Mobile
 * @description Testing configuration with React Native Testing Library setup
 */

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/src/**/?(*.)+(spec|test).(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/e2e/',
    '<rootDir>/node_modules/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@babel|@react-native-community|@testing-library|zustand))',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-typescript'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mock React Native modules
    'react-native$': 'react-native-web',
    'react-native-paper': '<rootDir>/jest-setup.js',
    'expo-secure-store': '<rootDir>/jest-setup.js',
    'expo-local-authentication': '<rootDir>/jest-setup.js',
    'react-native-webview': '<rootDir>/jest-setup.js',
  },
};