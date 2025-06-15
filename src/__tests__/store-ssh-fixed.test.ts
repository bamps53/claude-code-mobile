/**
 * Fixed SSH store integration tests
 * @description Simplified tests for SSH functionality in store
 */

import { createMockStore, MockAppStore } from './store-mock';

// Create a simple mock for the SSH client
const mockSSHClient = {
  executeCommand: jest.fn().mockResolvedValue('test output'),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

// Mock SSH utilities with working implementation
jest.mock('../utils/ssh', () => ({
  createSSHConnection: jest.fn().mockResolvedValue(mockSSHClient),
  validateSSHCredentials: jest.fn().mockReturnValue(true),
  testSSHConnection: jest.fn().mockResolvedValue(true),
}));

// Mock TmuxManager
const mockTmuxManager = {
  refreshSessions: jest.fn().mockResolvedValue([]),
  createSession: jest.fn().mockResolvedValue('new-session'),
  killSession: jest.fn().mockResolvedValue(undefined),
  sendCommand: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../utils/tmux', () => ({
  TmuxManager: jest.fn().mockImplementation(() => mockTmuxManager),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock persistence middleware to avoid async issues
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('Store SSH Integration - Fixed', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Create fresh mock store for each test
    store = createMockStore();
    jest.clearAllMocks();
  });

  describe('Basic SSH Operations', () => {
    it('should add connection to store', () => {
      console.log('Before add:', store.getState().connections.length);

      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const state = store.getState();
      console.log('After add:', state.connections.length);

      expect(state.connections).toHaveLength(1);
      expect(state.connections[0].name).toBe('Test Server');
      expect(state.connections[0].isConnected).toBe(false);
    });

    it('should connect to SSH server', async () => {
      // Add connection
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connectionId = store.getState().connections[0].id;

      // Connect
      await store.getState().connectToServer(connectionId);

      // Verify connection state
      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(true);
      expect(connection?.lastConnected).toBeInstanceOf(Date);
      expect(store.getState().activeConnectionId).toBe(connectionId);
    });

    it('should handle connection errors', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValueOnce(new Error('Connection failed'));

      store.getState().addConnection({
        name: 'Test Server',
        host: 'invalid-host',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connectionId = store.getState().connections[0].id;

      await expect(store.getState().connectToServer(connectionId)).rejects.toThrow(
        'Connection failed'
      );

      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
      expect(connection?.connectionError).toBe('Connection failed');
    });

    it('should disconnect from server', async () => {
      // Add and connect
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connectionId = store.getState().connections[0].id;
      await store.getState().connectToServer(connectionId);

      // Disconnect
      await store.getState().disconnectFromServer(connectionId);

      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
      expect(store.getState().activeConnectionId).toBeUndefined();
    });

    it('should test connection without affecting store', async () => {
      // Mock createSSHConnection to succeed for this test
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockResolvedValueOnce(mockSSHClient);

      const testConnection = {
        id: 'test-id',
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password' as const,
        password: 'testpass',
        isConnected: false,
      };

      const result = await store.getState().testConnection(testConnection);

      expect(result).toBe(true);
      expect(store.getState().connections).toHaveLength(0);
    });

    it('should handle test connection failure', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValueOnce(new Error('Test failed'));

      const testConnection = {
        id: 'test-id',
        name: 'Test Server',
        host: 'invalid-host',
        port: 22,
        username: 'testuser',
        authType: 'password' as const,
        password: 'testpass',
        isConnected: false,
      };

      const result = await store.getState().testConnection(testConnection);

      expect(result).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should remove connection', () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connectionId = store.getState().connections[0].id;
      store.getState().removeConnection(connectionId);

      expect(store.getState().connections).toHaveLength(0);
    });

    it('should update connection', () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connectionId = store.getState().connections[0].id;
      store.getState().updateConnection(connectionId, { name: 'Updated Server' });

      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.name).toBe('Updated Server');
    });

    it('should clear all data', () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      store.getState().clearAllData();

      expect(store.getState().connections).toHaveLength(0);
      expect(store.getState().sessions).toHaveLength(0);
      expect(store.getState().activeConnectionId).toBeUndefined();
      expect(store.getState().activeSessionId).toBeUndefined();
    });
  });
});
