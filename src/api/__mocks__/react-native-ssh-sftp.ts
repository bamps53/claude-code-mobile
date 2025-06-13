/**
 * Mock implementation of react-native-ssh-sftp for testing
 */

export class SSHClient {
  private isConnected = false;
  private connectionConfig: any = null;
  private activeSessions: string[] = [];

  async connect(config: any): Promise<void> {
    this.connectionConfig = config;
    
    // Simulate connection validation
    if (config.host === 'invalid.host' || config.username === 'invaliduser') {
      throw new Error('Authentication failed');
    }
    
    if (config.host === 'nonexistent.test.local') {
      throw new Error('Connection timed out');
    }

    // Validate private key
    if (config.privateKey && 
        (config.privateKey === 'invalid-key' || 
         !config.privateKey.includes('-----BEGIN') || 
         !config.privateKey.includes('-----END'))) {
      throw new Error('Invalid private key format');
    }
    
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.connectionConfig = null;
  }

  async execute(command: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    // Mock tmux commands
    if (command.includes('tmux list-sessions')) {
      if (this.activeSessions.length === 0) {
        // Return empty for no sessions
        return '';
      }
      
      // Format sessions with required fields for tmux list output
      const now = Math.floor(Date.now() / 1000);
      return this.activeSessions
        .map(name => `${name}|${now}|${now}|0`)
        .join('\n');
    }

    if (command.includes('tmux new-session')) {
      // Extract session name from command
      const sessionNameMatch = command.match(/-s "?([^"\s]+)"?/);
      const sessionName = sessionNameMatch ? sessionNameMatch[1] : `session-${Date.now()}`;
      
      // Add to active sessions
      if (!this.activeSessions.includes(sessionName)) {
        this.activeSessions.push(sessionName);
      }
      
      // Simulate successful session creation
      return '';
    }

    if (command.includes('tmux kill-session')) {
      const sessionNameMatch = command.match(/-t "?([^"\s]+)"?/);
      const sessionName = sessionNameMatch ? sessionNameMatch[1] : '';
      
      if (sessionName === 'nonexistent-session' || !this.activeSessions.includes(sessionName)) {
        throw new Error('Session not found');
      }
      
      // Remove from active sessions
      this.activeSessions = this.activeSessions.filter(name => name !== sessionName);
      return '';
    }

    // Default success
    return 'command output';
  }

  async executeInteractive(command: string, options: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    // Simulate interactive session
    setTimeout(() => {
      if (options.onData) {
        options.onData('Interactive session started\n');
      }
    }, 100);
  }

  async writeToShell(data: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }
    // Simulate successful write
  }
}