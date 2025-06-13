/**
 * Unit tests for authSlice Redux slice
 * Tests all actions, reducers, and state transitions for authentication management
 */

import authSlice, {
  setConnectionConfig,
  setConnecting,
  setConnected,
  setError,
  clearError,
  disconnect,
  ConnectionConfig,
} from '../authSlice';
import { createTestStore, createMockConnectionConfig } from '../../test-utils/store-utils';

describe('authSlice', () => {
  describe('initial state', () => {
    /**
     * Test initial state configuration
     * Verifies the auth slice starts with expected default values
     */
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().auth;

      expect(state).toEqual({
        isConnected: false,
        connectionConfig: null,
        isConnecting: false,
        error: null,
      });
    });
  });

  describe('setConnectionConfig action', () => {
    /**
     * Test setConnectionConfig action and state update
     * Verifies connection configuration is stored correctly
     */
    it('should set connection configuration', () => {
      const store = createTestStore();
      const mockConfig = createMockConnectionConfig();

      store.dispatch(setConnectionConfig(mockConfig));
      const state = store.getState().auth;

      expect(state.connectionConfig).toEqual(mockConfig);
    });

    /**
     * Test connection config update with partial data
     * Verifies complete replacement of configuration
     */
    it('should replace existing connection configuration', () => {
      const store = createTestStore();
      const firstConfig = createMockConnectionConfig({ hostname: 'first.example.com' });
      const secondConfig = createMockConnectionConfig({ hostname: 'second.example.com', port: 2222 });

      store.dispatch(setConnectionConfig(firstConfig));
      store.dispatch(setConnectionConfig(secondConfig));
      const state = store.getState().auth;

      expect(state.connectionConfig).toEqual(secondConfig);
      expect(state.connectionConfig?.hostname).toBe('second.example.com');
      expect(state.connectionConfig?.port).toBe(2222);
    });

    /**
     * Test connection config with optional privateKey field
     * Verifies handling of optional configuration properties
     */
    it('should handle connection config without private key', () => {
      const store = createTestStore();
      const configWithoutKey: ConnectionConfig = {
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      };

      store.dispatch(setConnectionConfig(configWithoutKey));
      const state = store.getState().auth;

      expect(state.connectionConfig).toEqual(configWithoutKey);
      expect(state.connectionConfig?.privateKey).toBeUndefined();
    });
  });

  describe('setConnecting action', () => {
    /**
     * Test setConnecting action with true value
     * Verifies connecting state is set correctly
     */
    it('should set connecting to true', () => {
      const store = createTestStore();

      store.dispatch(setConnecting(true));
      const state = store.getState().auth;

      expect(state.isConnecting).toBe(true);
    });

    /**
     * Test setConnecting action with false value
     * Verifies connecting state can be cleared
     */
    it('should set connecting to false', () => {
      const store = createTestStore();
      
      // First set to true, then false
      store.dispatch(setConnecting(true));
      store.dispatch(setConnecting(false));
      const state = store.getState().auth;

      expect(state.isConnecting).toBe(false);
    });
  });

  describe('setConnected action', () => {
    /**
     * Test setConnected action with true value
     * Verifies successful connection state and error clearing
     */
    it('should set connected to true and clear error', () => {
      const store = createTestStore();
      
      // Set an error first
      store.dispatch(setError('Connection failed'));
      store.dispatch(setConnected(true));
      const state = store.getState().auth;

      expect(state.isConnected).toBe(true);
      expect(state.error).toBeNull();
    });

    /**
     * Test setConnected action with false value
     * Verifies disconnection state without clearing existing errors
     */
    it('should set connected to false without clearing existing error', () => {
      const store = createTestStore();
      
      // Set error and connected state
      store.dispatch(setError('Some error'));
      store.dispatch(setConnected(false));
      const state = store.getState().auth;

      expect(state.isConnected).toBe(false);
      expect(state.error).toBe('Some error');
    });

    /**
     * Test connection state transitions
     * Verifies proper state management during connection lifecycle
     */
    it('should handle connection state transitions correctly', () => {
      const store = createTestStore();

      // Simulate connection flow
      store.dispatch(setConnecting(true));
      expect(store.getState().auth.isConnecting).toBe(true);

      store.dispatch(setConnected(true));
      const state = store.getState().auth;
      
      expect(state.isConnected).toBe(true);
      expect(state.isConnecting).toBe(true); // Note: setConnected doesn't modify isConnecting
    });
  });

  describe('setError action', () => {
    /**
     * Test setError action and automatic connecting state reset
     * Verifies error handling stops connecting state
     */
    it('should set error and reset connecting state', () => {
      const store = createTestStore();
      const errorMessage = 'SSH connection timeout';

      // Set connecting state first
      store.dispatch(setConnecting(true));
      store.dispatch(setError(errorMessage));
      const state = store.getState().auth;

      expect(state.error).toBe(errorMessage);
      expect(state.isConnecting).toBe(false);
    });

    /**
     * Test error message replacement
     * Verifies new errors replace existing ones
     */
    it('should replace existing error message', () => {
      const store = createTestStore();

      store.dispatch(setError('First error'));
      store.dispatch(setError('Second error'));
      const state = store.getState().auth;

      expect(state.error).toBe('Second error');
    });
  });

  describe('clearError action', () => {
    /**
     * Test clearError action
     * Verifies error state can be cleared without affecting other state
     */
    it('should clear error without affecting other state', () => {
      const store = createTestStore();
      const mockConfig = createMockConnectionConfig();

      // Set up state with error and other data
      store.dispatch(setConnectionConfig(mockConfig));
      store.dispatch(setConnected(true));
      store.dispatch(setError('Test error'));
      
      // Clear error
      store.dispatch(clearError());
      const state = store.getState().auth;

      expect(state.error).toBeNull();
      expect(state.isConnected).toBe(true);
      expect(state.connectionConfig).toEqual(mockConfig);
    });

    /**
     * Test clearError with no existing error
     * Verifies action is safe to call when no error exists
     */
    it('should handle clearing error when none exists', () => {
      const store = createTestStore();

      store.dispatch(clearError());
      const state = store.getState().auth;

      expect(state.error).toBeNull();
    });
  });

  describe('disconnect action', () => {
    /**
     * Test disconnect action with complete state reset
     * Verifies all connection-related state is cleared
     */
    it('should reset all connection state', () => {
      const store = createTestStore();
      const mockConfig = createMockConnectionConfig();

      // Set up connected state
      store.dispatch(setConnectionConfig(mockConfig));
      store.dispatch(setConnected(true));
      store.dispatch(setConnecting(true));
      store.dispatch(setError('Some error'));

      // Disconnect
      store.dispatch(disconnect());
      const state = store.getState().auth;

      expect(state.isConnected).toBe(false);
      expect(state.connectionConfig).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isConnecting).toBe(false); // Note: disconnect actually resets isConnecting too
    });

    /**
     * Test disconnect from initial state
     * Verifies disconnect action is safe when not connected
     */
    it('should handle disconnect from initial state', () => {
      const store = createTestStore();

      store.dispatch(disconnect());
      const state = store.getState().auth;

      expect(state).toEqual({
        isConnected: false,
        connectionConfig: null,
        isConnecting: false,
        error: null,
      });
    });
  });

  describe('reducer error handling', () => {
    /**
     * Test reducer with invalid action type
     * Verifies reducer handles unknown actions safely
     */
    it('should handle unknown action types', () => {
      const store = createTestStore();
      const initialState = store.getState().auth;

      // Dispatch unknown action
      store.dispatch({ type: 'UNKNOWN_ACTION', payload: 'test' } as any);
      const state = store.getState().auth;

      expect(state).toEqual(initialState);
    });

    /**
     * Test state immutability
     * Verifies Redux Toolkit Immer integration maintains immutability
     */
    it('should maintain state immutability', () => {
      const store = createTestStore();
      const initialState = store.getState().auth;
      const mockConfig = createMockConnectionConfig();

      store.dispatch(setConnectionConfig(mockConfig));
      const newState = store.getState().auth;

      expect(newState).not.toBe(initialState);
      expect(newState.connectionConfig).toEqual(mockConfig);
      expect(initialState.connectionConfig).toBeNull();
    });
  });

  describe('complex state scenarios', () => {
    /**
     * Test complete connection flow scenario
     * Verifies realistic connection sequence state transitions
     */
    it('should handle complete connection flow', () => {
      const store = createTestStore();
      const mockConfig = createMockConnectionConfig();

      // 1. Set connection config
      store.dispatch(setConnectionConfig(mockConfig));
      expect(store.getState().auth.connectionConfig).toEqual(mockConfig);

      // 2. Start connecting
      store.dispatch(setConnecting(true));
      expect(store.getState().auth.isConnecting).toBe(true);

      // 3. Successfully connect
      store.dispatch(setConnected(true));
      const connectedState = store.getState().auth;
      expect(connectedState.isConnected).toBe(true);
      expect(connectedState.error).toBeNull();

      // 4. Disconnect
      store.dispatch(disconnect());
      const disconnectedState = store.getState().auth;
      expect(disconnectedState.isConnected).toBe(false);
      expect(disconnectedState.connectionConfig).toBeNull();
    });

    /**
     * Test connection failure scenario
     * Verifies error handling during connection attempts
     */
    it('should handle connection failure flow', () => {
      const store = createTestStore();
      const mockConfig = createMockConnectionConfig();
      const errorMessage = 'Authentication failed';

      // 1. Set connection config and start connecting
      store.dispatch(setConnectionConfig(mockConfig));
      store.dispatch(setConnecting(true));

      // 2. Connection fails
      store.dispatch(setError(errorMessage));
      const errorState = store.getState().auth;
      
      expect(errorState.error).toBe(errorMessage);
      expect(errorState.isConnecting).toBe(false);
      expect(errorState.isConnected).toBe(false);
      expect(errorState.connectionConfig).toEqual(mockConfig);

      // 3. Clear error and retry
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });
});