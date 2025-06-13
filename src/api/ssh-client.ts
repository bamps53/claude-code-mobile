/**
 * SSH Client for managing connections to remote servers
 * Handles SSH connection establishment, command execution, and stream management
 */

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  timeout?: number;
}

export interface SSHConnection {
  id: string;
  config: SSHConfig;
  isConnected: boolean;
  lastActivity: Date;
}

export interface StreamData {
  sessionId: string;
  data: string;
  timestamp: Date;
}

export class SSHConnectionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SSHConnectionError';
  }
}

export class SSHClient {
  private connections: Map<string, SSHConnection> = new Map();
  private streams: Map<string, any> = new Map();

  /**
   * Establish SSH connection to remote server
   * @param config SSH connection configuration
   * @returns Promise resolving to connection ID
   * @throws {SSHConnectionError} When connection fails
   */
  async connect(config: SSHConfig): Promise<string> {
    try {
      // Validate configuration
      this.validateConfig(config);
      
      const connectionId = this.generateConnectionId();
      
      // Mock SSH connection for now - will be replaced with react-native-ssh-sftp
      const connection: SSHConnection = {
        id: connectionId,
        config,
        isConnected: true,
        lastActivity: new Date()
      };
      
      this.connections.set(connectionId, connection);
      return connectionId;
    } catch (error) {
      throw new SSHConnectionError(
        `Failed to connect to ${config.host}:${config.port}`,
        'CONNECTION_FAILED'
      );
    }
  }

  /**
   * Disconnect and cleanup SSH connection
   * @param connectionId Connection identifier
   * @throws {SSHConnectionError} When disconnect fails
   */
  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new SSHConnectionError('Connection not found', 'CONNECTION_NOT_FOUND');
    }

    try {
      // Cleanup streams
      const stream = this.streams.get(connectionId);
      if (stream) {
        stream.destroy?.();
        this.streams.delete(connectionId);
      }

      // Mark as disconnected
      connection.isConnected = false;
      this.connections.delete(connectionId);
    } catch (error) {
      throw new SSHConnectionError('Failed to disconnect', 'DISCONNECT_FAILED');
    }
  }

  /**
   * Execute command over SSH connection
   * @param connectionId Connection identifier
   * @param command Command to execute
   * @returns Promise resolving to command output
   * @throws {SSHConnectionError} When command execution fails
   */
  async executeCommand(connectionId: string, command: string): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isConnected) {
      throw new SSHConnectionError('Connection not available', 'CONNECTION_NOT_AVAILABLE');
    }

    try {
      // Mock command execution - will be replaced with actual SSH command execution
      connection.lastActivity = new Date();
      
      // Simulate command execution delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return `Mock output for: ${command}`;
    } catch (error) {
      throw new SSHConnectionError(`Command execution failed: ${command}`, 'COMMAND_FAILED');
    }
  }

  /**
   * Create interactive shell stream
   * @param connectionId Connection identifier
   * @returns Promise resolving to stream interface
   * @throws {SSHConnectionError} When stream creation fails
   */
  async createStream(connectionId: string): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isConnected) {
      throw new SSHConnectionError('Connection not available', 'CONNECTION_NOT_AVAILABLE');
    }

    try {
      // Mock stream creation - will be replaced with actual SSH stream
      const mockStream = {
        write: (data: string) => {
          console.log('Stream write:', data);
        },
        on: (event: string, callback: Function) => {
          console.log('Stream event listener:', event);
        },
        destroy: () => {
          console.log('Stream destroyed');
        }
      };

      this.streams.set(connectionId, mockStream);
      connection.lastActivity = new Date();
      
      return mockStream;
    } catch (error) {
      throw new SSHConnectionError('Failed to create stream', 'STREAM_CREATION_FAILED');
    }
  }

  /**
   * Get connection status
   * @param connectionId Connection identifier
   * @returns Connection object or null if not found
   */
  getConnection(connectionId: string): SSHConnection | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Get all active connections
   * @returns Array of active connections
   */
  getActiveConnections(): SSHConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.isConnected);
  }

  /**
   * Validate SSH configuration
   * @param config SSH configuration to validate
   * @throws {SSHConnectionError} When configuration is invalid
   */
  private validateConfig(config: SSHConfig): void {
    if (!config.host || config.host.trim() === '') {
      throw new SSHConnectionError('Host is required', 'INVALID_CONFIG');
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      throw new SSHConnectionError('Valid port is required', 'INVALID_CONFIG');
    }
    
    if (!config.username || config.username.trim() === '') {
      throw new SSHConnectionError('Username is required', 'INVALID_CONFIG');
    }
    
    if (!config.password && !config.privateKey) {
      throw new SSHConnectionError('Password or private key is required', 'INVALID_CONFIG');
    }
  }

  /**
   * Generate unique connection identifier
   * @returns Unique connection ID
   */
  private generateConnectionId(): string {
    return `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sshClient = new SSHClient();