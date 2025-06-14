/**
 * WebSocket-based SSH API for Claude Code mobile client
 * Connects to a server that manages SSH connections via WebSocket
 */

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

export interface WebSocketMessage {
  type: 'connect' | 'disconnect' | 'command' | 'create_session' | 'list_sessions' | 'attach_session' | 'kill_session';
  payload?: any;
  id?: string;
}

export interface WebSocketResponse {
  type: 'connected' | 'disconnected' | 'output' | 'sessions' | 'session_created' | 'error';
  payload?: any;
  id?: string;
}

export class WebSocketSSHManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private config: SSHConfig | null = null;
  private outputListeners: Array<(output: TerminalOutput) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private messageHandlers: Map<string, (response: WebSocketResponse) => void> = new Map();
  private messageId = 0;

  constructor(private serverUrl: string = 'ws://localhost:8080/ssh') {}

  async connect(config: SSHConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.config = config;
        
        // Connect to WebSocket server
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          
          // Send SSH connection request
          const message: WebSocketMessage = {
            type: 'connect',
            payload: config,
            id: this.generateMessageId()
          };
          
          this.messageHandlers.set(message.id!, (response) => {
            if (response.type === 'connected') {
              this.isConnected = true;
              this.notifyConnectionListeners(true);
              resolve();
            } else if (response.type === 'error') {
              reject(new Error(response.payload?.message || 'SSH connection failed'));
            }
          });
          
          this.ws!.send(JSON.stringify(message));
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.notifyConnectionListeners(false);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        const message: WebSocketMessage = {
          type: 'disconnect',
          id: this.generateMessageId()
        };
        
        this.messageHandlers.set(message.id!, () => {
          resolve();
        });
        
        this.ws.send(JSON.stringify(message));
        
        // Close WebSocket after a delay
        setTimeout(() => {
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          this.isConnected = false;
          this.notifyConnectionListeners(false);
          resolve();
        }, 1000);
      } else {
        resolve();
      }
    });
  }

  async listSessions(): Promise<Session[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('SSH connection not established'));
        return;
      }

      const message: WebSocketMessage = {
        type: 'list_sessions',
        id: this.generateMessageId()
      };

      this.messageHandlers.set(message.id!, (response) => {
        if (response.type === 'sessions') {
          resolve(response.payload || []);
        } else if (response.type === 'error') {
          reject(new Error(response.payload?.message || 'Failed to list sessions'));
        }
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  async createSession(name: string): Promise<Session> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('SSH connection not established'));
        return;
      }

      const message: WebSocketMessage = {
        type: 'create_session',
        payload: { name },
        id: this.generateMessageId()
      };

      this.messageHandlers.set(message.id!, (response) => {
        if (response.type === 'session_created') {
          resolve(response.payload);
        } else if (response.type === 'error') {
          reject(new Error(response.payload?.message || 'Failed to create session'));
        }
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  async attachToSession(sessionName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('SSH connection not established'));
        return;
      }

      const message: WebSocketMessage = {
        type: 'attach_session',
        payload: { name: sessionName },
        id: this.generateMessageId()
      };

      this.messageHandlers.set(message.id!, (response) => {
        if (response.type === 'connected') {
          resolve();
        } else if (response.type === 'error') {
          reject(new Error(response.payload?.message || 'Failed to attach to session'));
        }
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  async killSession(sessionName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('SSH connection not established'));
        return;
      }

      const message: WebSocketMessage = {
        type: 'kill_session',
        payload: { name: sessionName },
        id: this.generateMessageId()
      };

      this.messageHandlers.set(message.id!, (response) => {
        if (response.type === 'connected') {
          resolve();
        } else if (response.type === 'error') {
          reject(new Error(response.payload?.message || 'Failed to kill session'));
        }
      });

      this.ws.send(JSON.stringify(message));
    });
  }

  async sendCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('SSH connection not established'));
        return;
      }

      const message: WebSocketMessage = {
        type: 'command',
        payload: { command },
        id: this.generateMessageId()
      };

      this.ws.send(JSON.stringify(message));
      resolve(); // Commands are fire-and-forget, output comes via listeners
    });
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

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  private handleMessage(response: WebSocketResponse): void {
    // Handle responses with specific IDs
    if (response.id && this.messageHandlers.has(response.id)) {
      const handler = this.messageHandlers.get(response.id)!;
      handler(response);
      this.messageHandlers.delete(response.id);
      return;
    }

    // Handle broadcast messages
    switch (response.type) {
      case 'output':
        const output: TerminalOutput = {
          data: response.payload?.data || '',
          timestamp: new Date(response.payload?.timestamp || Date.now()),
          type: response.payload?.type || 'stdout'
        };
        this.notifyOutputListeners(output);
        break;
      
      case 'disconnected':
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        break;
    }
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
export const sshManager = new WebSocketSSHManager();