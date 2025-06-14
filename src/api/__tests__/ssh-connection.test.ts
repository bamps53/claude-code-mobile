/**
 * Unit tests for SSH Connection Management
 * Tests the core SSH connection functionality
 */

import { SSHConnectionManager, SSHConfig } from '../ssh';

// SSHClient will be automatically mocked via the Jest moduleNameMapper
// in the mock setup, so we don't need explicit mocking here

describe('SSH Connection Management', () => {
  let sshManager: SSHConnectionManager;
  let validConfig: SSHConfig;

  beforeEach(() => {
    sshManager = new SSHConnectionManager();
    validConfig = {
      host: 'valid.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass'
    };
  });

  afterEach(async () => {
    try {
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Connection Establishment', () => {
    it('should connect with valid password credentials', async () => {
      await expect(sshManager.connect(validConfig)).resolves.toBeUndefined();
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should connect with private key authentication', async () => {
      const keyConfig = {
        host: 'valid.example.com',
        port: 22,
        username: 'testuser',
        privateKey: '-----BEGIN RSA PRIVATE KEY----- mock key content -----END RSA PRIVATE KEY-----'
      };
      
      await expect(sshManager.connect(keyConfig)).resolves.toBeUndefined();
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should fail with invalid credentials', async () => {
      const invalidConfig = {
        host: 'invalid.host',
        port: 22,
        username: 'testuser',
        password: 'testpass'
      };
      
      await expect(sshManager.connect(invalidConfig)).rejects.toThrow('SSH connection failed');
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should fail with invalid username', async () => {
      const invalidConfig = {
        host: 'test.example.com',
        port: 22,
        username: 'invaliduser',
        password: 'testpass'
      };
      
      await expect(sshManager.connect(invalidConfig)).rejects.toThrow('SSH connection failed');
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should fail with connection timeout', async () => {
      const timeoutConfig = {
        host: 'nonexistent.test.local',
        port: 22,
        username: 'testuser',
        password: 'testpass'
      };
      
      await expect(sshManager.connect(timeoutConfig)).rejects.toThrow('SSH connection failed');
      expect(sshManager.isConnectionActive()).toBe(false);
    });
  });

  describe('Connection State', () => {
    it('should report inactive state before connection', () => {
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should report active state after successful connection', async () => {
      await sshManager.connect(validConfig);
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should report inactive state after disconnection', async () => {
      await sshManager.connect(validConfig);
      await sshManager.disconnect();
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should handle multiple disconnect calls safely', async () => {
      await sshManager.connect(validConfig);
      await sshManager.disconnect();
      await expect(sshManager.disconnect()).resolves.toBeUndefined();
      expect(sshManager.isConnectionActive()).toBe(false);
    });
  });

  describe('Connection Event Notification', () => {
    it('should notify listeners when connection is established', async () => {
      const mockListener = jest.fn();
      sshManager.addConnectionListener(mockListener);
      
      await sshManager.connect(validConfig);
      
      expect(mockListener).toHaveBeenCalledWith(true);
    });

    it('should notify listeners when disconnected', async () => {
      const mockListener = jest.fn();
      
      await sshManager.connect(validConfig);
      sshManager.addConnectionListener(mockListener);
      await sshManager.disconnect();
      
      expect(mockListener).toHaveBeenCalledWith(false);
    });

    it('should notify listeners on connection failure', async () => {
      const mockListener = jest.fn();
      sshManager.addConnectionListener(mockListener);
      
      try {
        await sshManager.connect({
          host: 'invalid.host',
          port: 22,
          username: 'testuser',
          password: 'testpass'
        });
      } catch {
        // Expected to throw, ignore
      }
      
      expect(mockListener).toHaveBeenCalledWith(false);
    });

    it('should handle multiple connection listeners', async () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      sshManager.addConnectionListener(mockListener1);
      sshManager.addConnectionListener(mockListener2);
      
      await sshManager.connect(validConfig);
      
      expect(mockListener1).toHaveBeenCalledWith(true);
      expect(mockListener2).toHaveBeenCalledWith(true);
    });

    it('should allow removing connection listeners', async () => {
      const mockListener = jest.fn();
      
      sshManager.addConnectionListener(mockListener);
      sshManager.removeConnectionListener(mockListener);
      
      await sshManager.connect(validConfig);
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Connection Cleanup', () => {
    it('should clear client reference on disconnect', async () => {
      await sshManager.connect(validConfig);
      await sshManager.disconnect();
      
      // This is testing implementation details, but it's important for memory management
      // @ts-ignore - accessing private property for testing
      expect(sshManager.client).toBeNull();
    });
  });
});
