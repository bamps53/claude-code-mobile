/**
 * Unit tests for sessionSlice Redux slice
 * Tests all actions, reducers, and state transitions for session management
 */

import sessionSlice, {
  setSessions,
  addSession,
  removeSession,
  setCurrentSession,
  setLoading,
  setError,
  clearError,
  addTerminalOutput,
  clearTerminalOutput,
  Session,
} from '../sessionSlice';
import { createTestStore, createMockSession, createMockSessionList } from '../../test-utils/store-utils';

describe('sessionSlice', () => {
  describe('initial state', () => {
    /**
     * Test initial state with empty session list
     * Verifies the session slice starts with expected default values
     */
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().session;

      expect(state).toEqual({
        sessions: [],
        currentSession: null,
        isLoading: false,
        error: null,
        terminalOutput: [],
      });
    });
  });

  describe('setSessions action', () => {
    /**
     * Test setSessions action for bulk updates
     * Verifies session list can be set with multiple sessions
     */
    it('should set session list', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(3);

      store.dispatch(setSessions(mockSessions));
      const state = store.getState().session;

      expect(state.sessions).toEqual(mockSessions);
      expect(state.sessions).toHaveLength(3);
    });

    /**
     * Test replacing existing session list
     * Verifies complete replacement of session data
     */
    it('should replace existing session list', () => {
      const store = createTestStore();
      const firstSessions = createMockSessionList(2);
      const secondSessions = createMockSessionList(3, { isActive: false });

      store.dispatch(setSessions(firstSessions));
      store.dispatch(setSessions(secondSessions));
      const state = store.getState().session;

      expect(state.sessions).toEqual(secondSessions);
      expect(state.sessions).toHaveLength(3);
    });

    /**
     * Test setting empty session list
     * Verifies session list can be cleared
     */
    it('should handle empty session list', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(2);

      // First set sessions, then clear
      store.dispatch(setSessions(mockSessions));
      store.dispatch(setSessions([]));
      const state = store.getState().session;

      expect(state.sessions).toEqual([]);
      expect(state.sessions).toHaveLength(0);
    });
  });

  describe('addSession action', () => {
    /**
     * Test addSession action and state update
     * Verifies new sessions are added to the list
     */
    it('should add session to empty list', () => {
      const store = createTestStore();
      const mockSession = createMockSession();

      store.dispatch(addSession(mockSession));
      const state = store.getState().session;

      expect(state.sessions).toContain(mockSession);
      expect(state.sessions).toHaveLength(1);
    });

    /**
     * Test adding session to existing list
     * Verifies sessions accumulate in the list
     */
    it('should add session to existing list', () => {
      const store = createTestStore();
      const existingSessions = createMockSessionList(2);
      const newSession = createMockSession({
        id: 'new-session',
        name: 'New Session',
      });

      store.dispatch(setSessions(existingSessions));
      store.dispatch(addSession(newSession));
      const state = store.getState().session;

      expect(state.sessions).toHaveLength(3);
      expect(state.sessions).toContain(newSession);
      expect(state.sessions[2]).toEqual(newSession);
    });

    /**
     * Test adding duplicate session IDs
     * Verifies behavior when adding sessions with same ID
     */
    it('should add duplicate session IDs', () => {
      const store = createTestStore();
      const session1 = createMockSession({ id: 'duplicate', name: 'First' });
      const session2 = createMockSession({ id: 'duplicate', name: 'Second' });

      store.dispatch(addSession(session1));
      store.dispatch(addSession(session2));
      const state = store.getState().session;

      expect(state.sessions).toHaveLength(2);
      expect(state.sessions[0].name).toBe('First');
      expect(state.sessions[1].name).toBe('Second');
    });
  });

  describe('removeSession action', () => {
    /**
     * Test removeSession action and state cleanup
     * Verifies sessions are removed from the list
     */
    it('should remove session from list', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(3);
      const sessionToRemove = mockSessions[1].id;

      store.dispatch(setSessions(mockSessions));
      store.dispatch(removeSession(sessionToRemove));
      const state = store.getState().session;

      expect(state.sessions).toHaveLength(2);
      expect(state.sessions.find((s: Session) => s.id === sessionToRemove)).toBeUndefined();
    });

    /**
     * Test removing non-existent session
     * Verifies safe handling of invalid session IDs
     */
    it('should handle removing non-existent session', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(2);

      store.dispatch(setSessions(mockSessions));
      store.dispatch(removeSession('non-existent-id'));
      const state = store.getState().session;

      expect(state.sessions).toEqual(mockSessions);
      expect(state.sessions).toHaveLength(2);
    });

    /**
     * Test removing current session
     * Verifies current session is cleared when removed
     */
    it('should clear current session when removing it', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(3);
      const currentSession = mockSessions[1];

      store.dispatch(setSessions(mockSessions));
      store.dispatch(setCurrentSession(currentSession));
      store.dispatch(removeSession(currentSession.id));
      const state = store.getState().session;

      expect(state.sessions).toHaveLength(2);
      expect(state.currentSession).toBeNull();
    });

    /**
     * Test removing session that is not current
     * Verifies current session remains unchanged
     */
    it('should not affect current session when removing different session', () => {
      const store = createTestStore();
      const mockSessions = createMockSessionList(3);
      const currentSession = mockSessions[0];
      const sessionToRemove = mockSessions[2];

      store.dispatch(setSessions(mockSessions));
      store.dispatch(setCurrentSession(currentSession));
      store.dispatch(removeSession(sessionToRemove.id));
      const state = store.getState().session;

      expect(state.sessions).toHaveLength(2);
      expect(state.currentSession).toEqual(currentSession);
    });
  });

  describe('setCurrentSession action', () => {
    /**
     * Test setCurrentSession action
     * Verifies current session is set and terminal output is cleared
     */
    it('should set current session and clear terminal output', () => {
      const store = createTestStore();
      const mockSession = createMockSession();

      // Add some terminal output first
      store.dispatch(addTerminalOutput('previous output'));
      store.dispatch(setCurrentSession(mockSession));
      const state = store.getState().session;

      expect(state.currentSession).toEqual(mockSession);
      expect(state.terminalOutput).toEqual([]);
    });

    /**
     * Test setting current session to null
     * Verifies current session can be cleared
     */
    it('should handle setting current session to null', () => {
      const store = createTestStore();
      const mockSession = createMockSession();

      // Set session then clear it
      store.dispatch(setCurrentSession(mockSession));
      store.dispatch(setCurrentSession(null));
      const state = store.getState().session;

      expect(state.currentSession).toBeNull();
    });

    /**
     * Test changing current session
     * Verifies switching between sessions clears terminal output
     */
    it('should clear terminal output when changing sessions', () => {
      const store = createTestStore();
      const session1 = createMockSession({ id: 'session1', name: 'Session 1' });
      const session2 = createMockSession({ id: 'session2', name: 'Session 2' });

      // Set first session and add output
      store.dispatch(setCurrentSession(session1));
      store.dispatch(addTerminalOutput('output from session 1'));
      
      // Switch to second session
      store.dispatch(setCurrentSession(session2));
      const state = store.getState().session;

      expect(state.currentSession).toEqual(session2);
      expect(state.terminalOutput).toEqual([]);
    });
  });

  describe('setLoading action', () => {
    /**
     * Test setLoading action with true value
     * Verifies loading state is set correctly
     */
    it('should set loading to true', () => {
      const store = createTestStore();

      store.dispatch(setLoading(true));
      const state = store.getState().session;

      expect(state.isLoading).toBe(true);
    });

    /**
     * Test setLoading action with false value
     * Verifies loading state can be cleared
     */
    it('should set loading to false', () => {
      const store = createTestStore();

      store.dispatch(setLoading(true));
      store.dispatch(setLoading(false));
      const state = store.getState().session;

      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError action', () => {
    /**
     * Test setError action and automatic loading state reset
     * Verifies error handling stops loading state
     */
    it('should set error and reset loading state', () => {
      const store = createTestStore();
      const errorMessage = 'Session creation failed';

      store.dispatch(setLoading(true));
      store.dispatch(setError(errorMessage));
      const state = store.getState().session;

      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });

    /**
     * Test error message replacement
     * Verifies new errors replace existing ones
     */
    it('should replace existing error message', () => {
      const store = createTestStore();

      store.dispatch(setError('First error'));
      store.dispatch(setError('Second error'));
      const state = store.getState().session;

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
      const mockSession = createMockSession();

      store.dispatch(setCurrentSession(mockSession));
      store.dispatch(setError('Test error'));
      store.dispatch(clearError());
      const state = store.getState().session;

      expect(state.error).toBeNull();
      expect(state.currentSession).toEqual(mockSession);
    });
  });

  describe('addTerminalOutput action', () => {
    /**
     * Test addTerminalOutput action
     * Verifies terminal output is appended to the list
     */
    it('should add terminal output to empty list', () => {
      const store = createTestStore();
      const output = 'Hello, terminal!';

      store.dispatch(addTerminalOutput(output));
      const state = store.getState().session;

      expect(state.terminalOutput).toEqual([output]);
    });

    /**
     * Test adding multiple terminal outputs
     * Verifies outputs accumulate in order
     */
    it('should append terminal output to existing list', () => {
      const store = createTestStore();
      const outputs = ['First line', 'Second line', 'Third line'];

      outputs.forEach(output => store.dispatch(addTerminalOutput(output)));
      const state = store.getState().session;

      expect(state.terminalOutput).toEqual(outputs);
      expect(state.terminalOutput).toHaveLength(3);
    });

    /**
     * Test adding empty terminal output
     * Verifies empty strings are handled correctly
     */
    it('should handle empty terminal output', () => {
      const store = createTestStore();

      store.dispatch(addTerminalOutput(''));
      const state = store.getState().session;

      expect(state.terminalOutput).toEqual(['']);
    });
  });

  describe('clearTerminalOutput action', () => {
    /**
     * Test clearTerminalOutput action
     * Verifies terminal output can be cleared
     */
    it('should clear terminal output', () => {
      const store = createTestStore();

      // Add some output first
      store.dispatch(addTerminalOutput('Line 1'));
      store.dispatch(addTerminalOutput('Line 2'));
      store.dispatch(clearTerminalOutput());
      const state = store.getState().session;

      expect(state.terminalOutput).toEqual([]);
    });

    /**
     * Test clearing empty terminal output
     * Verifies action is safe when no output exists
     */
    it('should handle clearing empty terminal output', () => {
      const store = createTestStore();

      store.dispatch(clearTerminalOutput());
      const state = store.getState().session;

      expect(state.terminalOutput).toEqual([]);
    });
  });

  describe('session metadata handling', () => {
    /**
     * Test session creation time and last activity
     * Verifies session metadata is preserved correctly
     */
    it('should preserve session metadata', () => {
      const store = createTestStore();
      const now = new Date().toISOString();
      const sessionWithMetadata = createMockSession({
        created: now,
        lastActivity: now,
      });

      store.dispatch(addSession(sessionWithMetadata));
      const state = store.getState().session;

      expect(state.sessions[0].created).toBe(now);
      expect(state.sessions[0].lastActivity).toBe(now);
    });

    /**
     * Test session without lastActivity
     * Verifies optional metadata fields are handled
     */
    it('should handle sessions without lastActivity', () => {
      const store = createTestStore();
      const sessionWithoutActivity: Session = {
        id: 'test-session',
        name: 'Test Session',
        created: new Date().toISOString(),
        isActive: true,
      };

      store.dispatch(addSession(sessionWithoutActivity));
      const state = store.getState().session;

      expect(state.sessions[0].lastActivity).toBeUndefined();
    });
  });

  describe('concurrent session management', () => {
    /**
     * Test managing multiple active sessions
     * Verifies handling of concurrent sessions
     */
    it('should handle multiple active sessions', () => {
      const store = createTestStore();
      const activeSessions = createMockSessionList(3, { isActive: true });

      store.dispatch(setSessions(activeSessions));
      const state = store.getState().session;

      const activeCount = state.sessions.filter((s: Session) => s.isActive).length;
      expect(activeCount).toBe(3);
    });

    /**
     * Test session status updates
     * Verifies session active/inactive state management
     */
    it('should maintain session status correctly', () => {
      const store = createTestStore();
      const sessions = [
        createMockSession({ id: 'active1', isActive: true }),
        createMockSession({ id: 'inactive1', isActive: false }),
        createMockSession({ id: 'active2', isActive: true }),
      ];

      store.dispatch(setSessions(sessions));
      const state = store.getState().session;

      const activeSessions = state.sessions.filter((s: Session) => s.isActive);
      const inactiveSessions = state.sessions.filter((s: Session) => !s.isActive);

      expect(activeSessions).toHaveLength(2);
      expect(inactiveSessions).toHaveLength(1);
    });
  });

  describe('complex session scenarios', () => {
    /**
     * Test complete session lifecycle
     * Verifies realistic session management flow
     */
    it('should handle complete session lifecycle', () => {
      const store = createTestStore();
      const newSession = createMockSession();

      // 1. Add session
      store.dispatch(addSession(newSession));
      expect(store.getState().session.sessions).toHaveLength(1);

      // 2. Set as current session
      store.dispatch(setCurrentSession(newSession));
      expect(store.getState().session.currentSession).toEqual(newSession);

      // 3. Add terminal output
      store.dispatch(addTerminalOutput('$ ls'));
      store.dispatch(addTerminalOutput('file1.txt file2.txt'));
      expect(store.getState().session.terminalOutput).toHaveLength(2);

      // 4. Remove session
      store.dispatch(removeSession(newSession.id));
      const finalState = store.getState().session;
      expect(finalState.sessions).toHaveLength(0);
      expect(finalState.currentSession).toBeNull();
    });

    /**
     * Test session switching workflow
     * Verifies proper state management when switching between sessions
     */
    it('should handle session switching workflow', () => {
      const store = createTestStore();
      const session1 = createMockSession({ id: 'session1', name: 'Session 1' });
      const session2 = createMockSession({ id: 'session2', name: 'Session 2' });

      // Add both sessions
      store.dispatch(addSession(session1));
      store.dispatch(addSession(session2));

      // Work with first session
      store.dispatch(setCurrentSession(session1));
      store.dispatch(addTerminalOutput('Working in session 1'));

      // Switch to second session
      store.dispatch(setCurrentSession(session2));
      const state = store.getState().session;

      expect(state.currentSession).toEqual(session2);
      expect(state.terminalOutput).toEqual([]); // Should be cleared
      expect(state.sessions).toHaveLength(2);
    });

    /**
     * Test error recovery scenario
     * Verifies error handling during session operations
     */
    it('should handle error recovery scenario', () => {
      const store = createTestStore();

      // Start loading
      store.dispatch(setLoading(true));

      // Error occurs
      store.dispatch(setError('Failed to create session'));
      expect(store.getState().session.isLoading).toBe(false);
      expect(store.getState().session.error).toBe('Failed to create session');

      // Clear error and retry
      store.dispatch(clearError());
      store.dispatch(setLoading(true));
      
      // Success
      const newSession = createMockSession();
      store.dispatch(addSession(newSession));
      store.dispatch(setLoading(false));

      const finalState = store.getState().session;
      expect(finalState.error).toBeNull();
      expect(finalState.isLoading).toBe(false);
      expect(finalState.sessions).toContain(newSession);
    });
  });
});