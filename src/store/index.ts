/**
 * Zustand store for global application state management
 * @description Centralized state management for SSH connections, sessions, and app settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { SSHConnection, TmuxSession, AppSettings, AppState } from '../types';

/**
 * Secure storage adapter for Zustand persist middleware
 * @description Uses Expo SecureStore for sensitive data persistence
 */
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

/**
 * App state store interface
 * @description Defines all state properties and actions for the application
 */
interface AppStore extends AppState {
  // Authentication actions
  setAuthenticated: (authenticated: boolean) => void;

  // Connection management actions
  addConnection: (connection: Omit<SSHConnection, 'id' | 'isConnected'>) => void;
  updateConnection: (id: string, updates: Partial<SSHConnection>) => void;
  removeConnection: (id: string) => void;
  connectToServer: (connectionId: string) => Promise<void>;
  disconnectFromServer: (connectionId: string) => void;

  // Session management actions
  refreshSessions: (connectionId: string) => Promise<void>;
  createSession: (connectionId: string, name?: string) => Promise<string>;
  attachToSession: (sessionId: string) => void;
  killSession: (sessionId: string) => Promise<void>;

  // Terminal actions
  sendCommand: (sessionId: string, command: string) => void;

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Data management actions
  clearAllData: () => void;
}

/**
 * Default application settings
 * @description Initial settings configuration
 */
const defaultSettings: AppSettings = {
  theme: 'auto',
  fontSize: 14,
  autoTimeout: 15,
  enableBiometrics: true,
  notificationsEnabled: true,
};

/**
 * Main application store using Zustand
 * @description Provides centralized state management with persistence
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      connections: [],
      sessions: [],
      activeConnectionId: undefined,
      activeSessionId: undefined,
      isAuthenticated: false,
      settings: defaultSettings,

      // Authentication actions
      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },

      // Connection management actions
      addConnection: connectionData => {
        const newConnection: SSHConnection = {
          ...connectionData,
          id: Date.now().toString(),
          isConnected: false,
        };

        set(state => ({
          connections: [...state.connections, newConnection],
        }));
      },

      updateConnection: (id: string, updates: Partial<SSHConnection>) => {
        set(state => ({
          connections: state.connections.map(conn =>
            conn.id === id ? { ...conn, ...updates } : conn
          ),
        }));
      },

      removeConnection: (id: string) => {
        set(state => ({
          connections: state.connections.filter(conn => conn.id !== id),
          activeConnectionId:
            state.activeConnectionId === id ? undefined : state.activeConnectionId,
          sessions: state.sessions.filter(session => session.connectionId !== id),
        }));
      },

      connectToServer: async (connectionId: string) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection) return;

        try {
          // TODO: Implement actual SSH connection using @dylankenneally/react-native-ssh-sftp
          // For now, simulate connection
          set(state => ({
            connections: state.connections.map(conn =>
              conn.id === connectionId
                ? { ...conn, isConnected: true, lastConnected: new Date() }
                : conn
            ),
            activeConnectionId: connectionId,
          }));

          // Refresh sessions after connection
          await get().refreshSessions(connectionId);
        } catch (error) {
          console.error('Connection failed:', error);
          throw error;
        }
      },

      disconnectFromServer: (connectionId: string) => {
        set(state => ({
          connections: state.connections.map(conn =>
            conn.id === connectionId ? { ...conn, isConnected: false } : conn
          ),
          activeConnectionId:
            state.activeConnectionId === connectionId
              ? undefined
              : state.activeConnectionId,
          sessions: state.sessions.filter(
            session => session.connectionId !== connectionId
          ),
        }));
      },

      // Session management actions
      refreshSessions: async (connectionId: string) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection || !connection.isConnected) return;

        try {
          // TODO: Implement actual tmux session listing
          // For now, simulate with mock data
          const mockSessions: TmuxSession[] = [
            {
              id: 'session-1',
              name: 'claude-code-main',
              created: new Date(Date.now() - 3600000),
              lastActivity: new Date(Date.now() - 300000),
              windowCount: 2,
              isActive: true,
              connectionId,
            },
            {
              id: 'session-2',
              name: 'development',
              created: new Date(Date.now() - 7200000),
              lastActivity: new Date(Date.now() - 1800000),
              windowCount: 1,
              isActive: false,
              connectionId,
            },
          ];

          set(state => ({
            sessions: [
              ...state.sessions.filter(s => s.connectionId !== connectionId),
              ...mockSessions,
            ],
          }));
        } catch (error) {
          console.error('Failed to refresh sessions:', error);
          throw error;
        }
      },

      createSession: async (connectionId: string, name?: string) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection || !connection.isConnected) {
          throw new Error('Connection not available');
        }

        try {
          // TODO: Implement actual tmux session creation
          const sessionName = name || `session-${Date.now()}`;
          const newSession: TmuxSession = {
            id: `session-${Date.now()}`,
            name: sessionName,
            created: new Date(),
            lastActivity: new Date(),
            windowCount: 1,
            isActive: true,
            connectionId,
          };

          set(state => ({
            sessions: [...state.sessions, newSession],
          }));

          return newSession.id;
        } catch (error) {
          console.error('Failed to create session:', error);
          throw error;
        }
      },

      attachToSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });

        // Update session as active
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, isActive: true, lastActivity: new Date() }
              : session
          ),
        }));
      },

      killSession: async (sessionId: string) => {
        try {
          // TODO: Implement actual tmux session killing
          set(state => ({
            sessions: state.sessions.filter(s => s.id !== sessionId),
            activeSessionId:
              state.activeSessionId === sessionId ? undefined : state.activeSessionId,
          }));
        } catch (error) {
          console.error('Failed to kill session:', error);
          throw error;
        }
      },

      // Terminal actions
      sendCommand: (sessionId: string, command: string) => {
        // TODO: Implement actual command sending via SSH
        console.log(`Sending command to session ${sessionId}:`, command);

        // Update session last activity
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, lastActivity: new Date() }
              : session
          ),
        }));
      },

      // Settings actions
      updateSettings: (newSettings: Partial<AppSettings>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Data management actions
      clearAllData: () => {
        set({
          connections: [],
          sessions: [],
          activeConnectionId: undefined,
          activeSessionId: undefined,
          isAuthenticated: false,
          settings: defaultSettings,
        });
      },
    }),
    {
      name: 'claude-code-mobile-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: state => ({
        connections: state.connections,
        settings: state.settings,
        // Don't persist authentication state and active sessions
      }),
    }
  )
);
