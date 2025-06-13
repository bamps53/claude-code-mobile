/**
 * Redux selectors for efficient state access and derived state computation
 * Provides memoized selectors for auth and session state with performance optimization
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { ConnectionConfig } from './authSlice';
import type { Session } from './sessionSlice';

// ===== AUTH SELECTORS =====

/**
 * Select auth slice state
 * @description Base selector for auth state access
 * @param state - Root Redux state
 * @returns Auth state object
 */
export const selectAuth = (state: RootState) => state.auth;

/**
 * Select connection status
 * @description Memoized selector for connection status
 * @param state - Root Redux state
 * @returns Boolean indicating if connected to server
 * @example
 * ```typescript
 * const isConnected = useSelector(selectIsConnected);
 * ```
 */
export const selectIsConnected = createSelector(
  [selectAuth],
  (auth) => auth.isConnected
);

/**
 * Select connection configuration
 * @description Memoized selector for connection config
 * @param state - Root Redux state
 * @returns Connection configuration object or null
 */
export const selectConnectionConfig = createSelector(
  [selectAuth],
  (auth) => auth.connectionConfig
);

/**
 * Select connecting status
 * @description Memoized selector for connecting state
 * @param state - Root Redux state
 * @returns Boolean indicating if currently connecting
 */
export const selectIsConnecting = createSelector(
  [selectAuth],
  (auth) => auth.isConnecting
);

/**
 * Select auth error
 * @description Memoized selector for auth error state
 * @param state - Root Redux state
 * @returns Error message string or null
 */
export const selectAuthError = createSelector(
  [selectAuth],
  (auth) => auth.error
);

/**
 * Select connection info for display
 * @description Derived selector combining connection config and status
 * @param state - Root Redux state
 * @returns Object with connection display information
 * @example
 * ```typescript
 * const connectionInfo = useSelector(selectConnectionInfo);
 * // { hostname: 'server.com', username: 'user', isConnected: true }
 * ```
 */
export const selectConnectionInfo = createSelector(
  [selectConnectionConfig, selectIsConnected],
  (config, isConnected) => ({
    hostname: config?.hostname || null,
    username: config?.username || null,
    port: config?.port || null,
    isConnected,
  })
);

/**
 * Select auth status summary
 * @description Comprehensive auth status for UI components
 * @param state - Root Redux state
 * @returns Combined auth status object
 */
export const selectAuthStatus = createSelector(
  [selectIsConnected, selectIsConnecting, selectAuthError],
  (isConnected, isConnecting, error) => ({
    isConnected,
    isConnecting,
    hasError: error !== null,
    error,
    status: error ? 'error' : isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected',
  })
);

// ===== SESSION SELECTORS =====

/**
 * Select session slice state
 * @description Base selector for session state access
 * @param state - Root Redux state
 * @returns Session state object
 */
export const selectSession = (state: RootState) => state.session;

/**
 * Select all sessions
 * @description Memoized selector for session list
 * @param state - Root Redux state
 * @returns Array of all sessions
 */
export const selectSessions = createSelector(
  [selectSession],
  (session) => session.sessions
);

/**
 * Select current session
 * @description Memoized selector for active session
 * @param state - Root Redux state
 * @returns Current session object or null
 */
export const selectCurrentSession = createSelector(
  [selectSession],
  (session) => session.currentSession
);

/**
 * Select session loading status
 * @description Memoized selector for session loading state
 * @param state - Root Redux state
 * @returns Boolean indicating if sessions are loading
 */
export const selectSessionLoading = createSelector(
  [selectSession],
  (session) => session.isLoading
);

/**
 * Select session error
 * @description Memoized selector for session error state
 * @param state - Root Redux state
 * @returns Error message string or null
 */
export const selectSessionError = createSelector(
  [selectSession],
  (session) => session.error
);

/**
 * Select terminal output
 * @description Memoized selector for terminal output lines
 * @param state - Root Redux state
 * @returns Array of terminal output strings
 */
export const selectTerminalOutput = createSelector(
  [selectSession],
  (session) => session.terminalOutput
);

/**
 * Select active sessions only
 * @description Derived selector filtering active sessions
 * @param state - Root Redux state
 * @returns Array of active sessions
 * @example
 * ```typescript
 * const activeSessions = useSelector(selectActiveSessions);
 * ```
 */
export const selectActiveSessions = createSelector(
  [selectSessions],
  (sessions) => sessions.filter(session => session.isActive)
);

/**
 * Select inactive sessions only
 * @description Derived selector filtering inactive sessions
 * @param state - Root Redux state
 * @returns Array of inactive sessions
 */
export const selectInactiveSessions = createSelector(
  [selectSessions],
  (sessions) => sessions.filter(session => !session.isActive)
);

/**
 * Select session by ID
 * @description Factory function creating memoized selector for specific session
 * @param sessionId - ID of session to select
 * @returns Selector function for the specified session
 * @example
 * ```typescript
 * const selectSpecificSession = selectSessionById('session-123');
 * const session = useSelector(selectSpecificSession);
 * ```
 */
export const selectSessionById = (sessionId: string) =>
  createSelector(
    [selectSessions],
    (sessions) => sessions.find(session => session.id === sessionId) || null
  );

/**
 * Select session count
 * @description Derived selector for total session count
 * @param state - Root Redux state
 * @returns Number of total sessions
 */
export const selectSessionCount = createSelector(
  [selectSessions],
  (sessions) => sessions.length
);

/**
 * Select session statistics
 * @description Comprehensive session statistics for dashboard
 * @param state - Root Redux state
 * @returns Object with session statistics
 * @example
 * ```typescript
 * const stats = useSelector(selectSessionStats);
 * // { total: 5, active: 2, inactive: 3, hasCurrentSession: true }
 * ```
 */
export const selectSessionStats = createSelector(
  [selectSessions, selectCurrentSession],
  (sessions, currentSession) => {
    const activeSessions = sessions.filter(s => s.isActive);
    const inactiveSessions = sessions.filter(s => !s.isActive);

    return {
      total: sessions.length,
      active: activeSessions.length,
      inactive: inactiveSessions.length,
      hasCurrentSession: currentSession !== null,
      currentSessionId: currentSession?.id || null,
    };
  }
);

/**
 * Select sessions sorted by creation date
 * @description Derived selector with sessions sorted by creation time
 * @param state - Root Redux state
 * @returns Array of sessions sorted by creation date (newest first)
 */
export const selectSessionsSortedByDate = createSelector(
  [selectSessions],
  (sessions) => [...sessions].sort((a, b) => 
    new Date(b.created).getTime() - new Date(a.created).getTime()
  )
);

/**
 * Select sessions sorted by last activity
 * @description Derived selector with sessions sorted by last activity
 * @param state - Root Redux state
 * @returns Array of sessions sorted by last activity (most recent first)
 */
export const selectSessionsSortedByActivity = createSelector(
  [selectSessions],
  (sessions) => [...sessions].sort((a, b) => {
    const aActivity = a.lastActivity || a.created;
    const bActivity = b.lastActivity || b.created;
    return new Date(bActivity).getTime() - new Date(aActivity).getTime();
  })
);

// ===== COMBINED SELECTORS =====

/**
 * Select overall app status
 * @description Combined selector for app-wide status information
 * @param state - Root Redux state
 * @returns Object with combined app status
 * @example
 * ```typescript
 * const appStatus = useSelector(selectAppStatus);
 * ```
 */
export const selectAppStatus = createSelector(
  [selectAuthStatus, selectSessionStats, selectSessionLoading, selectSessionError],
  (authStatus, sessionStats, sessionLoading, sessionError) => ({
    auth: authStatus,
    sessions: {
      ...sessionStats,
      isLoading: sessionLoading,
      hasError: sessionError !== null,
      error: sessionError,
    },
    isFullyConnected: authStatus.isConnected && !authStatus.hasError,
    hasAnyError: authStatus.hasError || sessionError !== null,
    isAnyLoading: authStatus.isConnecting || sessionLoading,
  })
);

/**
 * Select terminal display data
 * @description Combined selector for terminal UI rendering
 * @param state - Root Redux state
 * @returns Object with terminal display information
 */
export const selectTerminalDisplay = createSelector(
  [selectCurrentSession, selectTerminalOutput],
  (currentSession, terminalOutput) => ({
    sessionName: currentSession?.name || null,
    sessionId: currentSession?.id || null,
    isSessionActive: currentSession?.isActive || false,
    outputLines: terminalOutput,
    lineCount: terminalOutput.length,
    hasSession: currentSession !== null,
  })
);