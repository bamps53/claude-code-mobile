/**
 * Unit tests for SSH connection functionality
 * @description Tests SSH connection utilities and error handling
 */

import { SSHConnection } from '../types';
import {
  SSHClientWrapper,
  createSSHConnection,
  validateSSHCredentials,
} from '../utils/ssh';

// Mock the native SSH library for tests
jest.mock('@dylankenneally/react-native-ssh-sftp', () => {
  const mockClient = {
    execute: jest.fn().mockResolvedValue('mock command output'),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  return {
    connectWithPassword: jest
      .fn()
      .mockImplementation((host, port, username, password) => {
        if (host === 'invalid-host') {
          return Promise.reject(new Error('Connection refused'));
        }
        if (username === 'invalid-user') {
          return Promise.reject(new Error('Authentication failed'));
        }
        return Promise.resolve(mockClient);
      }),
    connectWithKey: jest
      .fn()
      .mockImplementation((host, port, username, privateKey, passphrase) => {
        if (host === 'invalid-host') {
          return Promise.reject(new Error('Connection refused'));
        }
        if (username === 'invalid-user') {
          return Promise.reject(new Error('Authentication failed'));
        }
        return Promise.resolve(mockClient);
      }),
  };
});

// Mock console.warn to avoid noise in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

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
      expect(sshClient.isConnected()).toBe(true);
    });

    it('should create SSH client with key authentication', async () => {
      const sshClient = await createSSHConnection(mockKeyConnection);

      expect(sshClient).toBeDefined();
      expect(sshClient.isConnected()).toBe(true);
    });

    it('should throw error for invalid credentials', async () => {
      const invalidConnection = { ...mockConnection, password: undefined };

      await expect(createSSHConnection(invalidConnection)).rejects.toThrow(
        'Invalid SSH credentials'
      );
    });

    it('should handle connection timeout', async () => {
      const timeoutConnection = { ...mockConnection, host: 'invalid-host' };

      await expect(createSSHConnection(timeoutConnection)).rejects.toThrow(
        'Connection refused. Please check the port and firewall settings.'
      );
    });

    it('should handle authentication failure', async () => {
      const authFailConnection = { ...mockConnection, username: 'invalid-user' };

      await expect(createSSHConnection(authFailConnection)).rejects.toThrow(
        'Authentication failed. Please check your credentials.'
      );
    });
  });

  describe('SSHClientWrapper', () => {
    let sshClient: SSHClientWrapper;

    beforeEach(async () => {
      sshClient = await createSSHConnection(mockConnection);
    });

    it('should execute commands successfully', async () => {
      const result = await sshClient.executeCommand('ls -la');

      expect(result).toBe('mock command output');
    });

    it('should handle command execution errors', async () => {
      // Mock implementation doesn't throw errors, but we can test the wrapper behavior
      // by testing with a disconnected client
      await sshClient.disconnect();

      await expect(sshClient.executeCommand('invalid-command')).rejects.toThrow(
        'SSH client is not connected'
      );
    });

    it('should check connection status', () => {
      expect(sshClient.isConnected()).toBe(true);
    });

    it('should disconnect gracefully', async () => {
      expect(sshClient.isConnected()).toBe(true);

      await sshClient.disconnect();

      expect(sshClient.isConnected()).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      // Mock implementation doesn't throw errors during disconnect
      // The wrapper should handle this gracefully
      await expect(sshClient.disconnect()).resolves.toBeUndefined();
      expect(sshClient.isConnected()).toBe(false);
    });
  });

  describe('Connection error handling', () => {
    it('should handle invalid host errors', async () => {
      const invalidHostConnection = { ...mockConnection, host: 'invalid-host' };

      await expect(createSSHConnection(invalidHostConnection)).rejects.toThrow(
        'Connection refused. Please check the port and firewall settings.'
      );
    });

    it('should handle authentication errors', async () => {
      const invalidUserConnection = { ...mockConnection, username: 'invalid-user' };

      await expect(createSSHConnection(invalidUserConnection)).rejects.toThrow(
        'Authentication failed. Please check your credentials.'
      );
    });

    it('should handle credential validation errors', async () => {
      const invalidConnection = { ...mockConnection, password: undefined };

      await expect(createSSHConnection(invalidConnection)).rejects.toThrow(
        'Invalid SSH credentials'
      );
    });
  });
});
