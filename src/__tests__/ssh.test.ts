/**
 * Unit tests for SSH connection functionality
 * @description Tests SSH connection utilities and error handling
 */

import { SSHConnection } from '../types';
import { SSHClient, createSSHConnection, validateSSHCredentials } from '../utils/ssh';

// Create mock instances
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockExecute = jest.fn();
const mockIsConnected = jest.fn();

// Mock the react-native-ssh-sftp library
jest.mock('@dylankenneally/react-native-ssh-sftp', () => ({
  SSHClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    execute: mockExecute,
    isConnected: mockIsConnected,
  })),
}));

describe('SSH Connection Utils', () => {
  const mockConnection: SSHConnection = {
    id: 'test-1',
    name: 'Test Server',
    host: '192.168.1.100',
    port: 22,
    username: 'testuser',
    authType: 'password',
    password: 'testpass',
    isConnected: false,
  };

  const mockKeyConnection: SSHConnection = {
    id: 'test-2',
    name: 'Key Server',
    host: '10.0.0.1',
    port: 2222,
    username: 'keyuser',
    authType: 'key',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----',
    isConnected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(true);
    mockDisconnect.mockResolvedValue(undefined);
    mockExecute.mockResolvedValue('command output');
    mockIsConnected.mockReturnValue(true);
  });

  describe('validateSSHCredentials', () => {
    it('should validate password authentication', () => {
      expect(validateSSHCredentials(mockConnection)).toBe(true);
    });

    it('should validate key authentication', () => {
      expect(validateSSHCredentials(mockKeyConnection)).toBe(true);
    });

    it('should reject missing password for password auth', () => {
      const invalidConnection = { ...mockConnection, password: undefined };
      expect(validateSSHCredentials(invalidConnection)).toBe(false);
    });

    it('should reject missing private key for key auth', () => {
      const invalidConnection = { ...mockKeyConnection, privateKey: undefined };
      expect(validateSSHCredentials(invalidConnection)).toBe(false);
    });

    it('should reject invalid host', () => {
      const invalidConnection = { ...mockConnection, host: '' };
      expect(validateSSHCredentials(invalidConnection)).toBe(false);
    });

    it('should reject invalid port', () => {
      const invalidConnection = { ...mockConnection, port: 0 };
      expect(validateSSHCredentials(invalidConnection)).toBe(false);
    });

    it('should reject invalid username', () => {
      const invalidConnection = { ...mockConnection, username: '' };
      expect(validateSSHCredentials(invalidConnection)).toBe(false);
    });
  });

  describe('createSSHConnection', () => {
    it('should create SSH client with password authentication', async () => {
      const sshClient = await createSSHConnection(mockConnection);

      expect(sshClient).toBeDefined();
      expect(mockConnect).toHaveBeenCalledWith({
        host: mockConnection.host,
        port: mockConnection.port,
        username: mockConnection.username,
        password: mockConnection.password,
      });
    });

    it('should create SSH client with key authentication', async () => {
      const sshClient = await createSSHConnection(mockKeyConnection);

      expect(sshClient).toBeDefined();
      expect(mockConnect).toHaveBeenCalledWith({
        host: mockKeyConnection.host,
        port: mockKeyConnection.port,
        username: mockKeyConnection.username,
        privateKey: mockKeyConnection.privateKey,
      });
    });

    it('should throw error for invalid credentials', async () => {
      const invalidConnection = { ...mockConnection, password: undefined };

      await expect(createSSHConnection(invalidConnection)).rejects.toThrow(
        'Invalid SSH credentials'
      );
    });

    it('should handle connection timeout', async () => {
      mockConnect.mockRejectedValue(new Error('Connection timeout'));

      await expect(createSSHConnection(mockConnection)).rejects.toThrow(
        'Connection timed out. Please check your network connection.'
      );
    });

    it('should handle authentication failure', async () => {
      mockConnect.mockRejectedValue(new Error('Authentication failed'));

      await expect(createSSHConnection(mockConnection)).rejects.toThrow(
        'Authentication failed. Please check your credentials.'
      );
    });
  });

  describe('SSHClient wrapper', () => {
    let sshClient: SSHClient;

    beforeEach(async () => {
      // Reset mocks for each test
      mockConnect.mockResolvedValue(true);
      mockIsConnected.mockReturnValue(true);
      mockExecute.mockResolvedValue('command output');
      mockDisconnect.mockResolvedValue(undefined);

      sshClient = await createSSHConnection(mockConnection);
    });

    it('should execute commands successfully', async () => {
      const result = await sshClient.executeCommand('ls -la');

      expect(result).toBe('command output');
      expect(mockExecute).toHaveBeenCalledWith('ls -la');
    });

    it('should handle command execution errors', async () => {
      mockExecute.mockRejectedValue(new Error('Command failed'));

      await expect(sshClient.executeCommand('invalid-command')).rejects.toThrow(
        'Command execution failed: Command failed'
      );
    });

    it('should check connection status', () => {
      mockIsConnected.mockReturnValue(true);
      expect(sshClient.isConnected()).toBe(true);

      mockIsConnected.mockReturnValue(false);
      expect(sshClient.isConnected()).toBe(false);
    });

    it('should disconnect gracefully', async () => {
      await sshClient.disconnect();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      mockDisconnect.mockRejectedValue(new Error('Disconnect failed'));

      // Should not throw, just log error
      await expect(sshClient.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Connection error handling', () => {
    it('should provide user-friendly error messages for common errors', async () => {
      const testCases = [
        {
          error: 'ENOTFOUND',
          expected: 'Server not found. Please check the hostname.',
        },
        {
          error: 'ECONNREFUSED',
          expected: 'Connection refused. Please check the port and firewall settings.',
        },
        {
          error: 'ETIMEDOUT',
          expected: 'Connection timed out. Please check your network connection.',
        },
        {
          error: 'Authentication failed',
          expected: 'Authentication failed. Please check your credentials.',
        },
        { error: 'Unknown error', expected: 'Failed to connect: Unknown error' },
      ];

      for (const testCase of testCases) {
        mockConnect.mockRejectedValue(new Error(testCase.error));

        await expect(createSSHConnection(mockConnection)).rejects.toThrow(
          testCase.expected
        );
      }
    });
  });
});
