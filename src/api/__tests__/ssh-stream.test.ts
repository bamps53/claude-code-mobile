/**
 * Unit tests for SSH Stream Handling
 * Tests stdin/stdout stream management and real-time data streaming
 */

import { SSHConnectionManager, SSHConfig, TerminalOutput } from '../ssh';

// SSHClient will be automatically mocked via the Jest moduleNameMapper
// in the mock setup, so we don't need explicit mocking here

describe('SSH Stream Handling', () => {
  let sshManager: SSHConnectionManager;
  let validConfig: SSHConfig;

  beforeEach(async () => {
    sshManager = new SSHConnectionManager();
    validConfig = {
      host: 'test.example.com',
      port: 22,
      username: 'testuser',
      password: 'testpass'
    };
    await sshManager.connect(validConfig);
  });

  afterEach(async () => {
    try {
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Output Stream Management', () => {
    it('should notify output listeners when stdout data is received', async () => {
      const mockOutputListener = jest.fn();
      sshManager.addOutputListener(mockOutputListener);
      
      // Mock client with custom executeInteractive
      const mockClient = {
        executeInteractive: (command: string, options: any) => {
          // Simulate data coming from the interactive session
          setTimeout(() => options.onData('Test stdout data'), 10);
          return Promise.resolve();
        }
      };
      
      // @ts-ignore - replace the client with our mock for testing
      sshManager.client = mockClient;
      
      await sshManager.attachToSession('test-session');
      
      // Wait for the async data event
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockOutputListener).toHaveBeenCalledTimes(1);
      const output = mockOutputListener.mock.calls[0][0];
      expect(output.data).toBe('Test stdout data');
      expect(output.type).toBe('stdout');
      expect(output.timestamp).toBeInstanceOf(Date);
    });
    
    it('should notify output listeners when stderr data is received', async () => {
      const mockOutputListener = jest.fn();
      sshManager.addOutputListener(mockOutputListener);
      
      // Mock client with custom executeInteractive
      const mockClient = {
        executeInteractive: (command: string, options: any) => {
          // Simulate error output from the interactive session
          setTimeout(() => options.onError('Test stderr data'), 10);
          return Promise.resolve();
        }
      };
      
      // @ts-ignore - replace the client with our mock for testing
      sshManager.client = mockClient;
      
      await sshManager.attachToSession('test-session');
      
      // Wait for the async data event
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockOutputListener).toHaveBeenCalledTimes(1);
      const output = mockOutputListener.mock.calls[0][0];
      expect(output.data).toBe('Test stderr data');
      expect(output.type).toBe('stderr');
      expect(output.timestamp).toBeInstanceOf(Date);
    });

    it('should handle multiple output listeners', async () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      sshManager.addOutputListener(mockListener1);
      sshManager.addOutputListener(mockListener2);
      
      // Mock the notifyOutputListeners method directly
      const testOutput: TerminalOutput = {
        data: 'Test data',
        timestamp: new Date(),
        type: 'stdout'
      };
      
      // @ts-ignore - accessing private method for testing
      sshManager.notifyOutputListeners(testOutput);
      
      expect(mockListener1).toHaveBeenCalledWith(testOutput);
      expect(mockListener2).toHaveBeenCalledWith(testOutput);
    });

    it('should allow removing output listeners', async () => {
      const mockListener = jest.fn();
      
      sshManager.addOutputListener(mockListener);
      sshManager.removeOutputListener(mockListener);
      
      // Mock the notifyOutputListeners method directly
      const testOutput: TerminalOutput = {
        data: 'Test data',
        timestamp: new Date(),
        type: 'stdout'
      };
      
      // @ts-ignore - accessing private method for testing
      sshManager.notifyOutputListeners(testOutput);
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Command Input Stream', () => {
    it('should send command to shell', async () => {
      // Create a spy on the client's writeToShell method
      const writeToShellSpy = jest.fn().mockResolvedValue(undefined);
      
      // Replace the client with our mock that includes the spy
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: writeToShellSpy
      };
      
      const testCommand = 'echo "test command"';
      await sshManager.sendCommand(testCommand);
      
      expect(writeToShellSpy).toHaveBeenCalledWith(testCommand + '\n');
    });

    it('should throw error when sending command while disconnected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.sendCommand('test')).rejects.toThrow('SSH connection not established');
    });

    it('should handle command send errors', async () => {
      // Mock a failure in writeToShell
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: jest.fn().mockRejectedValue(new Error('Write failed'))
      };
      
      await expect(sshManager.sendCommand('test')).rejects.toThrow('Failed to send command');
    });
  });

  describe('Key Sequence Handling', () => {
    it('should send valid key sequences to shell', async () => {
      // Create a spy on the client's writeToShell method
      const writeToShellSpy = jest.fn().mockResolvedValue(undefined);
      
      // Replace the client with our mock
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: writeToShellSpy
      };
      
      // Test each supported key sequence
      const sequences = [
        { input: 'ctrl+c', expected: '\u0003' },
        { input: 'ctrl+d', expected: '\u0004' },
        { input: 'ctrl+z', expected: '\u001a' },
        { input: 'tab', expected: '\t' },
        { input: 'enter', expected: '\n' },
      ];
      
      for (const seq of sequences) {
        writeToShellSpy.mockClear();
        await sshManager.sendKeySequence(seq.input);
        expect(writeToShellSpy).toHaveBeenCalledWith(seq.expected);
      }
    });

    it('should throw error for unknown key sequence', async () => {
      await expect(sshManager.sendKeySequence('unknown-sequence')).rejects.toThrow('Unknown key sequence');
    });

    it('should throw error when sending key sequence while disconnected', async () => {
      await sshManager.disconnect();
      
      await expect(sshManager.sendKeySequence('ctrl+c')).rejects.toThrow('SSH connection not established');
    });

    it('should handle key sequence send errors', async () => {
      // Mock a failure in writeToShell
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: jest.fn().mockRejectedValue(new Error('Write failed'))
      };
      
      await expect(sshManager.sendKeySequence('ctrl+c')).rejects.toThrow('Failed to send key sequence');
    });
  });

  describe('Stream Error Recovery', () => {
    it('should handle reconnection after stream error', async () => {
      // First simulate a stream error by making the client throw
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: jest.fn().mockRejectedValue(new Error('Stream closed unexpectedly')),
        disconnect: jest.fn().mockResolvedValue(undefined)
      };
      
      // Command should fail
      await expect(sshManager.sendCommand('test')).rejects.toThrow();
      
      // Disconnect and reconnect
      await sshManager.disconnect();
      await sshManager.connect(validConfig);
      
      // Replace with working mock
      // @ts-ignore - replacing client for testing
      sshManager.client = {
        writeToShell: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined)
      };
      
      // Should now succeed
      await expect(sshManager.sendCommand('test')).resolves.toBeUndefined();
    });
  });

  describe('Stream Cleanup', () => {
    it('should clean up streams on disconnect', async () => {
      // Create a client mock with methods we can spy on
      const mockClient = {
        executeInteractive: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined)
      };
      
      // @ts-ignore - replace client for testing
      sshManager.client = mockClient;
      
      await sshManager.disconnect();
      
      // Verify the disconnect was called
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });
});
