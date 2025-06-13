/**
 * Integration tests for real-time terminal I/O
 * Tests bidirectional communication, command execution, and special character handling
 */

import { SSHConnectionManager, TerminalOutput } from '../src/api/ssh';
import { IntegrationTestEnvironment } from './setup';

describe('Terminal I/O Integration', () => {
  let sshManager: SSHConnectionManager;
  let testEnv: IntegrationTestEnvironment;
  const testSessionName = `terminal-test-${Date.now()}`;
  let outputBuffer: TerminalOutput[] = [];

  beforeAll(() => {
    testEnv = IntegrationTestEnvironment.getInstance();
  });

  beforeEach(async () => {
    sshManager = new SSHConnectionManager();
    await sshManager.connect(testEnv.getSSHConfig());
    
    // Create test session
    await sshManager.createSession(testSessionName);
    
    // Set up output listener
    outputBuffer = [];
    sshManager.addOutputListener((output) => {
      outputBuffer.push(output);
    });
  });

  afterEach(async () => {
    try {
      await sshManager.killSession(testSessionName);
      await sshManager.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Command Execution and Output', () => {
    beforeEach(async () => {
      await sshManager.attachToSession(testSessionName);
      // Wait for session to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should execute simple commands and receive output', async () => {
      await sshManager.sendCommand('echo "Hello, World!"');
      
      // Wait for output
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const outputs = outputBuffer.filter(o => o.type === 'stdout');
      expect(outputs.length).toBeGreaterThan(0);
      
      const hasExpectedOutput = outputs.some(output => 
        output.data.includes('Hello, World!')
      );
      expect(hasExpectedOutput).toBe(true);
    });

    it('should handle multi-line output correctly', async () => {
      const testLines = ['Line 1', 'Line 2', 'Line 3'];
      const command = testLines.map(line => `echo "${line}"`).join('; ');
      
      await sshManager.sendCommand(command);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const stdoutData = outputBuffer
        .filter(o => o.type === 'stdout')
        .map(o => o.data)
        .join('');
      
      testLines.forEach(line => {
        expect(stdoutData).toContain(line);
      });
    });

    it('should capture stderr output separately', async () => {
      await sshManager.sendCommand('echo "Error message" >&2');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stderrOutputs = outputBuffer.filter(o => o.type === 'stderr');
      expect(stderrOutputs.length).toBeGreaterThan(0);
      
      const hasErrorOutput = stderrOutputs.some(output => 
        output.data.includes('Error message')
      );
      expect(hasErrorOutput).toBe(true);
    });

    it('should handle commands with no output', async () => {
      const initialOutputCount = outputBuffer.length;
      await sshManager.sendCommand('true'); // Command that produces no output
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should not crash and may or may not produce output (depends on shell prompt)
      expect(outputBuffer.length).toBeGreaterThanOrEqual(initialOutputCount);
    });
  });

  describe('Special Character Handling', () => {
    beforeEach(async () => {
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should send Ctrl+C sequence correctly', async () => {
      // Start a long-running process
      await sshManager.sendCommand('sleep 10');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send Ctrl+C to interrupt
      await sshManager.sendKeySequence('ctrl+c');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Process should be interrupted, shell should be responsive
      await sshManager.sendCommand('echo "After interrupt"');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const outputs = outputBuffer.filter(o => o.type === 'stdout');
      const hasInterruptOutput = outputs.some(output => 
        output.data.includes('After interrupt')
      );
      expect(hasInterruptOutput).toBe(true);
    });

    it('should handle Tab completion', async () => {
      // Type partial command and send tab
      await sshManager.sendCommand('ec'); // Partial command
      await sshManager.sendKeySequence('tab');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Tab should trigger completion behavior
      // The exact behavior depends on shell configuration
      expect(outputBuffer.length).toBeGreaterThan(0);
    });

    it('should send Enter key correctly', async () => {
      await sshManager.sendCommand('echo "Test"');
      await sshManager.sendKeySequence('enter');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const outputs = outputBuffer.filter(o => o.type === 'stdout');
      const hasTestOutput = outputs.some(output => 
        output.data.includes('Test')
      );
      expect(hasTestOutput).toBe(true);
    });

    it('should handle unknown key sequences gracefully', async () => {
      await expect(sshManager.sendKeySequence('unknown+key'))
        .rejects.toThrow('Unknown key sequence');
    });
  });

  describe('Long-running Commands', () => {
    beforeEach(async () => {
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should handle streaming output from long-running commands', async () => {
      // Start Claude Code simulation script
      await sshManager.sendCommand('claude-code-sim.sh');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send a command to the simulation
      await sshManager.sendCommand('long');
      
      // Wait for the long operation to complete
      await new Promise(resolve => setTimeout(resolve, 12000));
      
      const outputs = outputBuffer.filter(o => o.type === 'stdout');
      const hasProgressOutput = outputs.some(output => 
        output.data.includes('Processing step')
      );
      expect(hasProgressOutput).toBe(true);
      
      // Exit the simulation
      await sshManager.sendCommand('exit');
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should maintain responsiveness during long operations', async () => {
      // Start long operation
      await sshManager.sendCommand('claude-code-sim.sh');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await sshManager.sendCommand('long');
      
      // Send interrupt during operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await sshManager.sendKeySequence('ctrl+c');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should be able to send new commands
      await sshManager.sendCommand('help');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const outputs = outputBuffer.filter(o => o.type === 'stdout');
      const hasHelpOutput = outputs.some(output => 
        output.data.includes('Available test commands')
      );
      expect(hasHelpOutput).toBe(true);
      
      await sshManager.sendCommand('exit');
      await new Promise(resolve => setTimeout(resolve, 500));
    });
  });

  describe('Terminal History and State', () => {
    beforeEach(async () => {
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should maintain command history across session', async () => {
      // Execute multiple commands
      await sshManager.sendCommand('echo "Command 1"');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await sshManager.sendCommand('echo "Command 2"');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await sshManager.sendCommand('echo "Command 3"');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // All commands should be reflected in output
      const allOutput = outputBuffer
        .filter(o => o.type === 'stdout')
        .map(o => o.data)
        .join('');
      
      expect(allOutput).toContain('Command 1');
      expect(allOutput).toContain('Command 2');
      expect(allOutput).toContain('Command 3');
    });

    it('should preserve terminal state after detach/reattach', async () => {
      // Set environment variable
      await sshManager.sendCommand('export TEST_VAR="persistent_value"');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Detach and create new connection
      await sshManager.disconnect();
      
      const newManager = new SSHConnectionManager();
      await newManager.connect(testEnv.getSSHConfig());
      
      const newOutputBuffer: TerminalOutput[] = [];
      newManager.addOutputListener((output) => {
        newOutputBuffer.push(output);
      });
      
      await newManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if variable is still set
      await newManager.sendCommand('echo $TEST_VAR');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const output = newOutputBuffer
        .filter(o => o.type === 'stdout')
        .map(o => o.data)
        .join('');
      
      expect(output).toContain('persistent_value');
      
      await newManager.disconnect();
    });
  });

  describe('Output Listeners and Event Handling', () => {
    it('should notify output listeners in real-time', async () => {
      const receivedOutputs: TerminalOutput[] = [];
      const testListener = (output: TerminalOutput) => {
        receivedOutputs.push(output);
      };
      
      sshManager.addOutputListener(testListener);
      
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await sshManager.sendCommand('echo "Real-time test"');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(receivedOutputs.length).toBeGreaterThan(0);
      
      const hasOutput = receivedOutputs.some(output => 
        output.data.includes('Real-time test')
      );
      expect(hasOutput).toBe(true);
      
      sshManager.removeOutputListener(testListener);
    });

    it('should handle multiple output listeners', async () => {
      const listener1Outputs: TerminalOutput[] = [];
      const listener2Outputs: TerminalOutput[] = [];
      
      const listener1 = (output: TerminalOutput) => listener1Outputs.push(output);
      const listener2 = (output: TerminalOutput) => listener2Outputs.push(output);
      
      sshManager.addOutputListener(listener1);
      sshManager.addOutputListener(listener2);
      
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await sshManager.sendCommand('echo "Multiple listeners"');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(listener1Outputs.length).toBeGreaterThan(0);
      expect(listener2Outputs.length).toBeGreaterThan(0);
      expect(listener1Outputs.length).toBe(listener2Outputs.length);
      
      sshManager.removeOutputListener(listener1);
      sshManager.removeOutputListener(listener2);
    });

    it('should include accurate timestamps in output', async () => {
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const beforeCommand = Date.now();
      await sshManager.sendCommand('echo "Timestamp test"');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const afterCommand = Date.now();
      
      const relevantOutputs = outputBuffer.filter(output => 
        output.data.includes('Timestamp test')
      );
      
      expect(relevantOutputs.length).toBeGreaterThan(0);
      
      relevantOutputs.forEach(output => {
        expect(output.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCommand);
        expect(output.timestamp.getTime()).toBeLessThanOrEqual(afterCommand);
      });
    });
  });

  describe('Performance and Latency', () => {
    beforeEach(async () => {
      await sshManager.attachToSession(testSessionName);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    it('should have acceptable command response latency', async () => {
      const startTime = Date.now();
      
      await sshManager.sendCommand('echo "Latency test"');
      
      // Wait for response
      const waitForOutput = () => {
        return new Promise<void>((resolve) => {
          const checkOutput = () => {
            const hasOutput = outputBuffer.some(output => 
              output.data.includes('Latency test')
            );
            if (hasOutput) {
              resolve();
            } else {
              setTimeout(checkOutput, 10);
            }
          };
          checkOutput();
        });
      };
      
      await waitForOutput();
      const responseTime = Date.now() - startTime;
      
      // Response should be within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle rapid command sequences', async () => {
      const commands = [
        'echo "Rapid 1"',
        'echo "Rapid 2"', 
        'echo "Rapid 3"',
        'echo "Rapid 4"',
        'echo "Rapid 5"'
      ];
      
      // Send commands rapidly
      for (const command of commands) {
        await sshManager.sendCommand(command);
        await new Promise(resolve => setTimeout(resolve, 50)); // Minimal delay
      }
      
      // Wait for all outputs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const allOutput = outputBuffer
        .filter(o => o.type === 'stdout')
        .map(o => o.data)
        .join('');
      
      // All commands should be executed
      commands.forEach((command, index) => {
        expect(allOutput).toContain(`Rapid ${index + 1}`);
      });
    });
  });
});