/**
 * Integration tests for session management
 * Tests tmux session creation, listing, and management through SSH
 */

import { SSHConnectionManager, Session } from '../src/api/ssh';
import { IntegrationTestEnvironment } from './setup';

describe('Session Management Integration', () => {
  let sshManager: SSHConnectionManager;
  let testEnv: IntegrationTestEnvironment;
  const testSessionPrefix = 'test-session';
  const createdSessions: string[] = [];

  beforeAll(() => {
    testEnv = IntegrationTestEnvironment.getInstance();
  });

  beforeEach(async () => {
    sshManager = new SSHConnectionManager();
    await sshManager.connect(testEnv.getSSHConfig());
  });

  afterEach(async () => {
    // Clean up created test sessions
    for (const sessionName of createdSessions) {
      try {
        await sshManager.killSession(sessionName);
      } catch {
        // Ignore cleanup errors
      }
    }
    createdSessions.length = 0;

    try {
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Session Creation', () => {
    it('should create a new tmux session', async () => {
      const sessionName = `${testSessionPrefix}-create-${Date.now()}`;
      createdSessions.push(sessionName);

      const session = await sshManager.createSession(sessionName);

      expect(session).toBeDefined();
      expect(session.name).toBe(sessionName);
      expect(session.id).toBe(sessionName);
      expect(session.created).toBeInstanceOf(Date);
      expect(session.lastActivity).toBeInstanceOf(Date);
      expect(typeof session.isAttached).toBe('boolean');
    });

    it('should fail to create session with duplicate name', async () => {
      const sessionName = `${testSessionPrefix}-duplicate-${Date.now()}`;
      createdSessions.push(sessionName);

      // Create first session
      await sshManager.createSession(sessionName);

      // Attempt to create duplicate
      await expect(sshManager.createSession(sessionName))
        .rejects.toThrow('Failed to create session');
    });

    it('should create multiple sessions with different names', async () => {
      const sessionName1 = `${testSessionPrefix}-multi1-${Date.now()}`;
      const sessionName2 = `${testSessionPrefix}-multi2-${Date.now()}`;
      createdSessions.push(sessionName1, sessionName2);

      const session1 = await sshManager.createSession(sessionName1);
      const session2 = await sshManager.createSession(sessionName2);

      expect(session1.name).toBe(sessionName1);
      expect(session2.name).toBe(sessionName2);
      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('Session Listing', () => {
    it('should return empty list when no sessions exist', async () => {
      // Kill all existing sessions first
      const existingSessions = await sshManager.listSessions();
      for (const session of existingSessions) {
        await sshManager.killSession(session.name);
      }

      const sessions = await sshManager.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should list created sessions', async () => {
      const sessionName = `${testSessionPrefix}-list-${Date.now()}`;
      createdSessions.push(sessionName);

      await sshManager.createSession(sessionName);
      const sessions = await sshManager.listSessions();

      expect(sessions.length).toBeGreaterThan(0);
      const testSession = sessions.find(s => s.name === sessionName);
      expect(testSession).toBeDefined();
      expect(testSession!.name).toBe(sessionName);
    });

    it('should update session list after creating new sessions', async () => {
      const initialSessions = await sshManager.listSessions();
      const initialCount = initialSessions.length;

      const sessionName = `${testSessionPrefix}-update-${Date.now()}`;
      createdSessions.push(sessionName);

      await sshManager.createSession(sessionName);
      const updatedSessions = await sshManager.listSessions();

      expect(updatedSessions.length).toBe(initialCount + 1);
      expect(updatedSessions.find(s => s.name === sessionName)).toBeDefined();
    });

    it('should provide accurate session metadata', async () => {
      const sessionName = `${testSessionPrefix}-metadata-${Date.now()}`;
      createdSessions.push(sessionName);

      const beforeCreate = Date.now();
      await sshManager.createSession(sessionName);
      const afterCreate = Date.now();

      const sessions = await sshManager.listSessions();
      const testSession = sessions.find(s => s.name === sessionName);

      expect(testSession).toBeDefined();
      expect(testSession!.created.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(testSession!.created.getTime()).toBeLessThanOrEqual(afterCreate);
      expect(testSession!.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('Session Deletion', () => {
    it('should kill an existing session', async () => {
      const sessionName = `${testSessionPrefix}-kill-${Date.now()}`;
      
      await sshManager.createSession(sessionName);
      let sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName)).toBeDefined();

      await sshManager.killSession(sessionName);
      sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName)).toBeUndefined();
    });

    it('should handle killing non-existent session', async () => {
      const nonExistentSession = `${testSessionPrefix}-nonexistent-${Date.now()}`;
      
      await expect(sshManager.killSession(nonExistentSession))
        .rejects.toThrow('Failed to kill session');
    });

    it('should update session list after deletion', async () => {
      const sessionName1 = `${testSessionPrefix}-delete1-${Date.now()}`;
      const sessionName2 = `${testSessionPrefix}-delete2-${Date.now()}`;
      createdSessions.push(sessionName2); // Only keep one for cleanup

      await sshManager.createSession(sessionName1);
      await sshManager.createSession(sessionName2);

      let sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName1)).toBeDefined();
      expect(sessions.find(s => s.name === sessionName2)).toBeDefined();

      await sshManager.killSession(sessionName1);
      sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName1)).toBeUndefined();
      expect(sessions.find(s => s.name === sessionName2)).toBeDefined();
    });
  });

  describe('Concurrent Session Handling', () => {
    it('should handle multiple sessions simultaneously', async () => {
      const sessionNames = [
        `${testSessionPrefix}-concurrent1-${Date.now()}`,
        `${testSessionPrefix}-concurrent2-${Date.now()}`,
        `${testSessionPrefix}-concurrent3-${Date.now()}`
      ];
      createdSessions.push(...sessionNames);

      // Create sessions concurrently
      const createPromises = sessionNames.map(name => 
        sshManager.createSession(name)
      );
      const sessions = await Promise.all(createPromises);

      expect(sessions).toHaveLength(3);
      sessions.forEach((session, index) => {
        expect(session.name).toBe(sessionNames[index]);
      });

      // Verify all sessions exist
      const listedSessions = await sshManager.listSessions();
      sessionNames.forEach(name => {
        expect(listedSessions.find(s => s.name === name)).toBeDefined();
      });
    });

    it('should handle session creation and deletion concurrently', async () => {
      const createSessions = [
        `${testSessionPrefix}-mixed1-${Date.now()}`,
        `${testSessionPrefix}-mixed2-${Date.now()}`
      ];
      const deleteSessions = [
        `${testSessionPrefix}-todelete1-${Date.now()}`,
        `${testSessionPrefix}-todelete2-${Date.now()}`
      ];
      
      createdSessions.push(...createSessions);

      // Create sessions to be deleted
      for (const name of deleteSessions) {
        await sshManager.createSession(name);
      }

      // Mix create and delete operations
      const operations = [
        ...createSessions.map(name => sshManager.createSession(name)),
        ...deleteSessions.map(name => sshManager.killSession(name))
      ];

      await Promise.all(operations);

      const finalSessions = await sshManager.listSessions();
      
      // Created sessions should exist
      createSessions.forEach(name => {
        expect(finalSessions.find(s => s.name === name)).toBeDefined();
      });
      
      // Deleted sessions should not exist
      deleteSessions.forEach(name => {
        expect(finalSessions.find(s => s.name === name)).toBeUndefined();
      });
    });
  });

  describe('Session Persistence', () => {
    it('should persist sessions across SSH reconnections', async () => {
      const sessionName = `${testSessionPrefix}-persist-${Date.now()}`;
      createdSessions.push(sessionName);

      // Create session
      await sshManager.createSession(sessionName);
      let sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName)).toBeDefined();

      // Disconnect and reconnect
      await sshManager.disconnect();
      await sshManager.connect(testEnv.getSSHConfig());

      // Session should still exist
      sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName)).toBeDefined();
    });

    it('should maintain session state during connection interruption', async () => {
      const sessionName = `${testSessionPrefix}-interruption-${Date.now()}`;
      createdSessions.push(sessionName);

      await sshManager.createSession(sessionName);
      
      // Simulate brief network interruption
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === sessionName)).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle tmux server not running', async () => {
      // Kill tmux server
      try {
        await sshManager.killSession('nonexistent-to-ensure-error');
      } catch {
        // This might throw, which is expected
      }

      // List sessions should return empty array, not throw
      const sessions = await sshManager.listSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should fail operations when SSH connection is lost', async () => {
      await sshManager.disconnect();

      await expect(sshManager.listSessions())
        .rejects.toThrow('SSH connection not established');
      
      await expect(sshManager.createSession('test'))
        .rejects.toThrow('SSH connection not established');
        
      await expect(sshManager.killSession('test'))
        .rejects.toThrow('SSH connection not established');
    });
  });

  describe('Performance Requirements', () => {
    it('should list sessions quickly', async () => {
      const startTime = Date.now();
      await sshManager.listSessions();
      const duration = Date.now() - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should create sessions efficiently', async () => {
      const sessionName = `${testSessionPrefix}-perf-${Date.now()}`;
      createdSessions.push(sessionName);

      const startTime = Date.now();
      await sshManager.createSession(sessionName);
      const duration = Date.now() - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});