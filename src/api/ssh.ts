/**
 * SSH API implementation for Claude Code mobile client
 * Handles SSH connections, session management, and terminal I/O
 */

// Use mock for testing, replace with actual library in production
let SSHClient: any;
type SSHClientType = any; // Define the type based on the imported value
try {
  const sshModule = require('react-native-ssh-sftp');
  SSHClient = sshModule.SSHClient;
} catch {
  // Fallback to mock for testing
  const mockModule = require('./__mocks__/react-native-ssh-sftp');
  SSHClient = mockModule.SSHClient;
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface Session {
  id: string;
  name: string;
  created: Date;
  lastActivity: Date;
  isAttached: boolean;
}

export interface TerminalOutput {
  data: string;
  timestamp: Date;
  type: 'stdout' | 'stderr';
}

export class SSHConnectionManager {
  private client: SSHClientType | null = null;
  private isConnected = false;
  private config: SSHConfig | null = null;
  private outputListeners: Array<(output: TerminalOutput) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];

  /**
   * Establish SSH connection to the server
   * @param config SSH connection configuration
   * @returns Promise that resolves when connection is established
   */
  async connect(config: SSHConfig): Promise<void> {
    try {
      this.config = config;
      this.client = new SSHClient();

      const connectionOptions = {
        host: config.host,
        port: config.port,
        username: config.username,
        ...(config.password ? { password: config.password } : {}),
        ...(config.privateKey ? { privateKey: config.privateKey } : {}),
      };

      await this.client.connect(connectionOptions);
      this.isConnected = true;
      this.notifyConnectionListeners(true);
    } catch (error) {
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      throw new Error(`SSH connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from SSH server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners(false);
  }

  /**
   * Check if SSH connection is active
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * List all tmux sessions on the remote server
   * @returns Array of session information
   */
  async listSessions(): Promise<Session[]> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    try {
      const result = await this.client!.execute('tmux list-sessions -F "#{session_name}|#{session_created}|#{session_activity}|#{session_attached}"');
      
      return result.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const [name, created, activity, attached] = line.split('|');
          return {
            id: name,
            name,
            created: new Date(parseInt(created) * 1000),
            lastActivity: new Date(parseInt(activity) * 1000),
            isAttached: attached === '1',
          };
        });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no server running')) {
        return []; // No sessions exist
      }
      throw new Error(`Failed to list sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new tmux session
   * @param sessionName Name for the new session
   * @returns Session information
   */
  async createSession(sessionName: string): Promise<Session> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    try {
      await this.client!.execute(`tmux new-session -d -s "${sessionName}"`);
      
      // Get session details
      const sessions = await this.listSessions();
      const newSession = sessions.find(s => s.name === sessionName);
      
      if (!newSession) {
        throw new Error('Session created but not found in list');
      }
      
      return newSession;
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Attach to an existing tmux session
   * @param sessionName Name of the session to attach to
   */
  async attachToSession(sessionName: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    try {
      // Start interactive shell with tmux attach
      await this.client!.executeInteractive(`tmux attach-session -t "${sessionName}"`, {
        onData: (data: string) => {
          this.notifyOutputListeners({
            data,
            timestamp: new Date(),
            type: 'stdout',
          });
        },
        onError: (error: string) => {
          this.notifyOutputListeners({
            data: error,
            timestamp: new Date(),
            type: 'stderr',
          });
        },
      });
    } catch (error) {
      throw new Error(`Failed to attach to session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send command to the current tmux session
   * @param command Command to execute
   */
  async sendCommand(command: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    try {
      await this.client!.writeToShell(command + '\n');
    } catch (error) {
      throw new Error(`Failed to send command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send special key sequence (Ctrl+C, etc.)
   * @param sequence Key sequence to send
   */
  async sendKeySequence(sequence: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    const sequences: Record<string, string> = {
      'ctrl+c': '\x03',
      'ctrl+d': '\x04',
      'ctrl+z': '\x1a',
      'tab': '\t',
      'enter': '\n',
    };

    const keyCode = sequences[sequence.toLowerCase()];
    if (!keyCode) {
      throw new Error(`Unknown key sequence: ${sequence}`);
    }

    try {
      await this.client!.writeToShell(keyCode);
    } catch (error) {
      throw new Error(`Failed to send key sequence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Kill a tmux session
   * @param sessionName Name of the session to kill
   */
  async killSession(sessionName: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    try {
      await this.client!.execute(`tmux kill-session -t "${sessionName}"`);
    } catch (error) {
      throw new Error(`Failed to kill session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add listener for terminal output
   * @param listener Function to call when output is received
   */
  addOutputListener(listener: (output: TerminalOutput) => void): void {
    this.outputListeners.push(listener);
  }

  /**
   * Remove output listener
   * @param listener Function to remove
   */
  removeOutputListener(listener: (output: TerminalOutput) => void): void {
    this.outputListeners = this.outputListeners.filter(l => l !== listener);
  }

  /**
   * Add listener for connection status changes
   * @param listener Function to call when connection status changes
   */
  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  /**
   * Remove connection listener
   * @param listener Function to remove
   */
  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  private notifyOutputListeners(output: TerminalOutput): void {
    this.outputListeners.forEach(listener => listener(output));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }
}