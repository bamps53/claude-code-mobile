/**
 * SSH connection utilities
 * @description Provides SSH connection management and command execution functionality
 */

import { NativeModules } from 'react-native';
import SSHClient from '@dylankenneally/react-native-ssh-sftp';
import { SSHConnection } from '../types';

// Debug: Check if native module is properly loaded
console.log('NativeModules:', NativeModules);
console.log('NativeModules.RNSSHClient:', NativeModules.RNSSHClient);
console.log('SSHClient module loaded:', SSHClient);
console.log('SSHClient.connectWithPassword:', SSHClient?.connectWithPassword);
console.log('SSHClient.connectWithKey:', SSHClient?.connectWithKey);

/**
 * Our SSH client wrapper interface
 * @description Provides a clean interface for SSH operations
 */
export interface SSHClientWrapper {
  executeCommand: (command: string) => Promise<string>;
  isConnected: () => boolean;
  disconnect: () => Promise<void>;
  attachToTmuxSession: (
    sessionName: string,
    outputCallback: (data: string) => void
  ) => Promise<void>;
  detachFromTmuxSession: () => Promise<void>;
  sendToTmuxSession: (data: string) => Promise<void>;
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
  private currentTmuxSession: string | null = null;
  private outputCallback: ((data: string) => void) | null = null;
  private outputPollingTimeout: NodeJS.Timeout | null = null;

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
      // Stop output monitoring first
      await this.detachFromTmuxSession();

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

  /**
   * Attaches to a tmux session and starts monitoring output
   * @description Begins real-time output streaming from the specified tmux session
   * @param sessionName - Name of the tmux session to attach to
   * @param outputCallback - Callback function to receive output data
   * @returns Promise that resolves when attachment is successful
   * @throws Error if attachment fails
   * @example
   * ```typescript
   * await sshClient.attachToTmuxSession('my-session', (data) => {
   *   console.log('Received:', data);
   * });
   * ```
   */
  async attachToTmuxSession(
    sessionName: string,
    outputCallback: (data: string) => void
  ): Promise<void> {
    try {
      if (!this.isConnected()) {
        throw new Error('SSH client is not connected');
      }

      // Detach from any existing session first
      await this.detachFromTmuxSession();

      this.currentTmuxSession = sessionName;
      this.outputCallback = outputCallback;

      // Send initial welcome message
      outputCallback(`\x1b[32mAttaching to tmux session: ${sessionName}\x1b[0m\r\n`);

      // Start output monitoring with tmux capture-pane
      this.startOutputMonitoring();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to attach to tmux session: ${errorMessage}`);
    }
  }

  /**
   * Detaches from the current tmux session
   * @description Stops output monitoring and clears session state
   * @returns Promise that resolves when detachment is complete
   */
  async detachFromTmuxSession(): Promise<void> {
    try {
      // Stop output polling
      if (this.outputPollingTimeout) {
        clearTimeout(this.outputPollingTimeout);
        this.outputPollingTimeout = null;
      }

      // Clear session state
      this.currentTmuxSession = null;
      this.outputCallback = null;
    } catch (error) {
      console.warn('Error during tmux detach:', error);
    }
  }

  /**
   * Sends input data to the current tmux session
   * @description Sends keystrokes to the attached tmux session
   * @param data - Input data to send
   * @returns Promise that resolves when data is sent
   * @throws Error if no session is attached or sending fails
   * @example
   * ```typescript
   * await sshClient.sendToTmuxSession('ls -la\n');
   * ```
   */
  async sendToTmuxSession(data: string): Promise<void> {
    try {
      if (!this.currentTmuxSession) {
        throw new Error('No tmux session attached');
      }

      if (!this.isConnected()) {
        throw new Error('SSH client is not connected');
      }

      // Send keys to the tmux session
      const escapedData = data.replace(/"/g, '\\"');
      await this.client.execute(
        `tmux send-keys -t "${this.currentTmuxSession}" "${escapedData}"`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send data to tmux session: ${errorMessage}`);
    }
  }

  /**
   * Starts output monitoring for the current tmux session
   * @description Begins intelligent monitoring of tmux output for changes
   * @private
   */
  private startOutputMonitoring(): void {
    if (!this.currentTmuxSession || !this.outputCallback) {
      return;
    }

    let lastCaptureHash = '';
    let consecutiveEmptyChecks = 0;
    const maxEmptyChecks = 20; // Reduce polling frequency after no activity

    // Intelligent polling with adaptive frequency
    const poll = async () => {
      try {
        if (!this.currentTmuxSession || !this.outputCallback || !this.isConnected()) {
          return;
        }

        // Capture the entire scrollback history for the session
        const output = await this.client.execute(
          `tmux capture-pane -t "${this.currentTmuxSession}" -p -S -3000`
        );

        // Create a simple hash to detect changes
        const currentHash = this.simpleHash(output);

        if (currentHash !== lastCaptureHash) {
          // Output has changed - send the current screen content
          if (output && output.trim()) {
            // Send the full current screen content
            this.outputCallback('\x1b[2J\x1b[H' + output); // Clear screen and show current content
          }
          lastCaptureHash = currentHash;
          consecutiveEmptyChecks = 0;
        } else {
          consecutiveEmptyChecks++;
        }

        // Adaptive polling frequency
        let nextInterval = 150; // Base interval
        if (consecutiveEmptyChecks > maxEmptyChecks) {
          nextInterval = 500; // Slow down if no activity
        }

        this.outputPollingTimeout = setTimeout(poll, nextInterval);
      } catch (error) {
        // Reduce error spam but continue monitoring
        console.debug('Output monitoring error:', error);
        this.outputPollingTimeout = setTimeout(poll, 300);
      }
    };

    // Start monitoring
    poll();
  }

  /**
   * Creates a simple hash for change detection
   * @description Fast hash function for detecting output changes
   * @param str - String to hash
   * @returns Simple hash value
   * @private
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
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
    // Check if SSHClient is properly loaded
    if (!SSHClient || typeof SSHClient.connectWithPassword !== 'function') {
      throw new Error(
        'SSH module not properly loaded. Please rebuild the app with EAS development build.'
      );
    }

    let client: InstanceType<typeof SSHClient>;

    // Connect using the appropriate authentication method
    if (connection.authType === 'password') {
      if (!config.password) {
        throw new Error('Password is required for password authentication');
      }

      console.log('Attempting SSH connection with password to:', config.host);
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

      console.log('Attempting SSH connection with key to:', config.host);
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

    console.log('SSH connection successful');
    return wrapper;
  } catch (error) {
    console.error('SSH connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a native module loading issue
    if (errorMessage.includes('null') || errorMessage.includes('undefined')) {
      throw new Error(
        'SSH native module not loaded. Please ensure you are running a development build created with EAS Build, not Expo Go.'
      );
    }

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
