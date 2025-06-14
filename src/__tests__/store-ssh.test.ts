/**
 * Unit tests for SSH functionality in the store
 * @description Tests SSH connection management in Zustand store
 */

import { useAppStore } from '../store';
import { SSHConnection } from '../types';

// Mock the SSH utilities
jest.mock('../utils/ssh', () => ({
  createSSHConnection: jest.fn(),
  SSHClient: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('Store SSH Integration', () => {
  const mockConnection: SSHConnection = {
    id: 'conn-1',
    name: 'Test Server',
    host: '192.168.1.100',
    port: 22,
    username: 'testuser',
    authType: 'password',
    password: 'testpass',
    isConnected: false,
  };

  let mockSSHClient: any;

  beforeEach(() => {
    // Reset store state
    useAppStore.getState().clearAllData();

    // Mock SSH client
    mockSSHClient = {
      executeCommand: jest.fn().mockResolvedValue('command output'),
      isConnected: jest.fn().mockReturnValue(true),
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    const { createSSHConnection } = require('../utils/ssh');
    createSSHConnection.mockResolvedValue(mockSSHClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectToServer', () => {
    beforeEach(() => {
      const store = useAppStore.getState();
      store.addConnection({
        name: mockConnection.name,
        host: mockConnection.host,
        port: mockConnection.port,
        username: mockConnection.username,
        authType: mockConnection.authType,
        password: mockConnection.password,
      });
    });

    it('should successfully connect to SSH server', async () => {
      const store = useAppStore.getState();
      const connection = store.connections[0]; // Get the added connection

      await store.connectToServer(connection.id);

      const updatedConnection = store.connections.find(c => c.id === connection.id);
      expect(updatedConnection?.isConnected).toBe(true);
      expect(updatedConnection?.lastConnected).toBeInstanceOf(Date);
      expect(updatedConnection?.connectionError).toBeUndefined();
      expect(store.activeConnectionId).toBe(connection.id);
    });

    it('should handle connection errors', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValue(new Error('Connection failed'));

      const store = useAppStore.getState();
      const connection = store.connections[0];

      await expect(store.connectToServer(connection.id)).rejects.toThrow(
        'Connection failed'
      );

      const updatedConnection = store.connections.find(c => c.id === connection.id);
      expect(updatedConnection?.isConnected).toBe(false);
      expect(updatedConnection?.connectionError).toBe('Connection failed');
    });

    it('should throw error for non-existent connection', async () => {
      const store = useAppStore.getState();

      await expect(store.connectToServer('non-existent')).rejects.toThrow(
        'Connection not found'
      );
    });
  });

  describe('disconnectFromServer', () => {
    let connectionId: string;

    beforeEach(async () => {
      const store = useAppStore.getState();
      store.addConnection({
        name: mockConnection.name,
        host: mockConnection.host,
        port: mockConnection.port,
        username: mockConnection.username,
        authType: mockConnection.authType,
        password: mockConnection.password,
      });
      connectionId = store.connections[0].id;
      await store.connectToServer(connectionId);
    });

    it('should successfully disconnect from server', async () => {
      const store = useAppStore.getState();

      await store.disconnectFromServer(connectionId);

      const connection = store.connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
      expect(store.activeConnectionId).toBeUndefined();
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      mockSSHClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const store = useAppStore.getState();

      // Should not throw
      await store.disconnectFromServer(connectionId);

      const connection = store.connections.find(c => c.id === connectionId);
      expect(connection?.isConnected).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      const store = useAppStore.getState();

      const result = await store.testConnection(mockConnection);

      expect(result).toBe(true);
      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith('echo "test"');
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });

    it('should return false for failed connection test', async () => {
      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockRejectedValue(new Error('Test failed'));

      const store = useAppStore.getState();

      const result = await store.testConnection(mockConnection);

      expect(result).toBe(false);
    });
  });

  describe('sendCommand', () => {
    let connectionId: string;

    beforeEach(async () => {
      const store = useAppStore.getState();
      store.addConnection({
        name: mockConnection.name,
        host: mockConnection.host,
        port: mockConnection.port,
        username: mockConnection.username,
        authType: mockConnection.authType,
        password: mockConnection.password,
      });
      connectionId = store.connections[0].id;
      await store.connectToServer(connectionId);

      // Add a mock session directly to state
      store.sessions.push({
        id: 'session-1',
        name: 'test-session',
        created: new Date(),
        lastActivity: new Date(),
        windowCount: 1,
        isActive: true,
        connectionId: connectionId,
      });
    });

    it('should send command to tmux session', async () => {
      const store = useAppStore.getState();

      await store.sendCommand('session-1', 'ls -la');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux send-keys -t "test-session" "ls -la" Enter'
      );

      const session = store.sessions.find(s => s.id === 'session-1');
      expect(session?.lastActivity).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent session', async () => {
      const store = useAppStore.getState();

      await expect(store.sendCommand('non-existent', 'ls')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw error when SSH client not available', async () => {
      const store = useAppStore.getState();

      // Disconnect first
      await store.disconnectFromServer(connectionId);

      await expect(store.sendCommand('session-1', 'ls')).rejects.toThrow(
        'SSH connection not available'
      );
    });
  });

  describe('connection management', () => {
    it('should replace existing connection when reconnecting', async () => {
      const store = useAppStore.getState();
      store.addConnection({
        name: mockConnection.name,
        host: mockConnection.host,
        port: mockConnection.port,
        username: mockConnection.username,
        authType: mockConnection.authType,
        password: mockConnection.password,
      });
      const connectionId = store.connections[0].id;

      // First connection
      await store.connectToServer(connectionId);
      expect(mockSSHClient.disconnect).not.toHaveBeenCalled();

      // Second connection should disconnect the first
      const secondMockClient = {
        executeCommand: jest.fn().mockResolvedValue('output'),
        isConnected: jest.fn().mockReturnValue(true),
        disconnect: jest.fn().mockResolvedValue(undefined),
      };

      const { createSSHConnection } = require('../utils/ssh');
      createSSHConnection.mockResolvedValue(secondMockClient);

      await store.connectToServer(connectionId);

      // First client should be disconnected
      expect(mockSSHClient.disconnect).toHaveBeenCalled();
    });
  });
});
