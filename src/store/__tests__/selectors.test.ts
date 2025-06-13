/**
 * Unit tests for Redux selectors
 * Tests all selector functions including memoization performance and derived state
 */

import {
  selectAuth,
  selectIsConnected,
  selectConnectionConfig,
  selectIsConnecting,
  selectAuthError,
  selectConnectionInfo,
  selectAuthStatus,
  selectSession,
  selectSessions,
  selectCurrentSession,
  selectSessionLoading,
  selectSessionError,
  selectTerminalOutput,
  selectActiveSessions,
  selectInactiveSessions,
  selectSessionById,
  selectSessionCount,
  selectSessionStats,
  selectSessionsSortedByDate,
  selectSessionsSortedByActivity,
  selectAppStatus,
  selectTerminalDisplay,
} from '../selectors';
import { createTestStore, createMockConnectionConfig, createMockSession, createMockSessionList } from '../../test-utils/store-utils';
import { setConnectionConfig, setConnected, setConnecting, setError } from '../authSlice';
import { setSessions, setCurrentSession, addTerminalOutput, setLoading, setError as setSessionError } from '../sessionSlice';

describe('Redux Selectors', () => {
  describe('Auth Selectors', () => {
    describe('selectAuth', () => {
      /**
       * Test auth slice selector
       * Verifies base auth selector returns auth state
       */
      it('should select auth state', () => {
        const store = createTestStore();
        const state = store.getState();
        const result = selectAuth(state);

        expect(result).toBe(state.auth);
        expect(result).toHaveProperty('isConnected');
        expect(result).toHaveProperty('connectionConfig');
        expect(result).toHaveProperty('isConnecting');
        expect(result).toHaveProperty('error');
      });
    });

    describe('selectIsConnected', () => {
      /**
       * Test connection status selector
       * Verifies selector returns correct connection state
       */
      it('should select connection status', () => {
        const store = createTestStore();
        let state = store.getState();
        
        expect(selectIsConnected(state)).toBe(false);

        store.dispatch(setConnected(true));
        state = store.getState();
        expect(selectIsConnected(state)).toBe(true);
      });

      /**
       * Test selector memoization
       * Verifies selector returns same reference for unchanged state
       */
      it('should be memoized', () => {
        const store = createTestStore();
        const state = store.getState();

        const result1 = selectIsConnected(state);
        const result2 = selectIsConnected(state);

        expect(result1).toBe(result2);
      });
    });

    describe('selectConnectionConfig', () => {
      /**
       * Test connection config selector
       * Verifies selector returns connection configuration
       */
      it('should select connection config', () => {
        const store = createTestStore();
        const mockConfig = createMockConnectionConfig();

        store.dispatch(setConnectionConfig(mockConfig));
        const state = store.getState();
        const result = selectConnectionConfig(state);

        expect(result).toEqual(mockConfig);
      });

      /**
       * Test null connection config
       * Verifies selector handles null config correctly
       */
      it('should handle null connection config', () => {
        const store = createTestStore();
        const state = store.getState();
        const result = selectConnectionConfig(state);

        expect(result).toBeNull();
      });
    });

    describe('selectIsConnecting', () => {
      /**
       * Test connecting status selector
       * Verifies selector returns correct connecting state
       */
      it('should select connecting status', () => {
        const store = createTestStore();
        let state = store.getState();

        expect(selectIsConnecting(state)).toBe(false);

        store.dispatch(setConnecting(true));
        state = store.getState();
        expect(selectIsConnecting(state)).toBe(true);
      });
    });

    describe('selectAuthError', () => {
      /**
       * Test auth error selector
       * Verifies selector returns auth error state
       */
      it('should select auth error', () => {
        const store = createTestStore();
        const errorMessage = 'Connection failed';

        store.dispatch(setError(errorMessage));
        const state = store.getState();
        const result = selectAuthError(state);

        expect(result).toBe(errorMessage);
      });

      /**
       * Test null auth error
       * Verifies selector handles null error correctly
       */
      it('should handle null error', () => {
        const store = createTestStore();
        const state = store.getState();
        const result = selectAuthError(state);

        expect(result).toBeNull();
      });
    });

    describe('selectConnectionInfo', () => {
      /**
       * Test derived connection info selector
       * Verifies selector combines config and status correctly
       */
      it('should create connection info object', () => {
        const store = createTestStore();
        const mockConfig = createMockConnectionConfig({
          hostname: 'test.example.com',
          username: 'testuser',
          port: 2222,
        });

        store.dispatch(setConnectionConfig(mockConfig));
        store.dispatch(setConnected(true));
        const state = store.getState();
        const result = selectConnectionInfo(state);

        expect(result).toEqual({
          hostname: 'test.example.com',
          username: 'testuser',
          port: 2222,
          isConnected: true,
        });
      });

      /**
       * Test connection info with null config
       * Verifies selector handles null configuration
       */
      it('should handle null connection config', () => {
        const store = createTestStore();
        store.dispatch(setConnected(false));
        const state = store.getState();
        const result = selectConnectionInfo(state);

        expect(result).toEqual({
          hostname: null,
          username: null,
          port: null,
          isConnected: false,
        });
      });

      /**
       * Test memoization with unchanged inputs
       * Verifies derived selector is properly memoized
       */
      it('should be memoized for unchanged inputs', () => {
        const store = createTestStore();
        const mockConfig = createMockConnectionConfig();

        store.dispatch(setConnectionConfig(mockConfig));
        store.dispatch(setConnected(true));
        const state = store.getState();

        const result1 = selectConnectionInfo(state);
        const result2 = selectConnectionInfo(state);

        expect(result1).toBe(result2);
      });
    });

    describe('selectAuthStatus', () => {
      /**
       * Test comprehensive auth status selector
       * Verifies selector combines all auth states correctly
       */
      it('should create comprehensive auth status', () => {
        const store = createTestStore();
        const errorMessage = 'Auth failed';

        store.dispatch(setConnecting(true));
        store.dispatch(setError(errorMessage));
        const state = store.getState();
        const result = selectAuthStatus(state);

        expect(result).toEqual({
          isConnected: false,
          isConnecting: false, // setError resets isConnecting to false
          hasError: true,
          error: errorMessage,
          status: 'error',
        });
      });

      /**
       * Test auth status transitions
       * Verifies status field reflects current state correctly
       */
      it('should calculate correct status values', () => {
        const store = createTestStore();

        // Disconnected state
        let state = store.getState();
        expect(selectAuthStatus(state).status).toBe('disconnected');

        // Connecting state
        store.dispatch(setConnecting(true));
        state = store.getState();
        expect(selectAuthStatus(state).status).toBe('connecting');

        // Connected state (need to clear connecting first)
        store.dispatch(setConnecting(false));
        store.dispatch(setConnected(true));
        state = store.getState();
        expect(selectAuthStatus(state).status).toBe('connected');

        // Error state
        store.dispatch(setError('Connection failed'));
        state = store.getState();
        expect(selectAuthStatus(state).status).toBe('error');
      });
    });
  });

  describe('Session Selectors', () => {
    describe('selectSession', () => {
      /**
       * Test session slice selector
       * Verifies base session selector returns session state
       */
      it('should select session state', () => {
        const store = createTestStore();
        const state = store.getState();
        const result = selectSession(state);

        expect(result).toBe(state.session);
        expect(result).toHaveProperty('sessions');
        expect(result).toHaveProperty('currentSession');
        expect(result).toHaveProperty('isLoading');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('terminalOutput');
      });
    });

    describe('selectSessions', () => {
      /**
       * Test sessions list selector
       * Verifies selector returns sessions array
       */
      it('should select sessions list', () => {
        const store = createTestStore();
        const mockSessions = createMockSessionList(3);

        store.dispatch(setSessions(mockSessions));
        const state = store.getState();
        const result = selectSessions(state);

        expect(result).toEqual(mockSessions);
        expect(result).toHaveLength(3);
      });
    });

    describe('selectCurrentSession', () => {
      /**
       * Test current session selector
       * Verifies selector returns current session
       */
      it('should select current session', () => {
        const store = createTestStore();
        const mockSession = createMockSession();

        store.dispatch(setCurrentSession(mockSession));
        const state = store.getState();
        const result = selectCurrentSession(state);

        expect(result).toEqual(mockSession);
      });

      /**
       * Test null current session
       * Verifies selector handles null current session
       */
      it('should handle null current session', () => {
        const store = createTestStore();
        const state = store.getState();
        const result = selectCurrentSession(state);

        expect(result).toBeNull();
      });
    });

    describe('selectActiveSessions', () => {
      /**
       * Test active sessions filter selector
       * Verifies selector filters active sessions correctly
       */
      it('should filter active sessions', () => {
        const store = createTestStore();
        const sessions = [
          createMockSession({ id: 'active1', isActive: true }),
          createMockSession({ id: 'inactive1', isActive: false }),
          createMockSession({ id: 'active2', isActive: true }),
        ];

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const result = selectActiveSessions(state);

        expect(result).toHaveLength(2);
        expect(result.every(s => s.isActive)).toBe(true);
        expect(result.map(s => s.id)).toEqual(['active1', 'active2']);
      });

      /**
       * Test memoization of filtered results
       * Verifies selector memoizes filtered arrays
       */
      it('should be memoized for unchanged sessions', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(3, { isActive: true });

        store.dispatch(setSessions(sessions));
        const state = store.getState();

        const result1 = selectActiveSessions(state);
        const result2 = selectActiveSessions(state);

        expect(result1).toBe(result2);
      });
    });

    describe('selectInactiveSessions', () => {
      /**
       * Test inactive sessions filter selector
       * Verifies selector filters inactive sessions correctly
       */
      it('should filter inactive sessions', () => {
        const store = createTestStore();
        const sessions = [
          createMockSession({ id: 'active1', isActive: true }),
          createMockSession({ id: 'inactive1', isActive: false }),
          createMockSession({ id: 'inactive2', isActive: false }),
        ];

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const result = selectInactiveSessions(state);

        expect(result).toHaveLength(2);
        expect(result.every(s => !s.isActive)).toBe(true);
        expect(result.map(s => s.id)).toEqual(['inactive1', 'inactive2']);
      });
    });

    describe('selectSessionById', () => {
      /**
       * Test session by ID selector factory
       * Verifies selector finds session by ID correctly
       */
      it('should find session by ID', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(3);
        const targetSession = sessions[1];

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const selector = selectSessionById(targetSession.id);
        const result = selector(state);

        expect(result).toEqual(targetSession);
      });

      /**
       * Test session by ID with non-existent ID
       * Verifies selector returns null for missing session
       */
      it('should return null for non-existent session ID', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(2);

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const selector = selectSessionById('non-existent-id');
        const result = selector(state);

        expect(result).toBeNull();
      });

      /**
       * Test memoization of session by ID selector
       * Verifies factory-created selectors are memoized
       */
      it('should be memoized', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(2);

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const selector = selectSessionById(sessions[0].id);

        const result1 = selector(state);
        const result2 = selector(state);

        expect(result1).toBe(result2);
      });
    });

    describe('selectSessionCount', () => {
      /**
       * Test session count selector
       * Verifies selector returns correct session count
       */
      it('should count sessions correctly', () => {
        const store = createTestStore();
        let state = store.getState();

        expect(selectSessionCount(state)).toBe(0);

        const sessions = createMockSessionList(5);
        store.dispatch(setSessions(sessions));
        state = store.getState();

        expect(selectSessionCount(state)).toBe(5);
      });
    });

    describe('selectSessionStats', () => {
      /**
       * Test comprehensive session statistics selector
       * Verifies selector calculates session stats correctly
       */
      it('should calculate session statistics', () => {
        const store = createTestStore();
        const sessions = [
          createMockSession({ id: 'active1', isActive: true }),
          createMockSession({ id: 'active2', isActive: true }),
          createMockSession({ id: 'inactive1', isActive: false }),
        ];
        const currentSession = sessions[0];

        store.dispatch(setSessions(sessions));
        store.dispatch(setCurrentSession(currentSession));
        const state = store.getState();
        const result = selectSessionStats(state);

        expect(result).toEqual({
          total: 3,
          active: 2,
          inactive: 1,
          hasCurrentSession: true,
          currentSessionId: currentSession.id,
        });
      });

      /**
       * Test session stats without current session
       * Verifies stats handle null current session
       */
      it('should handle no current session', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(2, { isActive: false });

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const result = selectSessionStats(state);

        expect(result).toEqual({
          total: 2,
          active: 0,
          inactive: 2,
          hasCurrentSession: false,
          currentSessionId: null,
        });
      });
    });

    describe('selectSessionsSortedByDate', () => {
      /**
       * Test sessions sorted by creation date
       * Verifies selector sorts sessions by creation time
       */
      it('should sort sessions by creation date', () => {
        const store = createTestStore();
        const now = Date.now();
        const sessions = [
          createMockSession({ id: 'old', created: new Date(now - 3600000).toISOString() }),
          createMockSession({ id: 'newest', created: new Date(now).toISOString() }),
          createMockSession({ id: 'middle', created: new Date(now - 1800000).toISOString() }),
        ];

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const result = selectSessionsSortedByDate(state);

        expect(result.map(s => s.id)).toEqual(['newest', 'middle', 'old']);
      });

      /**
       * Test array immutability in sorted selector
       * Verifies sorted selector doesn't mutate original array
       */
      it('should not mutate original sessions array', () => {
        const store = createTestStore();
        const sessions = createMockSessionList(3);

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const originalSessions = selectSessions(state);
        const sortedSessions = selectSessionsSortedByDate(state);

        expect(sortedSessions).not.toBe(originalSessions);
        expect(originalSessions).toEqual(sessions); // Original order preserved
      });
    });

    describe('selectSessionsSortedByActivity', () => {
      /**
       * Test sessions sorted by last activity
       * Verifies selector sorts by activity with fallback to creation
       */
      it('should sort sessions by last activity', () => {
        const store = createTestStore();
        const now = Date.now();
        const sessions = [
          createMockSession({
            id: 'old-activity',
            created: new Date(now - 7200000).toISOString(),
            lastActivity: new Date(now - 3600000).toISOString(),
          }),
          createMockSession({
            id: 'recent-activity',
            created: new Date(now - 7200000).toISOString(),
            lastActivity: new Date(now - 600000).toISOString(),
          }),
          createMockSession({
            id: 'no-activity',
            created: new Date(now - 900000).toISOString(), // More recent creation than old-activity's lastActivity
          }),
        ];

        store.dispatch(setSessions(sessions));
        const state = store.getState();
        const result = selectSessionsSortedByActivity(state);

        expect(result.map(s => s.id)).toEqual(['no-activity', 'recent-activity', 'old-activity']);
      });
    });
  });

  describe('Combined Selectors', () => {
    describe('selectAppStatus', () => {
      /**
       * Test comprehensive app status selector
       * Verifies selector combines auth and session status
       */
      it('should create comprehensive app status', () => {
        const store = createTestStore();
        const mockConfig = createMockConnectionConfig();
        const sessions = createMockSessionList(2, { isActive: true });

        store.dispatch(setConnectionConfig(mockConfig));
        store.dispatch(setConnected(true));
        store.dispatch(setSessions(sessions));
        store.dispatch(setLoading(true));

        const state = store.getState();
        const result = selectAppStatus(state);

        expect(result).toHaveProperty('auth');
        expect(result).toHaveProperty('sessions');
        expect(result.auth.isConnected).toBe(true);
        expect(result.sessions.total).toBe(2);
        expect(result.sessions.isLoading).toBe(true);
        expect(result.isFullyConnected).toBe(true);
        expect(result.hasAnyError).toBe(false);
        expect(result.isAnyLoading).toBe(true);
      });

      /**
       * Test app status with errors
       * Verifies error detection across auth and session states
       */
      it('should detect errors across auth and session states', () => {
        const store = createTestStore();

        store.dispatch(setError('Auth error'));
        store.dispatch(setSessionError('Session error'));

        const state = store.getState();
        const result = selectAppStatus(state);

        expect(result.hasAnyError).toBe(true);
        expect(result.auth.hasError).toBe(true);
        expect(result.sessions.hasError).toBe(true);
        expect(result.isFullyConnected).toBe(false);
      });
    });

    describe('selectTerminalDisplay', () => {
      /**
       * Test terminal display data selector
       * Verifies selector combines session and output data for UI
       */
      it('should create terminal display data', () => {
        const store = createTestStore();
        const mockSession = createMockSession({
          name: 'Test Terminal',
          isActive: true,
        });
        const outputs = ['$ ls', 'file1.txt file2.txt', '$ pwd', '/home/user'];

        store.dispatch(setCurrentSession(mockSession));
        outputs.forEach(output => store.dispatch(addTerminalOutput(output)));

        const state = store.getState();
        const result = selectTerminalDisplay(state);

        expect(result).toEqual({
          sessionName: 'Test Terminal',
          sessionId: mockSession.id,
          isSessionActive: true,
          outputLines: outputs,
          lineCount: 4,
          hasSession: true,
        });
      });

      /**
       * Test terminal display without session
       * Verifies selector handles null session correctly
       */
      it('should handle no current session', () => {
        const store = createTestStore();
        store.dispatch(addTerminalOutput('orphaned output'));

        const state = store.getState();
        const result = selectTerminalDisplay(state);

        expect(result).toEqual({
          sessionName: null,
          sessionId: null,
          isSessionActive: false,
          outputLines: ['orphaned output'],
          lineCount: 1,
          hasSession: false,
        });
      });
    });
  });

  describe('Selector Performance', () => {
    /**
     * Test selector memoization performance
     * Verifies selectors don't recompute with unchanged state
     */
    it('should maintain memoization across multiple calls', () => {
      const store = createTestStore();
      const sessions = createMockSessionList(100);

      store.dispatch(setSessions(sessions));
      const state = store.getState();

      // Test multiple complex selectors
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        selectActiveSessions(state);
        selectSessionStats(state);
        selectSessionsSortedByDate(state);
        selectAppStatus(state);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast due to memoization
    });

    /**
     * Test memory efficiency of selectors
     * Verifies selectors don't create excessive object allocations
     */
    it('should be memory efficient', () => {
      const store = createTestStore();
      const sessions = createMockSessionList(10);

      store.dispatch(setSessions(sessions));
      const state = store.getState();

      // Multiple calls should return same object references
      const stats1 = selectSessionStats(state);
      const stats2 = selectSessionStats(state);
      const activeSessions1 = selectActiveSessions(state);
      const activeSessions2 = selectActiveSessions(state);

      expect(stats1).toBe(stats2);
      expect(activeSessions1).toBe(activeSessions2);
    });
  });
});