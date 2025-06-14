/**
 * Mock implementation of ssh2 for testing
 */

export class Client {
  private isConnected = false;
  private connectionConfig: any = null;
  private activeSessions: string[] = [];
  private eventListeners: { [event: string]: Function[] } = {};

  connect(config: any): void {
    this.connectionConfig = config;
    
    // Simulate connection validation
    if (config.host === 'invalid.host' || config.username === 'invaliduser') {
      setTimeout(() => {
        this.emit('error', new Error('Authentication failed'));
      }, 10);
      return;
    }
    
    if (config.host === 'nonexistent.test.local') {
      setTimeout(() => {
        this.emit('error', new Error('getaddrinfo ENOTFOUND ' + config.host));
      }, 10);
      return;
    }

    // Validate private key
    if (config.privateKey && 
        (config.privateKey === 'invalid-key' || 
         !config.privateKey.includes('-----BEGIN') || 
         !config.privateKey.includes('-----END'))) {
      setTimeout(() => {
        this.emit('error', new Error('Invalid private key format'));
      }, 10);
      return;
    }
    
    this.isConnected = true;
    setTimeout(() => {
      this.emit('ready');
    }, 10);
  }

  end(): void {
    this.isConnected = false;
    this.connectionConfig = null;
    setTimeout(() => {
      this.emit('close');
    }, 10);
  }

  exec(command: string, callback: (err: Error | undefined, stream: any) => void): void {
    if (!this.isConnected) {
      callback(new Error('Not connected'), null);
      return;
    }

    const mockStream = {
      on: (event: string, handler: Function) => {
        if (event === 'close') {
          setTimeout(() => {
            let exitCode = 0;
            let output = '';
            let errorOutput = '';

            // Mock tmux commands
            if (command.includes('tmux list-sessions')) {
              if (this.activeSessions.length === 0) {
                // Return exit code 1 for no sessions
                exitCode = 1;
                errorOutput = 'no server running on /tmp/tmux';
              } else {
                // Format sessions with required fields for tmux list output
                const now = Math.floor(Date.now() / 1000);
                output = this.activeSessions
                  .map(name => `${name}|${now}|${now}|0`)
                  .join('\n');
              }
            } else if (command.includes('tmux new-session')) {
              // Extract session name from command
              const sessionNameMatch = command.match(/-s "?([^"\s]+)"?/);
              const sessionName = sessionNameMatch ? sessionNameMatch[1] : `session-${Date.now()}`;
              
              // Add to active sessions
              if (!this.activeSessions.includes(sessionName)) {
                this.activeSessions.push(sessionName);
              }
            } else if (command.includes('tmux kill-session')) {
              const sessionNameMatch = command.match(/-t "?([^"\s]+)"?/);
              const sessionName = sessionNameMatch ? sessionNameMatch[1] : '';
              
              if (sessionName === 'nonexistent-session' || !this.activeSessions.includes(sessionName)) {
                exitCode = 1;
                errorOutput = 'Session not found';
              } else {
                // Remove from active sessions
                this.activeSessions = this.activeSessions.filter(name => name !== sessionName);
              }
            }

            handler(exitCode);
          }, 10);
        } else if (event === 'data') {
          // Store data handler for later use
          mockStream._dataHandler = handler;
          
          // Emit mock output based on command
          setTimeout(() => {
            if (command.includes('tmux list-sessions') && this.activeSessions.length > 0) {
              const now = Math.floor(Date.now() / 1000);
              const output = this.activeSessions
                .map(name => `${name}|${now}|${now}|0`)
                .join('\n');
              handler(Buffer.from(output));
            }
          }, 5);
        }
      },
      stderr: {
        on: (event: string, handler: Function) => {
          if (event === 'data') {
            mockStream._stderrHandler = handler;
            
            setTimeout(() => {
              if (command.includes('tmux list-sessions') && this.activeSessions.length === 0) {
                handler(Buffer.from('no server running on /tmp/tmux'));
              } else if (command.includes('tmux kill-session')) {
                const sessionNameMatch = command.match(/-t "?([^"\s]+)"?/);
                const sessionName = sessionNameMatch ? sessionNameMatch[1] : '';
                
                if (sessionName === 'nonexistent-session' || !this.activeSessions.includes(sessionName)) {
                  handler(Buffer.from('Session not found'));
                }
              }
            }, 5);
          }
        }
      },
      _dataHandler: null,
      _stderrHandler: null
    };

    callback(undefined, mockStream);
  }

  shell(callback: (err: Error | undefined, stream: any) => void): void {
    if (!this.isConnected) {
      callback(new Error('Not connected'), null);
      return;
    }

    const mockStream = {
      on: (event: string, handler: Function) => {
        if (event === 'close') {
          mockStream._closeHandler = handler;
        } else if (event === 'data') {
          mockStream._dataHandler = handler;
          
          // Simulate shell prompt
          setTimeout(() => {
            handler(Buffer.from('$ '));
          }, 10);
        }
      },
      stderr: {
        on: (event: string, handler: Function) => {
          if (event === 'data') {
            mockStream._stderrHandler = handler;
          }
        }
      },
      write: (data: string) => {
        // Echo back the command
        if (mockStream._dataHandler) {
          setTimeout(() => {
            mockStream._dataHandler(Buffer.from(data));
          }, 5);
        }
      },
      _dataHandler: null,
      _stderrHandler: null,
      _closeHandler: null
    };

    callback(undefined, mockStream);
  }

  on(event: string, handler: Function): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  private emit(event: string, ...args: any[]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(handler => handler(...args));
    }
  }
}