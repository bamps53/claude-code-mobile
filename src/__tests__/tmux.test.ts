/**
 * Unit tests for tmux session management functionality
 * @description Tests tmux utilities for session operations
 */

import { TmuxSession } from '../types';
import {
  listTmuxSessions,
  createTmuxSession,
  attachToTmuxSession,
  killTmuxSession,
  sendKeysToSession,
  parseTmuxSessionList,
  TmuxManager,
} from '../utils/tmux';

// Mock SSH client
const mockSSHClient = {
  executeCommand: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn(),
};

describe('Tmux Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSSHClient.executeCommand.mockResolvedValue('');
  });

  describe('parseTmuxSessionList', () => {
    it('should parse tmux list-sessions output correctly', () => {
      const tmuxOutput = `claude-code-main: 2 windows (created Mon Jan  1 10:00:00 2024) [80x24] (attached)
development: 1 windows (created Mon Jan  1 09:30:00 2024) [80x24]
background-tasks: 3 windows (created Sun Dec 31 20:15:00 2023) [80x24]`;

      const connectionId = 'conn-1';
      const sessions = parseTmuxSessionList(tmuxOutput, connectionId);

      expect(sessions).toHaveLength(3);

      expect(sessions[0]).toMatchObject({
        name: 'claude-code-main',
        windowCount: 2,
        isActive: true,
        connectionId: 'conn-1',
      });

      expect(sessions[1]).toMatchObject({
        name: 'development',
        windowCount: 1,
        isActive: false,
        connectionId: 'conn-1',
      });

      expect(sessions[2]).toMatchObject({
        name: 'background-tasks',
        windowCount: 3,
        isActive: false,
        connectionId: 'conn-1',
      });
    });

    it('should handle empty tmux output', () => {
      const sessions = parseTmuxSessionList('', 'conn-1');
      expect(sessions).toHaveLength(0);
    });

    it('should handle "no sessions" error', () => {
      const tmuxOutput = 'no server running on /tmp/tmux-1000/default';
      const sessions = parseTmuxSessionList(tmuxOutput, 'conn-1');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('listTmuxSessions', () => {
    it('should execute tmux list-sessions command', async () => {
      const mockOutput =
        'session1: 1 windows (created Mon Jan  1 10:00:00 2024) [80x24]';
      mockSSHClient.executeCommand.mockResolvedValue(mockOutput);

      const sessions = await listTmuxSessions(mockSSHClient, 'conn-1');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux list-sessions 2>/dev/null || echo "no sessions"'
      );
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('session1');
    });

    it('should handle tmux command errors gracefully', async () => {
      mockSSHClient.executeCommand.mockRejectedValue(new Error('Command failed'));

      await expect(listTmuxSessions(mockSSHClient, 'conn-1')).rejects.toThrow(
        'Failed to list tmux sessions'
      );
    });
  });

  describe('createTmuxSession', () => {
    it('should create new tmux session with default name', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      const sessionName = await createTmuxSession(mockSSHClient);

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        expect.stringMatching(/tmux new-session -d -s "session-\d+"/)
      );
      expect(sessionName).toMatch(/session-\d+/);
    });

    it('should create new tmux session with custom name', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      const sessionName = await createTmuxSession(mockSSHClient, 'my-session');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux new-session -d -s "my-session"'
      );
      expect(sessionName).toBe('my-session');
    });

    it('should handle session creation errors', async () => {
      mockSSHClient.executeCommand.mockRejectedValue(new Error('Session exists'));

      await expect(createTmuxSession(mockSSHClient, 'existing')).rejects.toThrow(
        'Failed to create tmux session'
      );
    });
  });

  describe('attachToTmuxSession', () => {
    it('should attach to existing session', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      await attachToTmuxSession(mockSSHClient, 'my-session');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux attach-session -t "my-session"'
      );
    });

    it('should handle attach errors', async () => {
      mockSSHClient.executeCommand.mockRejectedValue(new Error('Session not found'));

      await expect(attachToTmuxSession(mockSSHClient, 'nonexistent')).rejects.toThrow(
        'Failed to attach to tmux session'
      );
    });
  });

  describe('killTmuxSession', () => {
    it('should kill specified session', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      await killTmuxSession(mockSSHClient, 'target-session');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux kill-session -t "target-session"'
      );
    });

    it('should handle kill errors', async () => {
      mockSSHClient.executeCommand.mockRejectedValue(new Error('Session not found'));

      await expect(killTmuxSession(mockSSHClient, 'nonexistent')).rejects.toThrow(
        'Failed to kill tmux session'
      );
    });
  });

  describe('sendKeysToSession', () => {
    it('should send keys to specified session', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      await sendKeysToSession(mockSSHClient, 'my-session', 'ls -la');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux send-keys -t "my-session" "ls -la" Enter'
      );
    });

    it('should escape special characters in commands', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      await sendKeysToSession(mockSSHClient, 'my-session', 'echo "hello world"');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux send-keys -t "my-session" "echo \\"hello world\\"" Enter'
      );
    });

    it('should handle send-keys errors', async () => {
      mockSSHClient.executeCommand.mockRejectedValue(new Error('Session not found'));

      await expect(
        sendKeysToSession(mockSSHClient, 'nonexistent', 'ls')
      ).rejects.toThrow('Failed to send keys to tmux session');
    });
  });

  describe('TmuxManager class', () => {
    let tmuxManager: TmuxManager;

    beforeEach(() => {
      tmuxManager = new TmuxManager(mockSSHClient, 'conn-1');
    });

    it('should initialize with SSH client and connection ID', () => {
      expect(tmuxManager).toBeDefined();
    });

    it('should list sessions and track them', async () => {
      const mockOutput =
        'session1: 1 windows (created Mon Jan  1 10:00:00 2024) [80x24]';
      mockSSHClient.executeCommand.mockResolvedValue(mockOutput);

      const sessions = await tmuxManager.refreshSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('session1');
      expect(sessions[0].connectionId).toBe('conn-1');
    });

    it('should create session and update internal tracking', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      const sessionName = await tmuxManager.createSession('test-session');

      expect(sessionName).toBe('test-session');
      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux new-session -d -s "test-session"'
      );
    });

    it('should kill session and update tracking', async () => {
      // First create some sessions
      const mockOutput =
        'session1: 1 windows (created Mon Jan  1 10:00:00 2024) [80x24]';
      mockSSHClient.executeCommand.mockResolvedValue(mockOutput);
      await tmuxManager.refreshSessions();

      // Then kill one
      mockSSHClient.executeCommand.mockResolvedValue('');
      await tmuxManager.killSession('session1');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux kill-session -t "session1"'
      );
    });

    it('should send commands to sessions', async () => {
      mockSSHClient.executeCommand.mockResolvedValue('');

      await tmuxManager.sendCommand('session1', 'npm start');

      expect(mockSSHClient.executeCommand).toHaveBeenCalledWith(
        'tmux send-keys -t "session1" "npm start" Enter'
      );
    });

    it('should check if session exists', async () => {
      const mockOutput =
        'session1: 1 windows (created Mon Jan  1 10:00:00 2024) [80x24]';
      mockSSHClient.executeCommand.mockResolvedValue(mockOutput);

      await tmuxManager.refreshSessions();

      expect(tmuxManager.hasSession('session1')).toBe(true);
      expect(tmuxManager.hasSession('nonexistent')).toBe(false);
    });
  });
});
