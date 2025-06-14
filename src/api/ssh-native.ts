/**
 * Native SSH API using react-native-ssh-sftp
 * For production use with direct SSH connections
 */

import SSHClient from '@dylankenneally/react-native-ssh-sftp';

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
  created: string;
  isActive: boolean;
  lastActivity?: string;
}

export interface TerminalOutput {
  data: string;
  timestamp: Date;
  type: 'stdout' | 'stderr';
}

export class NativeSSHManager {
  private client: any = null;
  private isConnected = false;
  private config: SSHConfig | null = null;
  private outputListeners: Array<(output: TerminalOutput) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private currentSession: string | null = null;

  async connect(config: SSHConfig): Promise<void> {
    try {
      this.config = config;
      
      // Use appropriate connection method based on credentials
      if (config.privateKey) {
        // Connect with private key
        this.client = await SSHClient.connectWithKey(
          config.host,
          config.port,
          config.username,
          config.privateKey,
          config.password // passphrase for private key
        );
      } else if (config.password) {
        // Connect with password
        this.client = await SSHClient.connectWithPassword(
          config.host,
          config.port,
          config.username,
          config.password
        );
      } else {
        throw new Error('SSH connection failed: No password or private key provided');
      }

      this.isConnected = true;
      this.notifyConnectionListeners(true);

    } catch (error) {
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      throw new Error(`SSH connection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        // Close shell if active
        if (this.currentSession) {
          await this.client.closeShell();
        }
        
        // Disconnect client
        await this.client.disconnect();
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      this.isConnected = false;
      this.client = null;
      this.currentSession = null;
      this.notifyConnectionListeners(false);
    }
  }

  async listSessions(): Promise<Session[]> {
    if (!this.isConnected || !this.client) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      // Execute tmux list-sessions command
      const command = 'tmux list-sessions -F "#{session_name},#{session_created},#{session_attached}" 2>/dev/null || echo "no_sessions"';
      
      this.client.execute(command)
        .then((output: string) => {

          try {
            const sessions: Session[] = [];
            const lines = output.trim().split('\n');
            
            // Handle case where no sessions exist
            if (lines.length === 1 && (lines[0] === 'no_sessions' || lines[0].includes('no server running'))) {
              resolve([]);
              return;
            }

            // Parse tmux session output
            for (const line of lines) {
              if (line.trim()) {
                const [name, created, attached] = line.split(',');
                if (name && created) {
                  sessions.push({
                    id: name,
                    name,
                    created: new Date(parseInt(created) * 1000).toISOString(),
                    isActive: attached === '1',
                    lastActivity: new Date().toISOString()
                  });
                }
              }
            }

            resolve(sessions);
          } catch (parseError) {
            reject(new Error(`Failed to parse session list: ${parseError}`));
          }
        })
        .catch((error: any) => {
          reject(new Error(`Failed to list sessions: ${error.message || error}`));
        });
    });
  }

  async createSession(name: string): Promise<Session> {
    if (!this.isConnected || !this.client) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      const command = `tmux new-session -d -s "${name}"`;
      
      this.client.execute(command)
        .then((output: string) => {
          // Session created successfully
          const newSession: Session = {
            id: name,
            name,
            created: new Date().toISOString(),
            isActive: true,
            lastActivity: new Date().toISOString()
          };

          resolve(newSession);
        })
        .catch((error: any) => {
          reject(new Error(`Failed to create session: ${error.message || error}`));
        });
    });
  }

  async attachToSession(sessionName: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('SSH connection not established');
    }

    try {
      // Start a shell session
      await this.client.startShell('vanilla');

      // Set up data listener for shell output
      this.client.on('Shell', (data: string) => {
        const output: TerminalOutput = {
          data,
          timestamp: new Date(),
          type: 'stdout'
        };
        this.notifyOutputListeners(output);
      });

      // Attach to the tmux session
      await this.client.writeToShell(`tmux attach-session -t "${sessionName}"\n`);
      this.currentSession = sessionName;
      
    } catch (error) {
      throw new Error(`Failed to attach to session: ${error instanceof Error ? error.message : error}`);
    }
  }

  async killSession(sessionName: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error('SSH connection not established');
    }

    try {
      const command = `tmux kill-session -t "${sessionName}"`;
      await this.client.execute(command);
    } catch (error) {
      throw new Error(`Failed to kill session: ${error instanceof Error ? error.message : error}`);
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.isConnected || !this.client || !this.currentSession) {
      throw new Error('No active session');
    }

    try {
      await this.client.writeToShell(command);
    } catch (error) {
      throw new Error(`Failed to send command: ${error instanceof Error ? error.message : error}`);
    }
  }

  async sendKeySequence(sequence: string): Promise<void> {
    const keySequences: { [key: string]: string } = {
      'ctrl+c': '\u0003',
      'ctrl+d': '\u0004', 
      'ctrl+z': '\u001a',
      'tab': '\t',
      'enter': '\n',
    };

    const keyCode = keySequences[sequence.toLowerCase()];
    if (!keyCode) {
      throw new Error(`Unknown key sequence: ${sequence}`);
    }

    return this.sendCommand(keyCode);
  }

  addOutputListener(listener: (output: TerminalOutput) => void): void {
    this.outputListeners.push(listener);
  }

  removeOutputListener(listener: (output: TerminalOutput) => void): void {
    const index = this.outputListeners.indexOf(listener);
    if (index > -1) {
      this.outputListeners.splice(index, 1);
    }
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(listener);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getConfig(): SSHConfig | null {
    return this.config;
  }

  private notifyOutputListeners(output: TerminalOutput): void {
    this.outputListeners.forEach(listener => {
      try {
        listener(output);
      } catch (error) {
        console.error('Output listener error:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Connection listener error:', error);
      }
    });
  }
}

// Export a singleton instance
export const nativeSSHManager = new NativeSSHManager();