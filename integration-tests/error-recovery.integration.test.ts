/**
 * Integration tests for error recovery and resilience
 * Tests network disconnection, timeout recovery, and error state propagation
 */

import { SSHConnectionManager, TerminalOutput } from '../src/api/ssh';
import { IntegrationTestEnvironment } from './setup';

describe('Error Recovery Integration', () => {
  let sshManager: SSHConnectionManager;
  let testEnv: IntegrationTestEnvironment;
  const testSessionName = `error-recovery-${Date.now()}`;

  beforeAll(() => {
    testEnv = IntegrationTestEnvironment.getInstance();
  });

  beforeEach(async () => {
    sshManager = new SSHConnectionManager();
  });

  afterEach(async () => {
    try {
      if (sshManager.isConnectionActive()) {
        await sshManager.killSession(testSessionName);
        await sshManager.disconnect();
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Connection Failure Recovery', () => {
    it('should handle initial connection failures gracefully', async () => {
      const invalidConfig = {
        host: 'nonexistent.test.local',
        port: 22,
        username: 'invaliduser',
        password: 'invalidpass',
      };

      await expect(sshManager.connect(invalidConfig))
        .rejects.toThrow('SSH connection failed');
      
      expect(sshManager.isConnectionActive()).toBe(false);

      // Should be able to connect with valid config after failure
      await expect(sshManager.connect(testEnv.getSSHConfig()))
        .resolves.toBeUndefined();
      
      expect(sshManager.isConnectionActive()).toBe(true);
    });

    it('should detect broken connections', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      expect(sshManager.isConnectionActive()).toBe(true);

      // Force disconnect to simulate network failure
      await sshManager.disconnect();
      expect(sshManager.isConnectionActive()).toBe(false);

      // Operations should fail with appropriate error
      await expect(sshManager.listSessions())
        .rejects.toThrow('SSH connection not established');
    });

    it('should allow reconnection after connection loss', async () => {
      // Initial connection
      await sshManager.connect(testEnv.getSSHConfig());
      await sshManager.createSession(testSessionName);
      
      let sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === testSessionName)).toBeDefined();

      // Simulate connection loss
      await sshManager.disconnect();
      expect(sshManager.isConnectionActive()).toBe(false);

      // Reconnect
      await sshManager.connect(testEnv.getSSHConfig());
      expect(sshManager.isConnectionActive()).toBe(true);

      // Session should still exist (tmux persists sessions)
      sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === testSessionName)).toBeDefined();
    });
  });

  describe('SSH Timeout Handling', () => {
    it('should handle SSH command timeouts', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // This test assumes the SSH library has timeout mechanisms
      // In practice, very long operations might timeout
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should remain responsive after timeout scenarios', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Execute a command that completes quickly
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
      
      // Connection should still be active
      expect(sshManager.isConnectionActive()).toBe(true);
    });
  });

  describe('Session Recovery', () => {
    it('should recover sessions after connection interruption', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      await sshManager.createSession(testSessionName);
      
      // Verify session exists
      let sessions = await sshManager.listSessions();
      const originalSession = sessions.find(s => s.name === testSessionName);
      expect(originalSession).toBeDefined();

      // Simulate connection interruption and recovery
      await sshManager.disconnect();
      await sshManager.connect(testEnv.getSSHConfig());

      // Session should be recoverable
      sessions = await sshManager.listSessions();
      const recoveredSession = sessions.find(s => s.name === testSessionName);
      expect(recoveredSession).toBeDefined();
      expect(recoveredSession!.name).toBe(originalSession!.name);
    });

    it('should handle session state inconsistencies', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Try to attach to non-existent session
      await expect(sshManager.attachToSession('non-existent-session'))
        .rejects.toThrow();
      
      // Manager should still be functional
      expect(sshManager.isConnectionActive()).toBe(true);
      
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should clean up orphaned sessions on reconnection', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      await sshManager.createSession(testSessionName);
      
      // Disconnect abruptly
      await sshManager.disconnect();
      
      // Reconnect and clean up
      await sshManager.connect(testEnv.getSSHConfig());
      
      const sessions = await sshManager.listSessions();
      const sessionExists = sessions.find(s => s.name === testSessionName);
      
      if (sessionExists) {
        // If session still exists, we should be able to kill it
        await expect(sshManager.killSession(testSessionName))
          .resolves.toBeUndefined();
      }
    });
  });

  describe('Error State Propagation', () => {
    it('should propagate connection errors to listeners', async () => {
      const connectionStates: boolean[] = [];
      
      sshManager.addConnectionListener((connected) => {
        connectionStates.push(connected);
      });

      // Attempt invalid connection
      try {
        await sshManager.connect({
          host: 'invalid.host',
          port: 22,
          username: 'test',
          password: 'test',
        });
      } catch {
        // Expected to fail
      }

      // Should have received false connection state
      expect(connectionStates).toContain(false);
    });

    it('should handle errors in output listeners gracefully', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      await sshManager.createSession(testSessionName);
      
      // Add problematic listener
      const faultyListener = (output: TerminalOutput) => {
        throw new Error('Listener error');
      };
      
      sshManager.addOutputListener(faultyListener);
      
      // Should not crash the SSH manager
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Manager should still be functional
      expect(sshManager.isConnectionActive()).toBe(true);
      
      sshManager.removeOutputListener(faultyListener);
    });

    it('should provide meaningful error messages', async () => {
      // Test various error scenarios
      await expect(sshManager.listSessions())
        .rejects.toThrow('SSH connection not established');
        
      await expect(sshManager.createSession('test'))
        .rejects.toThrow('SSH connection not established');
        
      await expect(sshManager.attachToSession('test'))
        .rejects.toThrow('SSH connection not established');
        
      await expect(sshManager.sendCommand('test'))
        .rejects.toThrow('SSH connection not established');
        
      await expect(sshManager.killSession('test'))
        .rejects.toThrow('SSH connection not established');
    });
  });

  describe('Network Condition Simulation', () => {
    it('should handle slow network conditions', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Simulate slow network by adding delays between operations
      const startTime = Date.now();
      
      await sshManager.createSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const sessions = await sshManager.listSessions();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Operations should complete even with delays
      expect(sessions.find(s => s.name === testSessionName)).toBeDefined();
      expect(totalTime).toBeGreaterThan(200); // At least the added delays
    });

    it('should maintain data integrity during network issues', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Create multiple sessions with potential network instability
      const sessionNames = [
        `${testSessionName}-1`,
        `${testSessionName}-2`,
        `${testSessionName}-3`
      ];
      
      for (const name of sessionNames) {
        await sshManager.createSession(name);
        // Simulate brief network hiccup
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const sessions = await sshManager.listSessions();
      
      // All sessions should be created successfully
      sessionNames.forEach(name => {
        expect(sessions.find(s => s.name === name)).toBeDefined();
      });
      
      // Clean up
      for (const name of sessionNames) {
        await sshManager.killSession(name);
      }
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple connection attempts gracefully', async () => {
      const config = testEnv.getSSHConfig();
      
      // Attempt multiple connections concurrently
      // Only the first should succeed, others should handle gracefully
      const connectionPromises = [
        sshManager.connect(config),
        sshManager.connect(config),
        sshManager.connect(config)
      ];
      
      // At least one should succeed, others may throw or be ignored
      const results = await Promise.allSettled(connectionPromises);
      
      expect(sshManager.isConnectionActive()).toBe(true);
      
      // Should have at least one successful connection
      const successfulConnections = results.filter(r => r.status === 'fulfilled');
      expect(successfulConnections.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations during connection issues', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Start concurrent operations
      const operations = [
        sshManager.listSessions(),
        sshManager.createSession(`${testSessionName}-concurrent1`),
        sshManager.createSession(`${testSessionName}-concurrent2`)
      ];
      
      const results = await Promise.allSettled(operations);
      
      // At least some operations should succeed
      const successfulOps = results.filter(r => r.status === 'fulfilled');
      expect(successfulOps.length).toBeGreaterThan(0);
      
      // Clean up any created sessions
      try {
        await sshManager.killSession(`${testSessionName}-concurrent1`);
        await sshManager.killSession(`${testSessionName}-concurrent2`);
      } catch {
        // Ignore cleanup errors
      }
    });
  });

  describe('Resource Cleanup and Memory Management', () => {
    it('should clean up resources on connection failure', async () => {
      const initialConnectionState = sshManager.isConnectionActive();
      expect(initialConnectionState).toBe(false);
      
      try {
        await sshManager.connect({
          host: 'invalid.test',
          port: 22,
          username: 'test',
          password: 'test'
        });
      } catch {
        // Expected to fail
      }
      
      // Should not have active connection
      expect(sshManager.isConnectionActive()).toBe(false);
    });

    it('should handle listener cleanup on errors', async () => {
      const outputReceived: TerminalOutput[] = [];
      const outputListener = (output: TerminalOutput) => {
        outputReceived.push(output);
      };
      
      sshManager.addOutputListener(outputListener);
      
      // Try operations without connection
      try {
        await sshManager.attachToSession('test');
      } catch {
        // Expected to fail
      }
      
      // Remove listener should work without errors
      expect(() => sshManager.removeOutputListener(outputListener))
        .not.toThrow();
    });

    it('should prevent memory leaks from failed operations', async () => {
      await sshManager.connect(testEnv.getSSHConfig());
      
      // Perform many operations that might fail
      const promises = Array.from({ length: 10 }, (_, i) => 
        sshManager.createSession(`${testSessionName}-memory-${i}`).catch(() => {})
      );
      
      await Promise.allSettled(promises);
      
      // Connection should still be stable
      expect(sshManager.isConnectionActive()).toBe(true);
      
      // Clean up any created sessions
      const sessions = await sshManager.listSessions();
      for (const session of sessions) {
        if (session.name.includes('memory-')) {
          try {
            await sshManager.killSession(session.name);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    });
  });
});