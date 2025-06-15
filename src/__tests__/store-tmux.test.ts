/**
 * Unit tests for tmux functionality integration in store
 * @description Tests tmux session management through Zustand store
 */

import { TmuxSession } from '../types';
import { createMockStore, MockAppStore } from './store-mock';

// Mock SSH utilities
const mockSSHClient = {
  executeCommand: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn(),
};

jest.mock('../utils/ssh', () => ({
  createSSHConnection: jest.fn().mockResolvedValue(mockSSHClient),
  validateSSHCredentials: jest.fn().mockReturnValue(true),
}));

// Mock tmux utilities
const mockTmuxManager = {
  refreshSessions: jest.fn(),
  createSession: jest.fn(),
  killSession: jest.fn(),
  sendCommand: jest.fn(),
  hasSession: jest.fn(),
  getSession: jest.fn(),
  getAllSessions: jest.fn(),
};

jest.mock('../utils/tmux', () => ({
  TmuxManager: jest.fn().mockImplementation(() => mockTmuxManager),
  listTmuxSessions: jest.fn(),
  createTmuxSession: jest.fn(),
  killTmuxSession: jest.fn(),
  sendKeysToSession: jest.fn(),
  parseTmuxSessionList: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock persistence middleware to avoid async issues
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('Store Tmux Integration', () => {
  let store: ReturnType<typeof createMockStore>;

  const mockSessions: TmuxSession[] = [
    {
      id: 'conn-1-session1',
      name: 'session1',
      created: new Date(),
      lastActivity: new Date(),
      windowCount: 1,
      isActive: false,
      connectionId: 'conn-1',
    },
    {
      id: 'conn-1-session2',
      name: 'session2',
      created: new Date(),
      lastActivity: new Date(),
      windowCount: 2,
      isActive: true,
      connectionId: 'conn-1',
    },
  ];

  beforeEach(() => {
    // Create fresh mock store for each test
    store = createMockStore();
    jest.clearAllMocks();

    // Reset mock implementations
    mockSSHClient.executeCommand.mockResolvedValue('');

    // We'll set up mockSessions dynamically in each test with the correct connectionId
    mockTmuxManager.refreshSessions.mockImplementation(async () => []);
    mockTmuxManager.createSession.mockResolvedValue('new-session');
    mockTmuxManager.killSession.mockResolvedValue(undefined);
    mockTmuxManager.sendCommand.mockResolvedValue(undefined);
  });

  describe('SSH connection with tmux integration', () => {
    it('should initialize tmux manager on successful SSH connection', async () => {
      // Add and connect
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });

      const connection = store.getState().connections[0];

      // Set up mock sessions with correct connection ID
      const mockSessionsForConnection = [
        {
          id: `${connection.id}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connection.id,
        },
        {
          id: `${connection.id}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connection.id,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connection.id);

      // Verify tmux manager was created and sessions were refreshed
      expect(mockTmuxManager.refreshSessions).toHaveBeenCalled();

      // Check that sessions were added to store
      const finalState = store.getState();
      expect(finalState.sessions).toHaveLength(2);
      expect(finalState.sessions[0].name).toBe('session1');
      expect(finalState.sessions[1].name).toBe('session2');
    });
  });

  describe('refreshSessions', () => {
    let connectionId: string;
    let mockSessionsForConnection: TmuxSession[];

    beforeEach(async () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });
      connectionId = store.getState().connections[0].id;

      // Set up mock sessions with correct connection ID
      mockSessionsForConnection = [
        {
          id: `${connectionId}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connectionId,
        },
        {
          id: `${connectionId}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connectionId);

      // Clear previous refresh calls
      jest.clearAllMocks();
    });

    it('should refresh tmux sessions from server', async () => {
      await store.getState().refreshSessions(connectionId);

      expect(mockTmuxManager.refreshSessions).toHaveBeenCalled();

      const sessions = store.getState().sessions;
      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.connectionId === connectionId)).toBe(true);
    });

    it('should replace existing sessions for connection', async () => {
      // First refresh adds initial sessions
      await store.getState().refreshSessions(connectionId);
      expect(store.getState().sessions).toHaveLength(2);

      // Mock different sessions for second refresh
      const newSessions: TmuxSession[] = [
        {
          id: 'conn-1-session3',
          name: 'session3',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(newSessions);

      // Second refresh should replace sessions
      await store.getState().refreshSessions(connectionId);

      const sessions = store.getState().sessions;
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('session3');
    });

    it('should handle refresh errors gracefully', async () => {
      mockTmuxManager.refreshSessions.mockRejectedValue(
        new Error('Tmux not available')
      );

      await expect(store.getState().refreshSessions(connectionId)).rejects.toThrow(
        'Tmux not available'
      );
    });

    it('should do nothing for disconnected connection', async () => {
      // Disconnect first
      await store.getState().disconnectFromServer(connectionId);

      await store.getState().refreshSessions(connectionId);

      // Should not have called tmux manager
      expect(mockTmuxManager.refreshSessions).not.toHaveBeenCalled();
    });
  });

  describe('createSession', () => {
    let connectionId: string;

    beforeEach(async () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });
      connectionId = store.getState().connections[0].id;

      // Set up mock sessions with correct connection ID
      const mockSessionsForConnection = [
        {
          id: `${connectionId}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connectionId,
        },
        {
          id: `${connectionId}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connectionId);
      jest.clearAllMocks();
    });

    it('should create new tmux session', async () => {
      const sessionId = await store
        .getState()
        .createSession(connectionId, 'my-session');

      expect(mockTmuxManager.createSession).toHaveBeenCalledWith('my-session');
      expect(sessionId).toBe(`${connectionId}-new-session`);

      // Should refresh sessions after creation
      expect(mockTmuxManager.refreshSessions).toHaveBeenCalled();
    });

    it('should create session with auto-generated name', async () => {
      const sessionId = await store.getState().createSession(connectionId);

      expect(mockTmuxManager.createSession).toHaveBeenCalledWith(undefined);
      expect(sessionId).toBe(`${connectionId}-new-session`);
    });

    it('should handle creation errors', async () => {
      mockTmuxManager.createSession.mockRejectedValue(new Error('Session exists'));

      await expect(
        store.getState().createSession(connectionId, 'existing')
      ).rejects.toThrow('Session exists');
    });

    it('should reject for disconnected connection', async () => {
      // Disconnect first
      await store.getState().disconnectFromServer(connectionId);

      await expect(store.getState().createSession(connectionId)).rejects.toThrow(
        'Connection not available'
      );
    });
  });

  describe('killSession', () => {
    let connectionId: string;

    beforeEach(async () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });
      connectionId = store.getState().connections[0].id;

      // Set up mock sessions with correct connection ID
      const mockSessionsForConnection = [
        {
          id: `${connectionId}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connectionId,
        },
        {
          id: `${connectionId}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connectionId);
      jest.clearAllMocks();
    });

    it('should kill tmux session', async () => {
      const sessionId = store.getState().sessions[0].id;
      const sessionName = store.getState().sessions[0].name;

      await store.getState().killSession(sessionId);

      expect(mockTmuxManager.killSession).toHaveBeenCalledWith(sessionName);

      // Session should be removed from store
      expect(store.getState().sessions.find(s => s.id === sessionId)).toBeUndefined();
    });

    it('should update active session if killed session was active', async () => {
      const sessionId = store.getState().sessions[0].id;

      // Set as active session
      store.getState().attachToSession(sessionId);
      expect(store.getState().activeSessionId).toBe(sessionId);

      // Kill the active session
      await store.getState().killSession(sessionId);

      // Active session should be cleared
      expect(store.getState().activeSessionId).toBeUndefined();
    });

    it('should handle kill errors', async () => {
      mockTmuxManager.killSession.mockRejectedValue(new Error('Session not found'));

      const sessionId = store.getState().sessions[0].id;

      await expect(store.getState().killSession(sessionId)).rejects.toThrow(
        'Session not found'
      );
    });

    it('should handle non-existent session', async () => {
      await expect(store.getState().killSession('non-existent')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('sendCommand', () => {
    let connectionId: string;

    beforeEach(async () => {
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });
      connectionId = store.getState().connections[0].id;

      // Set up mock sessions with correct connection ID
      const mockSessionsForConnection = [
        {
          id: `${connectionId}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connectionId,
        },
        {
          id: `${connectionId}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connectionId);
      jest.clearAllMocks();
    });

    it('should send command to tmux session', async () => {
      const session = store.getState().sessions[0];

      await store.getState().sendCommand(session.id, 'npm start');

      expect(mockTmuxManager.sendCommand).toHaveBeenCalledWith(
        session.name,
        'npm start'
      );

      // Should update last activity
      const updatedSession = store.getState().sessions.find(s => s.id === session.id);
      expect(updatedSession?.lastActivity).toBeInstanceOf(Date);
    });

    it('should handle command errors', async () => {
      mockTmuxManager.sendCommand.mockRejectedValue(new Error('Session not found'));

      const session = store.getState().sessions[0];

      await expect(store.getState().sendCommand(session.id, 'ls')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should handle non-existent session', async () => {
      await expect(store.getState().sendCommand('non-existent', 'ls')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('disconnect cleanup', () => {
    it('should clean up tmux manager on disconnect', async () => {
      // Connect
      store.getState().addConnection({
        name: 'Test Server',
        host: '192.168.1.100',
        port: 22,
        username: 'testuser',
        authType: 'password',
        password: 'testpass',
      });
      const connectionId = store.getState().connections[0].id;

      // Set up mock sessions with correct connection ID
      const mockSessionsForConnection = [
        {
          id: `${connectionId}-session1`,
          name: 'session1',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 1,
          isActive: false,
          connectionId: connectionId,
        },
        {
          id: `${connectionId}-session2`,
          name: 'session2',
          created: new Date(),
          lastActivity: new Date(),
          windowCount: 2,
          isActive: true,
          connectionId: connectionId,
        },
      ];
      mockTmuxManager.refreshSessions.mockResolvedValue(mockSessionsForConnection);

      await store.getState().connectToServer(connectionId);

      // Verify sessions exist
      expect(store.getState().sessions).toHaveLength(2);

      // Disconnect
      await store.getState().disconnectFromServer(connectionId);

      // Sessions should be cleared
      expect(store.getState().sessions).toHaveLength(0);
      expect(store.getState().activeConnectionId).toBeUndefined();
    });
  });
});
