/**
 * Redux testing utilities for creating test stores and mock states
 * Provides helper functions for testing Redux slices and selectors
 */

import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import authSlice, { ConnectionConfig } from '../store/authSlice';
import sessionSlice, { Session } from '../store/sessionSlice';
import type { RootState } from '../store';

/**
 * Creates a test store with optional preloaded state
 * @description Helper function to create Redux store instances for testing
 * @param preloadedState - Initial state to load into the store
 * @returns Configured Redux store for testing
 * @example
 * ```typescript
 * const store = createTestStore({
 *   auth: { isConnected: true, connectionConfig: mockConfig }
 * });
 * ```
 */
export function createTestStore(preloadedState?: Partial<RootState>): EnhancedStore {
  return configureStore({
    reducer: {
      auth: authSlice,
      session: sessionSlice,
    },
    preloadedState,
  } as any);
}

/**
 * Creates mock connection configuration for testing
 * @description Generates realistic connection config data for auth tests
 * @param overrides - Properties to override in the mock config
 * @returns Mock ConnectionConfig object
 * @example
 * ```typescript
 * const config = createMockConnectionConfig({ port: 2222 });
 * ```
 */
export function createMockConnectionConfig(overrides: Partial<ConnectionConfig> = {}): ConnectionConfig {
  return {
    hostname: 'test-server.example.com',
    port: 22,
    username: 'testuser',
    privateKey: 'mock-private-key-content',
    ...overrides,
  };
}

/**
 * Creates mock session data for testing
 * @description Generates realistic session data for session slice tests
 * @param overrides - Properties to override in the mock session
 * @returns Mock Session object
 * @example
 * ```typescript
 * const session = createMockSession({ name: 'custom-session' });
 * ```
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  const now = new Date().toISOString();
  return {
    id: 'test-session-id',
    name: 'test-session',
    created: now,
    isActive: true,
    lastActivity: now,
    ...overrides,
  };
}

/**
 * Creates a list of mock sessions for testing
 * @description Generates multiple session objects for testing session lists
 * @param count - Number of sessions to create
 * @param baseOverrides - Base properties applied to all sessions
 * @returns Array of mock Session objects
 * @example
 * ```typescript
 * const sessions = createMockSessionList(3, { isActive: false });
 * ```
 */
export function createMockSessionList(count: number, baseOverrides: Partial<Session> = {}): Session[] {
  return Array.from({ length: count }, (_, index) =>
    createMockSession({
      id: `session-${index + 1}`,
      name: `Session ${index + 1}`,
      isActive: index === 0, // First session active by default
      ...baseOverrides,
    })
  );
}

/**
 * Type-safe helper to get initial auth state
 * @description Returns the initial state for auth slice testing
 * @returns Initial AuthState object
 */
export function getInitialAuthState() {
  const store = createTestStore();
  return store.getState().auth;
}

/**
 * Type-safe helper to get initial session state
 * @description Returns the initial state for session slice testing
 * @returns Initial SessionState object
 */
export function getInitialSessionState() {
  const store = createTestStore();
  return store.getState().session;
}