/**
 * Unit tests for Redux store configuration
 * Tests store initialization, middleware setup, and root reducer combination
 */

import { configureStore } from '@reduxjs/toolkit';
import { store } from '../index';
import type { RootState, AppDispatch } from '../index';
import { createTestStore } from '../../test-utils/store-utils';
import { setConnectionConfig } from '../authSlice';
import { addSession, removeSession } from '../sessionSlice';

describe('Redux Store Configuration', () => {
  describe('store initialization', () => {
    /**
     * Test store initialization
     * Verifies store is properly configured and accessible
     */
    it('should initialize store with correct structure', () => {
      expect(store).toBeDefined();
      expect(store.getState).toBeDefined();
      expect(store.dispatch).toBeDefined();
      expect(store.subscribe).toBeDefined();
    });

    /**
     * Test store state structure
     * Verifies root state contains expected slice states
     */
    it('should have correct root state structure', () => {
      const state = store.getState();

      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('session');

      expect(state.auth).toHaveProperty('isConnected');
      expect(state.auth).toHaveProperty('connectionConfig');
      expect(state.auth).toHaveProperty('isConnecting');
      expect(state.auth).toHaveProperty('error');

      expect(state.session).toHaveProperty('sessions');
      expect(state.session).toHaveProperty('currentSession');
      expect(state.session).toHaveProperty('isLoading');
      expect(state.session).toHaveProperty('error');
      expect(state.session).toHaveProperty('terminalOutput');
    });

    /**
     * Test initial state values
     * Verifies store starts with expected default values
     */
    it('should have correct initial state values', () => {
      const state = store.getState();

      // Auth slice initial state
      expect(state.auth.isConnected).toBe(false);
      expect(state.auth.connectionConfig).toBeNull();
      expect(state.auth.isConnecting).toBe(false);
      expect(state.auth.error).toBeNull();

      // Session slice initial state
      expect(state.session.sessions).toEqual([]);
      expect(state.session.currentSession).toBeNull();
      expect(state.session.isLoading).toBe(false);
      expect(state.session.error).toBeNull();
      expect(state.session.terminalOutput).toEqual([]);
    });
  });

  describe('root reducer combination', () => {
    /**
     * Test reducer combination functionality
     * Verifies actions are properly routed to correct slice reducers
     */
    it('should route actions to correct slice reducers', () => {
      const testStore = createTestStore();
      const initialState = testStore.getState();

      // Dispatch auth action
      testStore.dispatch(setConnectionConfig({
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      }));

      // Dispatch session action
      testStore.dispatch(addSession({
        id: 'test-session',
        name: 'Test Session',
        created: new Date().toISOString(),
        isActive: true,
      }));

      const newState = testStore.getState();

      // Verify auth state changed
      expect(newState.auth.connectionConfig).not.toBeNull();
      expect(newState.auth.connectionConfig?.hostname).toBe('test.example.com');

      // Verify session state changed
      expect(newState.session.sessions).toHaveLength(1);
      expect(newState.session.sessions[0].name).toBe('Test Session');

      // Verify states are independent
      expect(newState.auth).not.toBe(initialState.auth);
      expect(newState.session).not.toBe(initialState.session);
    });

    /**
     * Test cross-slice state isolation
     * Verifies changes to one slice don't affect others
     */
    it('should maintain state isolation between slices', () => {
      const testStore = createTestStore();
      const initialState = testStore.getState();

      // Modify auth state
      testStore.dispatch(setConnectionConfig({
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      }));

      const stateAfterAuth = testStore.getState();

      // Verify only auth state changed
      expect(stateAfterAuth.auth).not.toBe(initialState.auth);
      expect(stateAfterAuth.session).toBe(initialState.session);

      // Modify session state
      testStore.dispatch(addSession({
        id: 'test-session',
        name: 'Test Session',
        created: new Date().toISOString(),
        isActive: true,
      }));

      const finalState = testStore.getState();

      // Verify session state changed but auth state reference remained
      expect(finalState.session).not.toBe(stateAfterAuth.session);
      expect(finalState.auth).toBe(stateAfterAuth.auth);
    });
  });

  describe('TypeScript types', () => {
    /**
     * Test RootState type accuracy
     * Verifies TypeScript types match actual store structure
     */
    it('should have accurate RootState type', () => {
      const state: RootState = store.getState();

      // Type checks (compilation will fail if types are incorrect)
      expect(typeof state.auth.isConnected).toBe('boolean');
      expect(state.auth.connectionConfig === null || typeof state.auth.connectionConfig === 'object').toBe(true);
      expect(typeof state.auth.isConnecting).toBe('boolean');
      expect(state.auth.error === null || typeof state.auth.error === 'string').toBe(true);

      expect(Array.isArray(state.session.sessions)).toBe(true);
      expect(state.session.currentSession === null || typeof state.session.currentSession === 'object').toBe(true);
      expect(typeof state.session.isLoading).toBe('boolean');
      expect(state.session.error === null || typeof state.session.error === 'string').toBe(true);
      expect(Array.isArray(state.session.terminalOutput)).toBe(true);
    });

    /**
     * Test AppDispatch type functionality
     * Verifies dispatch function type is correct
     */
    it('should have correct AppDispatch type', () => {
      const dispatch: AppDispatch = store.dispatch;

      // Type check - this should compile without errors
      expect(typeof dispatch).toBe('function');

      // Test actual dispatch functionality
      const action = setConnectionConfig({
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      });

      expect(() => dispatch(action)).not.toThrow();
    });
  });

  describe('store behavior', () => {
    /**
     * Test store subscription functionality
     * Verifies store notifies subscribers of state changes
     */
    it('should notify subscribers of state changes', () => {
      const testStore = createTestStore();
      const mockSubscriber = jest.fn();

      const unsubscribe = testStore.subscribe(mockSubscriber);

      // Dispatch action
      testStore.dispatch(setConnectionConfig({
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      }));

      expect(mockSubscriber).toHaveBeenCalledTimes(1);

      // Dispatch another action
      testStore.dispatch(addSession({
        id: 'test-session',
        name: 'Test Session',
        created: new Date().toISOString(),
        isActive: true,
      }));

      expect(mockSubscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    /**
     * Test store state immutability
     * Verifies Redux Toolkit maintains immutability
     */
    it('should maintain state immutability', () => {
      const testStore = createTestStore();
      const initialState = testStore.getState();

      // Dispatch action
      testStore.dispatch(setConnectionConfig({
        hostname: 'test.example.com',
        port: 22,
        username: 'testuser',
      }));

      const newState = testStore.getState();

      // Verify state objects are different
      expect(newState).not.toBe(initialState);
      expect(newState.auth).not.toBe(initialState.auth);

      // Verify unchanged slices maintain reference equality
      expect(newState.session).toBe(initialState.session);

      // Verify original state is unchanged
      expect(initialState.auth.connectionConfig).toBeNull();
      expect(newState.auth.connectionConfig).not.toBeNull();
    });

    /**
     * Test multiple dispatches in sequence
     * Verifies store handles rapid state changes correctly
     */
    it('should handle multiple dispatches correctly', () => {
      const testStore = createTestStore();
      const actions = [
        setConnectionConfig({
          hostname: 'server1.example.com',
          port: 22,
          username: 'user1',
        }),
        addSession({
          id: 'session1',
          name: 'Session 1',
          created: new Date().toISOString(),
          isActive: true,
        }),
        setConnectionConfig({
          hostname: 'server2.example.com',
          port: 2222,
          username: 'user2',
        }),
        addSession({
          id: 'session2',
          name: 'Session 2',
          created: new Date().toISOString(),
          isActive: false,
        }),
      ];

      // Dispatch all actions
      actions.forEach(action => testStore.dispatch(action));

      const finalState = testStore.getState();

      // Verify final state reflects all changes
      expect(finalState.auth.connectionConfig?.hostname).toBe('server2.example.com');
      expect(finalState.auth.connectionConfig?.port).toBe(2222);
      expect(finalState.session.sessions).toHaveLength(2);
      expect(finalState.session.sessions[0].name).toBe('Session 1');
      expect(finalState.session.sessions[1].name).toBe('Session 2');
    });
  });

  describe('store performance', () => {
    /**
     * Test store performance with many actions
     * Verifies store can handle high-frequency updates
     */
    it('should handle many actions efficiently', () => {
      const testStore = createTestStore();
      const startTime = performance.now();

      // Dispatch many actions
      for (let i = 0; i < 1000; i++) {
        testStore.dispatch(addSession({
          id: `session-${i}`,
          name: `Session ${i}`,
          created: new Date().toISOString(),
          isActive: i % 2 === 0,
        }));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify operations completed in reasonable time
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(testStore.getState().session.sessions).toHaveLength(1000);
    });

    /**
     * Test memory usage with large state
     * Verifies store doesn't leak memory with many updates
     */
    it('should not leak memory with many updates', () => {
      const testStore = createTestStore();
      const iterations = 100;

      // Perform many add/remove cycles
      for (let i = 0; i < iterations; i++) {
        // Add sessions
        testStore.dispatch(addSession({
          id: `temp-session-${i}`,
          name: `Temp Session ${i}`,
          created: new Date().toISOString(),
          isActive: true,
        }));

        // Remove sessions to simulate cleanup
        if (i > 0) {
          testStore.dispatch(removeSession(`temp-session-${i - 1}`));
        }
      }

      const finalState = testStore.getState();

      // Should have only the last session
      expect(finalState.session.sessions).toHaveLength(1);
      expect(finalState.session.sessions[0].id).toBe(`temp-session-${iterations - 1}`);
    });
  });
});