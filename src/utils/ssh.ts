/**
 * SSH connection utilities
 * @description Provides SSH connection management and command execution functionality
 */

import SSHClient from '@dylankenneally/react-native-ssh-sftp';
import { SSHConnection } from '../types';

/**
 * Our SSH client wrapper interface
 * @description Provides a clean interface for SSH operations
 */
export interface SSHClientWrapper {
  executeCommand: (command: string) => Promise<string>;
  isConnected: () => boolean;
  disconnect: () => Promise<void>;
}

// Export alias for backward compatibility
export { SSHClientWrapper as SSHClient };

/**
 * SSH connection configuration
 * @description Configuration object for SSH connections
 */
interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

/**
 * Validates SSH connection credentials
 * @description Ensures all required fields are present and valid
 * @param connection - SSH connection configuration
 * @returns True if credentials are valid, false otherwise
 * @example
 * ```typescript
 * const isValid = validateSSHCredentials(connection);
 * if (!isValid) {
 *   throw new Error('Invalid credentials');
 * }
 * ```
 */
export function validateSSHCredentials(connection: SSHConnection): boolean {
  // Check required fields
  if (!connection.host || connection.host.trim() === '') {
    return false;
  }

  if (!connection.username || connection.username.trim() === '') {
    return false;
  }

  if (connection.port <= 0 || connection.port > 65535) {
    return false;
  }

  // Check authentication method specific requirements
  if (connection.authType === 'password') {
    return !!(connection.password && connection.password.trim() !== '');
  }

  if (connection.authType === 'key') {
    return !!(connection.privateKey && connection.privateKey.trim() !== '');
  }

  return false;
}

/**
 * Creates a user-friendly error message from SSH connection errors
 * @description Maps technical errors to user-understandable messages
 * @param error - The original error
 * @returns User-friendly error message
 */
function createUserFriendlyError(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('enotfound')) {
    return 'Server not found. Please check the hostname.';
  }

  if (message.includes('econnrefused') || message.includes('connection refused')) {
    return 'Connection refused. Please check the port and firewall settings.';
  }

  if (message.includes('etimedout') || message.includes('timeout')) {
    return 'Connection timed out. Please check your network connection.';
  }

  if (message.includes('authentication failed') || message.includes('auth')) {
    return 'Authentication failed. Please check your credentials.';
  }

  if (message.includes('host key verification failed')) {
    return 'Host key verification failed. The server identity cannot be verified.';
  }

  if (message.includes('no route to host')) {
    return 'No route to host. Please check your network configuration.';
  }

  // Return original error message with prefix for unknown errors
  return `Failed to connect: ${error.message}`;
}

/**
 * SSH client wrapper implementation
 * @description Wraps the native SSH client with error handling and logging
 */
class SSHClientWrapperImpl implements SSHClientWrapper {
  private client: InstanceType<typeof SSHClient>;
  private connectionConfig: SSHConfig;
  private connected: boolean = false;

  constructor(client: InstanceType<typeof SSHClient>, config: SSHConfig) {
    this.client = client;
    this.connectionConfig = config;
    this.connected = true; // Set to true when successfully created
  }

  /**
   * Executes a command on the remote server
   * @description Runs a command via SSH and returns the output
   * @param command - The command to execute
   * @returns Promise that resolves to command output
   * @throws Error if command execution fails
   * @example
   * ```typescript
   * const output = await sshClient.executeCommand('ls -la');
   * console.log(output);
   * ```
   */
  async executeCommand(command: string): Promise<string> {
    try {
      if (!this.isConnected()) {
        throw new Error('SSH client is not connected');
      }

      // Use the execute method from the native SSH client
      const result = await this.client.execute(command);
      return result || '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Command execution failed: ${errorMessage}`);
    }
  }

  /**
   * Checks if the SSH connection is active
   * @description Returns the current connection status
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    // For the @dylankenneally/react-native-ssh-sftp library,
    // we track connection state internally since the library
    // doesn't expose an isConnected method
    return this.connected;
  }

  /**
   * Disconnects from the SSH server
   * @description Gracefully closes the SSH connection
   * @returns Promise that resolves when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.client.disconnect();
        this.connected = false;
      }
    } catch (error) {
      // Log error but don't throw - disconnection should be graceful
      console.warn('Error during SSH disconnect:', error);
      this.connected = false;
    }
  }

  /**
   * Sets the connection status (internal use only)
   * @description Used to track connection state after successful connection
   * @param connected - Connection status
   */
  setConnected(connected: boolean): void {
    this.connected = connected;
  }
}

/**
 * Creates and establishes an SSH connection
 * @description Creates a new SSH client and connects to the specified server
 * @param connection - SSH connection configuration
 * @returns Promise that resolves to connected SSH client
 * @throws Error if connection fails or credentials are invalid
 * @example
 * ```typescript
 * try {
 *   const sshClient = await createSSHConnection(connection);
 *   const output = await sshClient.executeCommand('whoami');
 *   console.log('Connected as:', output.trim());
 * } catch (error) {
 *   console.error('Connection failed:', error.message);
 * }
 * ```
 */
export async function createSSHConnection(
  connection: SSHConnection
): Promise<SSHClientWrapper> {
  // Validate credentials before attempting connection
  if (!validateSSHCredentials(connection)) {
    throw new Error('Invalid SSH credentials');
  }

  const config: SSHConfig = {
    host: connection.host,
    port: connection.port,
    username: connection.username,
  };

  // Add authentication credentials based on type
  if (connection.authType === 'password') {
    config.password = connection.password;
  } else if (connection.authType === 'key') {
    config.privateKey = connection.privateKey;
  }

  try {
    let client: InstanceType<typeof SSHClient>;

    // Connect using the appropriate authentication method
    if (connection.authType === 'password') {
      if (!config.password) {
        throw new Error('Password is required for password authentication');
      }

      client = await SSHClient.connectWithPassword(
        config.host,
        config.port,
        config.username,
        config.password
      );
    } else if (connection.authType === 'key') {
      if (!config.privateKey) {
        throw new Error('Private key is required for key authentication');
      }

      // Extract passphrase from private key if provided
      // For now, we assume no passphrase. This can be enhanced later.
      client = await SSHClient.connectWithKey(
        config.host,
        config.port,
        config.username,
        config.privateKey,
        undefined // passphrase - can be added to SSHConnection type later
      );
    } else {
      throw new Error('Invalid authentication type');
    }

    // Create wrapper instance
    const wrapper = new SSHClientWrapperImpl(client, config);

    return wrapper;
  } catch (error) {
    const friendlyError = createUserFriendlyError(error as Error);
    throw new Error(friendlyError);
  }
}

/**
 * Tests SSH connection without storing the client
 * @description Performs a quick connection test and disconnects immediately
 * @param connection - SSH connection configuration
 * @returns Promise that resolves to true if connection succeeds
 * @throws Error if connection fails
 * @example
 * ```typescript
 * try {
 *   await testSSHConnection(connection);
 *   console.log('Connection test successful');
 * } catch (error) {
 *   console.error('Connection test failed:', error.message);
 * }
 * ```
 */
export async function testSSHConnection(connection: SSHConnection): Promise<boolean> {
  const client = await createSSHConnection(connection);
  try {
    // Test basic command execution
    await client.executeCommand('echo "connection test"');
    return true;
  } finally {
    await client.disconnect();
  }
}
