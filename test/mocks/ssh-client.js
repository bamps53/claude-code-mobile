/**
 * Mock implementation of SSH client module
 * Used across tests to avoid module resolution issues
 */

// Create a mock SSHClient class
class SSHClient {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    this.connections = new Map();
  }

  connect(config) {
    this.connected = true;
    const connectionId = `ssh_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.connections.set(connectionId, { ...config, active: true });
    return Promise.resolve(connectionId);
  }

  disconnect(connectionId) {
    this.connected = false;
    if (connectionId && this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId);
      connection.active = false;
      this.connections.set(connectionId, connection);
    }
    return Promise.resolve();
  }

  executeCommand(command, connectionId) {
    if (connectionId && !this.connections.has(connectionId)) {
      return Promise.reject(new SSHConnectionError('Connection not found', 'ENOTFOUND'));
    }
    return Promise.resolve({
      stdout: 'mock stdout',
      stderr: '',
      code: 0
    });
  }
  
  createStream(connectionId) {
    if (!connectionId || !this.connections.has(connectionId)) {
      return Promise.reject(new SSHConnectionError('Connection not found', 'ENOTFOUND'));
    }
    
    const stream = {
      write: jest.fn(),
      on: jest.fn(),
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      destroy: jest.fn(),
      end: jest.fn(),
    };
    
    return Promise.resolve(stream);
  }

  openShell() {
    return {
      write: jest.fn(),
      on: jest.fn(),
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      close: jest.fn()
    };
  }

  uploadFile() {
    return Promise.resolve();
  }

  downloadFile() {
    return Promise.resolve();
  }
}

// Define SSH connection error
class SSHConnectionError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SSHConnectionError';
    this.code = code;
  }
}

// Export the mocks
module.exports = {
  SSHClient,
  SSHConnectionError
};
