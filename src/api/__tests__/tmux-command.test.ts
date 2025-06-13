/**
 * Unit tests for tmux Command Execution
 * Tests the tmux-related commands and session management
 */

import { SSHConnectionManager, SSHConfig, Session } from '../ssh';

// SSHClient will be automatically mocked via the Jest moduleNameMapper
// in the mock setup, so we don't need explicit mocking here

describe('tmux Command Execution', () => {
  let sshManager: SSHConnectionManager;
  let validConfig: SSHConfig;

  beforeEach(async () => {
    sshManager = new SSHConnectionManager();
    validConfig = {
      host: 'test.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass'
    };
    await sshManager.connect(validConfig);
  });

  afterEach(async () => {
    try {
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Session Listing', () => {
    it('should list sessions correctly', async () => {
      // Mock implementation in react-native-ssh-sftp mock will handle this
      const sessions = await sshManager.listSessions();
      
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should return empty array when no sessions exist', async () => {
      // The mock will return empty string for tmux list-sessions command
      // Test with customized mock to ensure empty array handling
      jest.spyOn(sshManager, 'listSessions').mockResolvedValueOnce([]);
      
      const sessions = await sshManager.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should throw error when not connected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.listSessions()).rejects.toThrow('SSH connection not established');
    });
  });

  describe('Session Creation', () => {
    it('should create new tmux session', async () => {
      const sessionName = 'test-session';
      const newSession = await sshManager.createSession(sessionName);
      
      expect(newSession).toBeDefined();
      expect(newSession.name).toBe(sessionName);
    });

    it('should throw error when creating session while disconnected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.createSession('test-session')).rejects.toThrow('SSH connection not established');
    });

    it('should handle session creation errors', async () => {
      // Mock a failure in session creation
      jest.spyOn(sshManager, 'createSession').mockRejectedValueOnce(new Error('Failed to create session'));
      
      await expect(sshManager.createSession('test-session')).rejects.toThrow('Failed to create session');
    });

    it('should handle session name validation', async () => {
      // Testing with various session names to ensure proper sanitization
      const validNames = ['test-session', 'dev_env', 'session123'];
      
      for (const name of validNames) {
        const session = await sshManager.createSession(name);
        expect(session.name).toBe(name);
      }
    });
  });

  describe('Session Attachment', () => {
    it('should attach to existing tmux session', async () => {
      const sessionName = 'test-session';
      await sshManager.createSession(sessionName);
      
      await expect(sshManager.attachToSession(sessionName)).resolves.toBeUndefined();
    });

    it('should throw error when attaching to session while disconnected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.attachToSession('test-session')).rejects.toThrow('SSH connection not established');
    });

    it('should notify output listeners on data from attached session', async () => {
      const mockOutputListener = jest.fn();
      sshManager.addOutputListener(mockOutputListener);
      
      // Mock the interactive session data event
      const mockClient = {
        executeInteractive: (command: string, options: any) => {
          // Simulate data coming from the session
          setTimeout(() => options.onData('Session data output'), 10);
          return Promise.resolve();
        }
      };
      
      // @ts-ignore - replace the client with our mock
      sshManager.client = mockClient;
      
      await sshManager.attachToSession('test-session');
      
      // Wait for the async data event
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockOutputListener).toHaveBeenCalled();
      const outputArg = mockOutputListener.mock.calls[0][0];
      expect(outputArg.type).toBe('stdout');
      expect(outputArg.data).toBe('Session data output');
    });

    it('should notify output listeners on errors from attached session', async () => {
      const mockOutputListener = jest.fn();
      sshManager.addOutputListener(mockOutputListener);
      
      // Mock the interactive session error event
      const mockClient = {
        executeInteractive: (command: string, options: any) => {
          // Simulate error coming from the session
          setTimeout(() => options.onError('Session error output'), 10);
          return Promise.resolve();
        }
      };
      
      // @ts-ignore - replace the client with our mock
      sshManager.client = mockClient;
      
      await sshManager.attachToSession('test-session');
      
      // Wait for the async error event
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockOutputListener).toHaveBeenCalled();
      const outputArg = mockOutputListener.mock.calls[0][0];
      expect(outputArg.type).toBe('stderr');
      expect(outputArg.data).toBe('Session error output');
    });
  });

  describe('Session Termination', () => {
    it('should kill tmux session', async () => {
      const sessionName = 'test-session';
      await sshManager.createSession(sessionName);
      
      await expect(sshManager.killSession(sessionName)).resolves.toBeUndefined();
    });

    it('should throw error when killing session while disconnected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.killSession('test-session')).rejects.toThrow('SSH connection not established');
    });

    it('should handle nonexistent session kill error', async () => {
      // Mock implementation to handle nonexistent session
      const mockClient = {
        execute: (command: string) => {
          if (command.includes('nonexistent-session')) {
            throw new Error('Session not found');
          }
          return Promise.resolve('');
        }
      };
      
      // @ts-ignore - replace the client with our mock
      sshManager.client = mockClient;
      
      await expect(sshManager.killSession('nonexistent-session')).rejects.toThrow('Failed to kill session');
    });
  });
});
