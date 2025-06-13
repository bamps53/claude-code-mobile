/**
 * Jest setup file for Redux store testing
 * Sets up global test configuration and utilities
 */

// Global test setup configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};