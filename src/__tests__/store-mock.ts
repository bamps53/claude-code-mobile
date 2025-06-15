/**
 * Mock store for testing
 * @description Creates a clean store instance for each test
 */

import { create } from 'zustand';
import { SSHConnection, TmuxSession, AppSettings } from '../types';

// Create a simple mock store without persistence
export interface MockAppStore {
  connections: SSHConnection[];
  sessions: TmuxSession[];
  activeConnectionId?: string;
  activeSessionId?: string;
  isAuthenticated: boolean;
  settings: AppSettings;

  // Actions
  addConnection: (connection: Omit<SSHConnection, 'id' | 'isConnected'>) => void;
  updateConnection: (id: string, updates: Partial<SSHConnection>) => void;
  removeConnection: (id: string) => void;
  connectToServer: (connectionId: string) => Promise<void>;
  disconnectFromServer: (connectionId: string) => void;
  testConnection: (connection: SSHConnection) => Promise<boolean>;

  refreshSessions: (connectionId: string) => Promise<void>;
  createSession: (connectionId: string, name?: string) => Promise<string>;
  attachToSession: (sessionId: string) => void;
  killSession: (sessionId: string) => Promise<void>;
  sendCommand: (sessionId: string, command: string) => Promise<void>;

  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => void;
  setAuthenticated: (authenticated: boolean) => void;
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  fontSize: 14,
  autoTimeout: 15,
  enableBiometrics: true,
  notificationsEnabled: true,
};

export const createMockStore = () => {
  // Mock SSH clients and tmux managers for testing
  const mockSSHClients = new Map();
  const mockTmuxManagers = new Map();

  return create<MockAppStore>((set, get) => ({
    // Initial state
    connections: [],
    sessions: [],
    activeConnectionId: undefined,
    activeSessionId: undefined,
    isAuthenticated: false,
    settings: defaultSettings,

    // Actions
    addConnection: connectionData => {
      const newConnection: SSHConnection = {
        ...connectionData,
        id: Date.now().toString() + Math.random().toString(36),
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
        const existingClient = mockSSHClients.get(connectionId);
        if (existingClient) {
          await existingClient.disconnect();
          mockSSHClients.delete(connectionId);
        }

        // Mock SSH connection logic
        const { createSSHConnection } = require('../utils/ssh');
        const sshClient = await createSSHConnection(connection);
        mockSSHClients.set(connectionId, sshClient);

        // Mock tmux manager
        const { TmuxManager } = require('../utils/tmux');
        const tmuxManager = new TmuxManager(sshClient, connectionId);
        mockTmuxManagers.set(connectionId, tmuxManager);

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

        // Refresh sessions
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

        throw error;
      }
    },

    disconnectFromServer: async (connectionId: string) => {
      try {
        // Close SSH connection
        const sshClient = mockSSHClients.get(connectionId);
        if (sshClient) {
          await sshClient.disconnect();
          mockSSHClients.delete(connectionId);
        }

        // Clean up tmux manager
        mockTmuxManagers.delete(connectionId);

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
        const { createSSHConnection } = require('../utils/ssh');
        const client = await createSSHConnection(connection);
        await client.executeCommand('echo "test"');
        await client.disconnect();
        return true;
      } catch {
        return false;
      }
    },

    refreshSessions: async (connectionId: string) => {
      const connection = get().connections.find(c => c.id === connectionId);
      if (!connection || !connection.isConnected) return;

      const tmuxManager = mockTmuxManagers.get(connectionId);
      if (!tmuxManager) {
        throw new Error('Tmux manager not found for connection');
      }

      const sessions = await tmuxManager.refreshSessions();
      set(state => ({
        sessions: [
          ...state.sessions.filter(s => s.connectionId !== connectionId),
          ...sessions,
        ],
      }));
    },

    createSession: async (connectionId: string, name?: string) => {
      const connection = get().connections.find(c => c.id === connectionId);
      if (!connection || !connection.isConnected) {
        throw new Error('Connection not available');
      }

      const tmuxManager = mockTmuxManagers.get(connectionId);
      if (!tmuxManager) {
        throw new Error('Tmux manager not found for connection');
      }

      const sessionName = await tmuxManager.createSession(name);
      await get().refreshSessions(connectionId);
      return `${connectionId}-${sessionName}`;
    },

    attachToSession: (sessionId: string) => {
      set({ activeSessionId: sessionId });
      set(state => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? { ...session, isActive: true, lastActivity: new Date() }
            : session
        ),
      }));
    },

    killSession: async (sessionId: string) => {
      const session = get().sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const tmuxManager = mockTmuxManagers.get(session.connectionId);
      if (!tmuxManager) {
        throw new Error('Tmux manager not found for connection');
      }

      await tmuxManager.killSession(session.name);
      set(state => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        activeSessionId:
          state.activeSessionId === sessionId ? undefined : state.activeSessionId,
      }));
    },

    sendCommand: async (sessionId: string, command: string) => {
      const session = get().sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const tmuxManager = mockTmuxManagers.get(session.connectionId);
      if (!tmuxManager) {
        throw new Error('Tmux manager not available');
      }

      await tmuxManager.sendCommand(session.name, command);
      set(state => ({
        sessions: state.sessions.map(s =>
          s.id === sessionId ? { ...s, lastActivity: new Date() } : s
        ),
      }));
    },

    updateSettings: (newSettings: Partial<AppSettings>) => {
      set(state => ({
        settings: { ...state.settings, ...newSettings },
      }));
    },

    clearAllData: () => {
      mockSSHClients.clear();
      mockTmuxManagers.clear();
      set({
        connections: [],
        sessions: [],
        activeConnectionId: undefined,
        activeSessionId: undefined,
        isAuthenticated: false,
        settings: defaultSettings,
      });
    },

    setAuthenticated: (authenticated: boolean) => {
      set({ isAuthenticated: authenticated });
    },
  }));
};
