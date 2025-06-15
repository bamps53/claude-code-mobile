/**
 * Unit tests for SSH functionality in the store
 * @description Tests SSH connection management in Zustand store
 */

import { SSHConnection } from '../types';
import { createMockStore, MockAppStore } from './store-mock';

// Mock the SSH utilities
jest.mock('../utils/ssh', () => ({
  createSSHConnection: jest.fn(),
  SSHClient: jest.fn(),
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
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('Store SSH Integration', () => {
  let store: ReturnType<typeof createMockStore>;

  const mockConnectionData = {
    name: 'Test Server',
    host: '192.168.1.100',
    port: 22,
    username: 'testuser',
    authType: 'password' as const,
    password: 'testpass',
  };

  let mockSSHClient: any;
  let mockTmuxManager: any;

  beforeEach(() => {
    // Create fresh mock store for each test
    store = createMockStore();

    // Mock SSH client
    mockSSHClient = {
      executeCommand: jest.fn().mockResolvedValue('command output'),
      isConnected: jest.fn().mockReturnValue(true),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    // Mock tmux manager
    mockTmuxManager = {
      refreshSessions: jest.fn().mockResolvedValue([]),
      createSession: jest.fn().mockResolvedValue('new-session'),
      killSession: jest.fn().mockResolvedValue(undefined),
      sendCommand: jest.fn().mockResolvedValue(undefined),
    };

    const { createSSHConnection } = require('../utils/ssh');
    const { TmuxManager } = require('../utils/tmux');
    createSSHConnection.mockResolvedValue(mockSSHClient);
    TmuxManager.mockImplementation(() => mockTmuxManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectToServer', () => {
    beforeEach(() => {
      store.getState().addConnection(mockConnectionData);
    });

    it('should successfully connect to SSH server', async () => {
      const connection = store.getState().connections[0]; // Get the added connection

      await store.getState().connectToServer(connection.id);

      const updatedConnection = store
        .getState()
        .connections.find(c => c.id === connection.id);
      expect(updatedConnection?.isConnected).toBe(true);
      expect(updatedConnection?.lastConnected).toBeInstanceOf(Date);
      expect(updatedConnection?.connectionError).toBeUndefined();
      expect(store.getState().activeConnectionId).toBe(connection.id);
    });

    it('should handle connection errors', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValue(new Error('Connection failed'));

      const connection = store.getState().connections[0];

      await expect(store.getState().connectToServer(connection.id)).rejects.toThrow(
        'Connection failed'
      );

      const updatedConnection = store
        .getState()
        .connections.find(c => c.id === connection.id);
      expect(updatedConnection?.isConnected).toBe(false);
      expect(updatedConnection?.connectionError).toBe('Connection failed');
    });

    it('should throw error for non-existent connection', async () => {
      await expect(store.getState().connectToServer('non-existent')).rejects.toThrow(
        'Connection not found'
      );
    });
  });

  describe('disconnectFromServer', () => {
    let connectionId: string;

    beforeEach(async () => {
      store.getState().addConnection({
        ...mockConnectionData,
      });
      connectionId = store.getState().connections[0].id;
      await store.getState().connectToServer(connectionId);
    });

    it('should successfully disconnect from server', async () => {
      await store.getState().disconnectFromServer(connectionId);

      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
      expect(store.getState().activeConnectionId).toBeUndefined();
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Setup disconnect to fail after connection is made
      mockSSHClient.disconnect.mockReset();
      mockSSHClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      // Should not throw
      await expect(
        store.getState().disconnectFromServer(connectionId)
      ).resolves.not.toThrow();

      const connection = store.getState().connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      const testConnection = {
        ...mockConnectionData,
        id: 'test-id',
        isConnected: false,
      };
      const result = await store.getState().testConnection(testConnection);

      expect(result).toBe(true);
      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith('echo "test"');
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });

    it('should return false for failed connection test', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValue(new Error('Test failed'));

      const testConnection = {
        ...mockConnectionData,
        id: 'test-id',
        isConnected: false,
      };
      const result = await store.getState().testConnection(testConnection);

      expect(result).toBe(false);
    });
  });

  describe('sendCommand', () => {
    let connectionId: string;

    beforeEach(async () => {
      store.getState().addConnection({
        ...mockConnectionData,
      });
      connectionId = store.getState().connections[0].id;

      // Set up mock tmux manager to return sessions
      mockTmuxManager.refreshSessions.mockResolvedValue([
        {
          id: 'session-1',
          name: 'test-session',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: true,
          connectionId: connectionId,
        },
      ]);

      await store.getState().connectToServer(connectionId);
    });

    it('should send command to tmux session', async () => {
      await store.getState().sendCommand('session-1', 'ls -la');

      // Verify tmux manager sendCommand was called
      expect(mockTmuxManager.sendCommand).toHaveBeenCalledWith(
        'test-session',
        'ls -la'
      );

      const session = store.getState().sessions.find(s => s.id === 'session-1');
      expect(session?.lastActivity).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent session', async () => {
      await expect(store.getState().sendCommand('non-existent', 'ls')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw error when SSH client not available', async () => {
      // Disconnect first
      await store.getState().disconnectFromServer(connectionId);

      await expect(store.getState().sendCommand('session-1', 'ls')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('connection management', () => {
    it('should replace existing connection when reconnecting', async () => {
      store.getState().addConnection({
        ...mockConnectionData,
      });
      const connectionId = store.getState().connections[0].id;

      // First connection
      await store.getState().connectToServer(connectionId);
      expect(mockSSHClient.disconnect).not.toHaveBeenCalled();

      // Reset mock for clearer tracking
      mockSSHClient.disconnect.mockClear();

      // Second connection should disconnect the first
      const secondMockClient = {
        executeCommand: jest.fn().mockResolvedValue('output'),
        isConnected: jest.fn().mockReturnValue(true),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };

      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockResolvedValue(secondMockClient);

      await store.getState().connectToServer(connectionId);

      // First client should be disconnected
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });
  });
});
