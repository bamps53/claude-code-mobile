/**
 * Tmux command management for remote session handling
 * Provides high-level interface for tmux operations over SSH
 */

import { sshClient, SSHConnectionError } from './ssh-client';

export interface TmuxSession {
  name: string;
  id: string;
  windows: number;
  attached: boolean;
  created: Date;
  lastActivity: Date;
}

export interface TmuxCommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export class TmuxCommandError extends Error {
  constructor(message: string, public command?: string) {
    super(message);
    this.name = 'TmuxCommandError';
  }
}

export class TmuxCommands {
  private sessionCache: Map<string, TmuxSession[]> = new Map();

  /**
   * Create new detached tmux session
   * @param connectionId SSH connection identifier
   * @param sessionName Name for the new session
   * @param startingDirectory Optional starting directory
   * @returns Promise resolving to command result
   * @throws {TmuxCommandError} When session creation fails
   */
  async createSession(
    connectionId: string,
    sessionName: string,
    startingDirectory?: string
  ): Promise<TmuxCommandResult> {
    try {
      // Validate session name
      this.validateSessionName(sessionName);

      // Build tmux command
      let command = `tmux new -s "${sessionName}" -d`;
      if (startingDirectory) {
        command += ` -c "${startingDirectory}"`;
      }

      const output = await sshClient.executeCommand(connectionId, command);
      
      // Clear cache to force refresh
      this.sessionCache.delete(connectionId);

      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      throw new TmuxCommandError(
        `Failed to create session '${sessionName}': ${error}`,
        'tmux new'
      );
    }
  }

  /**
   * List all tmux sessions
   * @param connectionId SSH connection identifier
   * @param useCache Whether to use cached results
   * @returns Promise resolving to array of sessions
   * @throws {TmuxCommandError} When listing sessions fails
   */
  async listSessions(connectionId: string, useCache: boolean = true): Promise<TmuxSession[]> {
    try {
      // Check cache first if enabled
      if (useCache && this.sessionCache.has(connectionId)) {
        return this.sessionCache.get(connectionId)!;
      }

      const output = await sshClient.executeCommand(connectionId, 'tmux ls');
      const sessions = this.parseSessionList(output);
      
      // Update cache
      this.sessionCache.set(connectionId, sessions);
      
      return sessions;
    } catch (error) {
      if (error instanceof SSHConnectionError) {
        throw error;
      }
      
      // tmux ls returns exit code 1 when no sessions exist
      if (error.toString().includes('no server running')) {
        return [];
      }
      
      throw new TmuxCommandError(`Failed to list sessions: ${error}`, 'tmux ls');
    }
  }

  /**
   * Attach to existing tmux session
   * @param connectionId SSH connection identifier
   * @param sessionName Session to attach to
   * @returns Promise resolving to command result
   * @throws {TmuxCommandError} When attach fails
   */
  async attachSession(connectionId: string, sessionName: string): Promise<TmuxCommandResult> {
    try {
      this.validateSessionName(sessionName);

      const command = `tmux attach -t "${sessionName}"`;
      const output = await sshClient.executeCommand(connectionId, command);

      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      throw new TmuxCommandError(
        `Failed to attach to session '${sessionName}': ${error}`,
        'tmux attach'
      );
    }
  }

  /**
   * Kill tmux session
   * @param connectionId SSH connection identifier
   * @param sessionName Session to kill
   * @returns Promise resolving to command result
   * @throws {TmuxCommandError} When kill fails
   */
  async killSession(connectionId: string, sessionName: string): Promise<TmuxCommandResult> {
    try {
      this.validateSessionName(sessionName);

      const command = `tmux kill-session -t "${sessionName}"`;
      const output = await sshClient.executeCommand(connectionId, command);
      
      // Clear cache to force refresh
      this.sessionCache.delete(connectionId);

      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      throw new TmuxCommandError(
        `Failed to kill session '${sessionName}': ${error}`,
        'tmux kill-session'
      );
    }
  }

  /**
   * Check if tmux session exists
   * @param connectionId SSH connection identifier
   * @param sessionName Session name to check
   * @returns Promise resolving to boolean
   */
  async sessionExists(connectionId: string, sessionName: string): Promise<boolean> {
    try {
      const sessions = await this.listSessions(connectionId);
      return sessions.some(session => session.name === sessionName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Send keys to tmux session
   * @param connectionId SSH connection identifier
   * @param sessionName Target session
   * @param keys Keys to send
   * @returns Promise resolving to command result
   * @throws {TmuxCommandError} When send-keys fails
   */
  async sendKeys(
    connectionId: string, 
    sessionName: string, 
    keys: string
  ): Promise<TmuxCommandResult> {
    try {
      this.validateSessionName(sessionName);

      const command = `tmux send-keys -t "${sessionName}" "${keys}" C-m`;
      const output = await sshClient.executeCommand(connectionId, command);

      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      throw new TmuxCommandError(
        `Failed to send keys to session '${sessionName}': ${error}`,
        'tmux send-keys'
      );
    }
  }

  /**
   * Get session information
   * @param connectionId SSH connection identifier
   * @param sessionName Session name
   * @returns Promise resolving to session details
   * @throws {TmuxCommandError} When session info retrieval fails
   */
  async getSessionInfo(connectionId: string, sessionName: string): Promise<TmuxSession | null> {
    try {
      const sessions = await this.listSessions(connectionId);
      return sessions.find(session => session.name === sessionName) || null;
    } catch (error) {
      throw new TmuxCommandError(
        `Failed to get session info for '${sessionName}': ${error}`,
        'tmux info'
      );
    }
  }

  /**
   * Clear session cache for connection
   * @param connectionId SSH connection identifier
   */
  clearCache(connectionId: string): void {
    this.sessionCache.delete(connectionId);
  }

  /**
   * Parse tmux session list output
   * @param output Raw tmux ls output
   * @returns Array of parsed sessions
   */
  private parseSessionList(output: string): TmuxSession[] {
    if (!output || output.trim() === '') {
      return [];
    }

    const lines = output.trim().split('\n');
    const sessions: TmuxSession[] = [];

    for (const line of lines) {
      try {
        // Parse tmux ls format: "session_name: 1 windows (created timestamp) [80x24] (attached)"
        const match = line.match(/^([^:]+):\s*(\d+)\s+windows?\s*\(created\s+([^)]+)\)\s*(?:\[[^\]]+\])?\s*(\(attached\))?/);
        
        if (match) {
          const [, name, windowCount, createdStr, attachedStr] = match;
          
          sessions.push({
            name: name.trim(),
            id: name.trim(),
            windows: parseInt(windowCount, 10),
            attached: !!attachedStr,
            created: new Date(createdStr),
            lastActivity: new Date()
          });
        }
      } catch (error) {
        console.warn('Failed to parse tmux session line:', line, error);
      }
    }

    return sessions;
  }

  /**
   * Validate session name format
   * @param sessionName Session name to validate
   * @throws {TmuxCommandError} When session name is invalid
   */
  private validateSessionName(sessionName: string): void {
    if (!sessionName || sessionName.trim() === '') {
      throw new TmuxCommandError('Session name is required', 'validation');
    }

    // Tmux session names cannot contain: . : $ 
    const invalidChars = /[.:$]/;
    if (invalidChars.test(sessionName)) {
      throw new TmuxCommandError(
        'Session name cannot contain . : or $ characters',
        'validation'
      );
    }

    // Length limit
    if (sessionName.length > 50) {
      throw new TmuxCommandError(
        'Session name must be 50 characters or less',
        'validation'
      );
    }
  }
}

export const tmuxCommands = new TmuxCommands();