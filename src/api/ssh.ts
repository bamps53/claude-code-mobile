/**
 * SSH API implementation for Claude Code mobile client
 * Handles SSH connections, session management, and terminal I/O
 */

import { Client as SSH2Client, ConnectConfig, ClientChannel } from 'ssh2';

// Real SSH2 implementation
const SSHClient = SSH2Client;
type SSHClientType = SSH2Client;

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
  private currentStream: ClientChannel | null = null;

  /**
   * Establish SSH connection to the server
   * @param config SSH connection configuration
   * @returns Promise that resolves when connection is established
   */
  async connect(config: SSHConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.config = config;
        this.client = new SSHClient();

        const connectionOptions: ConnectConfig = {
          host: config.host,
          port: config.port,
          username: config.username,
          ...(config.password ? { password: config.password } : {}),
          ...(config.privateKey ? { privateKey: config.privateKey } : {}),
          readyTimeout: 30000, // 30 second timeout
        };

        this.client.on('ready', () => {
          this.isConnected = true;
          this.notifyConnectionListeners(true);
          resolve();
        });

        this.client.on('error', (error: Error) => {
          this.isConnected = false;
          this.notifyConnectionListeners(false);
          reject(new Error(`SSH connection failed: ${error.message}`));
        });

        this.client.on('close', () => {
          this.isConnected = false;
          this.notifyConnectionListeners(false);
        });

        this.client.connect(connectionOptions);
      } catch (error) {
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        reject(new Error(`SSH connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Disconnect from SSH server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end();
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

    return new Promise((resolve, reject) => {
      this.client!.exec('tmux list-sessions -F "#{session_name}|#{session_created}|#{session_activity}|#{session_attached}"', (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(new Error(`Failed to execute command: ${err.message}`));
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('close', (code: number) => {
          if (code === 1 && errorOutput.includes('no server running')) {
            resolve([]); // No sessions exist
            return;
          }
          
          if (code !== 0) {
            reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
            return;
          }

          try {
            const sessions = output.split('\n')
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
            resolve(sessions);
          } catch (parseError) {
            reject(new Error(`Failed to parse session list: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`));
          }
        });

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
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

    return new Promise((resolve, reject) => {
      this.client!.exec(`tmux new-session -d -s "${sessionName}"`, (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(new Error(`Failed to create session: ${err.message}`));
          return;
        }

        let errorOutput = '';

        stream.on('close', async (code: number) => {
          if (code !== 0) {
            reject(new Error(`Failed to create session: ${errorOutput}`));
            return;
          }

          try {
            // Get session details
            const sessions = await this.listSessions();
            const newSession = sessions.find(s => s.name === sessionName);
            
            if (!newSession) {
              reject(new Error('Session created but not found in list'));
              return;
            }
            
            resolve(newSession);
          } catch (listError) {
            reject(new Error(`Session created but failed to retrieve details: ${listError instanceof Error ? listError.message : 'Unknown error'}`));
          }
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
  }

  /**
   * Attach to an existing tmux session
   * @param sessionName Name of the session to attach to
   */
  async attachToSession(sessionName: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      this.client!.shell((err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(new Error(`Failed to create shell: ${err.message}`));
          return;
        }

        // Store the stream for sending commands later
        this.currentStream = stream;

        // Set up data handlers
        stream.on('data', (data: Buffer) => {
          this.notifyOutputListeners({
            data: data.toString(),
            timestamp: new Date(),
            type: 'stdout',
          });
        });

        stream.stderr.on('data', (data: Buffer) => {
          this.notifyOutputListeners({
            data: data.toString(),
            timestamp: new Date(),
            type: 'stderr',
          });
        });

        stream.on('close', () => {
          this.currentStream = null;
        });

        // Send tmux attach command
        stream.write(`tmux attach-session -t "${sessionName}"\n`);
        
        resolve();
      });
    });
  }

  /**
   * Send command to the current tmux session
   * @param command Command to execute
   */
  async sendCommand(command: string): Promise<void> {
    if (!this.isConnectionActive()) {
      throw new Error('SSH connection not established');
    }

    if (!this.currentStream) {
      throw new Error('No active shell session');
    }

    try {
      this.currentStream.write(command + '\n');
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

    if (!this.currentStream) {
      throw new Error('No active shell session');
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
      this.currentStream.write(keyCode);
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

    return new Promise((resolve, reject) => {
      this.client!.exec(`tmux kill-session -t "${sessionName}"`, (err: Error | undefined, stream: ClientChannel) => {
        if (err) {
          reject(new Error(`Failed to kill session: ${err.message}`));
          return;
        }

        let errorOutput = '';

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`Failed to kill session: ${errorOutput}`));
            return;
          }
          resolve();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
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