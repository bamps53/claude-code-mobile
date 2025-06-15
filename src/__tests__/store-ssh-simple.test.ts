/**
 * Simplified SSH store integration tests
 * @description Tests SSH functionality with more focused approach
 */

import { createMockStore } from './store-mock';

// Mock SSH utilities
const mockSSHClient = {
  executeCommand: jest.fn().mockResolvedValue('test output'),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../utils/ssh', () => ({
  createSSHConnection: jest.fn().mockResolvedValue(mockSSHClient),
  validateSSHCredentials: jest.fn().mockReturnValue(true),
  testSSHConnection: jest.fn().mockResolvedValue(true),
}));

// Mock tmux utilities
jest.mock('../utils/tmux', () => ({
  TmuxManager: jest.fn(),
  listTmuxSessions: jest.fn(),
  createTmuxSession: jest.fn(),
  killTmuxSession: jest.fn(),
  sendKeysToSession: jest.fn(),
  parseTmuxSessionList: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('Store SSH Integration - Simplified', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Create fresh mock store for each test
    store = createMockStore();
    jest.clearAllMocks();

    // Reset mock implementations
    mockSSHClient.executeCommand.mockResolvedValue('test output');
    mockSSHClient.isConnected.mockReturnValue(true);
    mockSSHClient.disconnect.mockResolvedValue(undefined);

    // Mock tmux manager
    const mockTmuxManager = {
      refreshSessions: jest.fn().mockResolvedValue([]),
      createSession: jest.fn().mockResolvedValue('new-session'),
      killSession: jest.fn().mockResolvedValue(undefined),
      sendCommand: jest.fn().mockResolvedValue(undefined),
    };

    const { TmuxManager } = require('../utils/tmux');
    TmuxManager.mockImplementation(() => mockTmuxManager);
  });

  describe('SSH Connection Flow', () => {
    it('should add connection, connect, and update state correctly', async () => {
      // Add connection
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      expect(store.getState().connections).toHaveLength(1);
      const connection = store.getState().connections[0];
      expect(connection.isConnected).toBe(false);

      // Connect to server
      await store.getState().connectToServer(connection.id);

      // Check updated state
      const updatedStore = store.getState();
      const updatedConnection = updatedStore.connections.find(
        c => c.id === connection.id
      );

      expect(updatedConnection?.isConnected).toBe(true);
      expect(updatedConnection?.lastConnected).toBeInstanceOf(Date);
      expect(updatedConnection?.connectionError).toBeUndefined();
      expect(updatedStore.activeConnectionId).toBe(connection.id);
    });

    it('should handle connection errors properly', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValueOnce(new Error('Auth failed'));

      store.getState().addConnection({
        name: 'Test Server',
        host: 'invalid-host',
        port: 22,
        username: 'baduser',
        authType: 'password',
        password: 'badpass',
      });

      const connection = store.getState().connections[0];

      await expect(store.getState().connectToServer(connection.id)).rejects.toThrow(
        'Auth failed'
      );

      const updatedConnection = store
        .getState()
        .connections.find(c => c.id === connection.id);
      expect(updatedConnection?.isConnected).toBe(false);
      expect(updatedConnection?.connectionError).toBe('Auth failed');
    });

    it('should disconnect and clean up properly', async () => {
      // Add and connect
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connection = store.getState().connections[0];
      await store.getState().connectToServer(connection.id);

      // Verify connected state
      expect(store.getState().activeConnectionId).toBe(connection.id);

      // Disconnect
      await store.getState().disconnectFromServer(connection.id);

      // Verify disconnected state
      const updatedStore = store.getState();
      const updatedConnection = updatedStore.connections.find(
        c => c.id === connection.id
      );

      expect(updatedConnection?.isConnected).toBe(false);
      expect(updatedStore.activeConnectionId).toBeUndefined();
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('testConnection functionality', () => {
    it('should test connection without affecting store state', async () => {
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
      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith('echo "test"');
      expect(mockSSHClient.disconnect).toHaveBeenCalled();

      // Store should remain unchanged
      expect(store.getState().connections).toHaveLength(0);
      expect(store.getState().activeConnectionId).toBeUndefined();
    });
  });
});
