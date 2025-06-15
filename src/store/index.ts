/**
 * Zustand store for global application state management
 * @description Centralized state management for SSH connections, sessions, and app settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { SSHConnection, TmuxSession, AppSettings, AppState } from '../types';
import { createSSHConnection, SSHClientWrapper } from '../utils/ssh';
import { TmuxManager } from '../utils/tmux';

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
 * SSH client storage for active connections
 * @description Map of connection IDs to SSH clients
 */
const sshClients = new Map<string, SSHClientWrapper>();

/**
 * Tmux manager storage for active connections
 * @description Map of connection IDs to tmux managers
 */
const tmuxManagers = new Map<string, TmuxManager>();

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
  testConnection: (connection: SSHConnection) => Promise<boolean>;

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
        if (!connection) {
          throw new Error('Connection not found');
        }

        try {
          // Close existing connection if any
          const existingClient = sshClients.get(connectionId);
          if (existingClient) {
            await existingClient.disconnect();
            sshClients.delete(connectionId);
          }

          // Create new SSH connection
          const sshClient = await createSSHConnection(connection);
          sshClients.set(connectionId, sshClient);

          // Create tmux manager for this connection
          const tmuxManager = new TmuxManager(sshClient, connectionId);
          tmuxManagers.set(connectionId, tmuxManager);

          // Update connection status
          set(state => ({
            connections: state.connections.map(conn =>
              conn.id === connectionId
                ? {
                    ...conn,
                    isConnected: true,
                    lastConnected: new Date(),
                    connectionError: undefined,
                  }
                : conn
            ),
            activeConnectionId: connectionId,
          }));

          // Refresh sessions after successful connection
          await get().refreshSessions(connectionId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Connection failed';

          // Update connection with error state
          set(state => ({
            connections: state.connections.map(conn =>
              conn.id === connectionId
                ? {
                    ...conn,
                    isConnected: false,
                    connectionError: errorMessage,
                  }
                : conn
            ),
          }));

          console.error('SSH connection failed:', error);
          throw error;
        }
      },

      disconnectFromServer: async (connectionId: string) => {
        try {
          // Close SSH connection
          const sshClient = sshClients.get(connectionId);
          if (sshClient) {
            await sshClient.disconnect();
            sshClients.delete(connectionId);
          }

          // Clean up tmux manager
          tmuxManagers.delete(connectionId);

          // Update state
          set(state => ({
            connections: state.connections.map(conn =>
              conn.id === connectionId
                ? { ...conn, isConnected: false, connectionError: undefined }
                : conn
            ),
            activeConnectionId:
              state.activeConnectionId === connectionId
                ? undefined
                : state.activeConnectionId,
            sessions: state.sessions.filter(
              session => session.connectionId !== connectionId
            ),
          }));
        } catch (error) {
          console.warn('Error during disconnect:', error);
          // Force update state even if disconnect fails
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
        }
      },

      testConnection: async (connection: SSHConnection) => {
        try {
          const sshClient = await createSSHConnection(connection);
          await sshClient.executeCommand('echo "test"');
          await sshClient.disconnect();
          return true;
        } catch (error) {
          console.error('Connection test failed:', error);
          return false;
        }
      },

      // Session management actions
      refreshSessions: async (connectionId: string) => {
        const connection = get().connections.find(c => c.id === connectionId);
        if (!connection || !connection.isConnected) return;

        try {
          const tmuxManager = tmuxManagers.get(connectionId);
          if (!tmuxManager) {
            throw new Error('Tmux manager not found for connection');
          }

          // Get actual tmux sessions from server
          const sessions = await tmuxManager.refreshSessions();

          // Update store with real session data
          set(state => ({
            sessions: [
              // Remove existing sessions for this connection
              ...state.sessions.filter(s => s.connectionId !== connectionId),
              // Add fresh session data
              ...sessions,
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
          const tmuxManager = tmuxManagers.get(connectionId);
          if (!tmuxManager) {
            throw new Error('Tmux manager not found for connection');
          }

          // Create actual tmux session
          const sessionName = await tmuxManager.createSession(name);

          // Refresh sessions to get updated list including the new session
          await get().refreshSessions(connectionId);

          return `${connectionId}-${sessionName}`;
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
          // Find the session to get connection info
          const session = get().sessions.find(s => s.id === sessionId);
          if (!session) {
            throw new Error('Session not found');
          }

          const tmuxManager = tmuxManagers.get(session.connectionId);
          if (!tmuxManager) {
            throw new Error('Tmux manager not found for connection');
          }

          // Kill actual tmux session
          await tmuxManager.killSession(session.name);

          // Update store state
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
      sendCommand: async (sessionId: string, command: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        const tmuxManager = tmuxManagers.get(session.connectionId);
        if (!tmuxManager) {
          throw new Error('Tmux manager not available');
        }

        try {
          // Send command to tmux session through manager
          await tmuxManager.sendCommand(session.name, command);

          // Update session last activity
          set(state => ({
            sessions: state.sessions.map(s =>
              s.id === sessionId ? { ...s, lastActivity: new Date() } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to send command:', error);
          throw error;
        }
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
