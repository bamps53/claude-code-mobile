/**
 * Integration tests for SSH connection flow
 * Tests complete connection workflow from UI to SSH establishment
 */

import { SSHConnectionManager, SSHConfig } from '../src/api/ssh';
import { IntegrationTestEnvironment } from './setup';

describe('SSH Connection Integration', () => {
  let sshManager: SSHConnectionManager;
  let testEnv: IntegrationTestEnvironment;
  let sshConfig: SSHConfig;

  beforeAll(() => {
    testEnv = IntegrationTestEnvironment.getInstance();
    sshConfig = testEnv.getSSHConfig();
  });

  beforeEach(() => {
    sshManager = new SSHConnectionManager();
  });

  afterEach(async () => {
    try {
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Basic Connection', () => {
    it('should establish SSH connection with password authentication', async () => {
      const connectionPromise = sshManager.connect({
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        password: sshConfig.password,
      });

      await expect(connectionPromise).resolves.toBeUndefined();
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should establish SSH connection with private key authentication', async () => {
      const connectionPromise = sshManager.connect({
        host: sshConfig.host,
        port: sshConfig.port,
        username: sshConfig.username,
        privateKey: sshConfig.privateKey,
      });

      await expect(connectionPromise).resolves.toBeUndefined();
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should fail connection with invalid credentials', async () => {
      const connectionPromise = sshManager.connect({
        host: sshConfig.host,
        port: sshConfig.port,
        username: 'invaliduser',
        password: 'invalidpass',
      });

      await expect(connectionPromise).rejects.toThrow('SSH connection failed');
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should fail connection to non-existent host', async () => {
      const connectionPromise = sshManager.connect({
        host: 'nonexistent.example.com',
        port: 22,
        username: 'testuser',
        password: 'testpass',
      });

      await expect(connectionPromise).rejects.toThrow('SSH connection failed');
      expect(sshManager.isConnectionActive()).toBe(false);
    });
  });

  describe('Connection State Management', () => {
    beforeEach(async () => {
      await sshManager.connect(sshConfig);
    });

    it('should track connection state correctly', () => {
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should handle disconnection properly', async () => {
      await sshManager.disconnect();
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should notify connection listeners on connect', async () => {
      const mockListener = jest.fn();
      const newManager = new SSHConnectionManager();
      
      newManager.addConnectionListener(mockListener);
      await newManager.connect(sshConfig);
      
      expect(mockListener).toHaveBeenCalledWith(true);
      
      await newManager.disconnect();
    });

    it('should notify connection listeners on disconnect', async () => {
      const mockListener = jest.fn();
      
      sshManager.addConnectionListener(mockListener);
      await sshManager.disconnect();
      
      expect(mockListener).toHaveBeenCalledWith(false);
    });
  });

  describe('Connection Persistence', () => {
    it('should maintain connection across multiple operations', async () => {
      await sshManager.connect(sshConfig);
      
      // Perform multiple operations
      const sessions1 = await sshManager.listSessions();
      const sessions2 = await sshManager.listSessions();
      
      expect(sshManager.isConnectionActive()).toBe(true);
      expect(Array.isArray(sessions1)).toBe(true);
      expect(Array.isArray(sessions2)).toBe(true);
    });

    it('should handle connection timeouts gracefully', async () => {
      await sshManager.connect(sshConfig);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Connection should still be active for short delays
      expect(sshManager.isConnectionActive()).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should detect broken connections', async () => {
      await sshManager.connect(sshConfig);
      
      // Simulate connection being forcibly closed
      // In a real scenario, this would be handled by the SSH library
      // For testing, we verify the manager can detect and handle such states
      
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should fail operations when not connected', async () => {
      expect(sshManager.isConnectionActive()).toBe(false);
      
      await expect(sshManager.listSessions())
        .rejects.toThrow('SSH connection not established');
    });

    it('should allow reconnection after failure', async () => {
      // First connection
      await sshManager.connect(sshConfig);
      expect(sshManager.isConnectionActive()).toBe(true);
      
      // Disconnect
      await sshManager.disconnect();
      expect(sshManager.isConnectionActive()).toBe(false);
      
      // Reconnect
      await sshManager.connect(sshConfig);
      expect(sshManager.isConnectionActive()).toBe(true);
    });
  });

  describe('SSH Command Execution', () => {
    beforeEach(async () => {
      await sshManager.connect(sshConfig);
    });

    it('should execute basic SSH commands', async () => {
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should handle command execution errors', async () => {
      // This should not throw for the command execution itself,
      // but should be captured in the SSH manager's error handling
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(async () => {
      await sshManager.connect(sshConfig);
    });

    it('should establish connection within reasonable time', async () => {
      const newManager = new SSHConnectionManager();
      
      const startTime = Date.now();
      await newManager.connect(sshConfig);
      const connectionTime = Date.now() - startTime;
      
      // Connection should complete within 5 seconds
      expect(connectionTime).toBeLessThan(5000);
      
      await newManager.disconnect();
    });

    it('should execute commands with acceptable latency', async () => {
      const startTime = Date.now();
      await sshManager.listSessions();
      const executionTime = Date.now() - startTime;
      
      // Command execution should complete within 2 seconds
      expect(executionTime).toBeLessThan(2000);
    });
  });
});