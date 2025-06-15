/**
 * Tmux session management utilities
 * @description Provides tmux session operations through SSH connections
 */

import { TmuxSession } from '../types';
import { SSHClientWrapper } from './ssh';

/**
 * Parses tmux list-sessions output into TmuxSession objects
 * @description Converts raw tmux output to structured session data
 * @param output - Raw output from tmux list-sessions command
 * @param connectionId - ID of the SSH connection
 * @returns Array of parsed tmux sessions
 * @example
 * ```typescript
 * const output = 'session1: 2 windows (created Mon Jan 1 10:00:00 2024) [80x24] (attached)';
 * const sessions = parseTmuxSessionList(output, 'conn-1');
 * console.log(sessions[0].name); // 'session1'
 * ```
 */
export function parseTmuxSessionList(
  output: string,
  connectionId: string
): TmuxSession[] {
  if (
    !output ||
    output.includes('no server running') ||
    output.includes('no sessions')
  ) {
    return [];
  }

  const lines = output
    .trim()
    .split('\n')
    .filter(line => line.trim());
  const sessions: TmuxSession[] = [];

  for (const line of lines) {
    try {
      // Parse tmux session line format:
      // "session-name: N windows (created Date) [WxH] (attached?)"
      const match = line.match(
        /^([^:]+):\s*(\d+)\s+windows?\s*\(created\s+([^)]+)\)\s*\[[\dx]+\](.*)$/
      );

      if (match) {
        const [, name, windowCountStr, createdStr, statusStr] = match;
        const windowCount = parseInt(windowCountStr, 10);
        const isActive = statusStr.includes('(attached)');

        // Parse creation date - tmux uses various formats
        const created = parseCreatedDate(createdStr.trim());

        const session: TmuxSession = {
          id: `${connectionId}-${name}`,
          name: name.trim(),
          created,
          lastActivity: new Date(), // Will be updated with more precise info if available
          windowCount,
          isActive,
          connectionId,
        };

        sessions.push(session);
      }
    } catch (error) {
      console.warn('Failed to parse tmux session line:', line, error);
    }
  }

  return sessions;
}

/**
 * Parses tmux date format to JavaScript Date
 * @description Handles various tmux date formats
 * @param dateStr - Date string from tmux output
 * @returns Parsed Date object
 */
function parseCreatedDate(dateStr: string): Date {
  try {
    // Try parsing common tmux date formats
    // "Mon Jan  1 10:00:00 2024"
    // "2024-01-01T10:00:00"

    // If it looks like ISO format, parse directly
    if (dateStr.includes('T') || dateStr.includes('-')) {
      return new Date(dateStr);
    }

    // Handle "Mon Jan  1 10:00:00 2024" format
    return new Date(dateStr);
  } catch {
    // Fallback to current time if parsing fails
    return new Date();
  }
}

/**
 * Escapes special characters in commands for tmux send-keys
 * @description Properly escapes quotes and special characters
 * @param command - Command string to escape
 * @returns Escaped command string
 */
function escapeCommand(command: string): string {
  return command.replace(/"/g, '\\"');
}

/**
 * Lists all tmux sessions on the remote server
 * @description Executes tmux list-sessions and parses the output
 * @param sshClient - Connected SSH client
 * @param connectionId - SSH connection identifier
 * @returns Promise resolving to array of tmux sessions
 * @throws Error if command execution fails
 * @example
 * ```typescript
 * const sessions = await listTmuxSessions(sshClient, 'conn-1');
 * console.log(`Found ${sessions.length} sessions`);
 * ```
 */
export async function listTmuxSessions(
  sshClient: SSHClientWrapper,
  connectionId: string
): Promise<TmuxSession[]> {
  try {
    // Use 2>/dev/null to suppress errors when no sessions exist
    const output = await sshClient.executeCommand(
      'tmux list-sessions 2>/dev/null || echo "no sessions"'
    );
    return parseTmuxSessionList(output, connectionId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to list tmux sessions: ${errorMessage}`);
  }
}

/**
 * Creates a new tmux session
 * @description Creates a detached tmux session with optional custom name
 * @param sshClient - Connected SSH client
 * @param sessionName - Optional custom session name
 * @returns Promise resolving to the created session name
 * @throws Error if session creation fails
 * @example
 * ```typescript
 * const sessionName = await createTmuxSession(sshClient, 'my-project');
 * console.log(`Created session: ${sessionName}`);
 * ```
 */
export async function createTmuxSession(
  sshClient: SSHClientWrapper,
  sessionName?: string
): Promise<string> {
  try {
    const name = sessionName || `session-${Date.now()}`;
    await sshClient.executeCommand(`tmux new-session -d -s "${name}"`);
    return name;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create tmux session: ${errorMessage}`);
  }
}

/**
 * Attaches to an existing tmux session
 * @description Attaches the current SSH connection to a tmux session
 * @param sshClient - Connected SSH client
 * @param sessionName - Name of the session to attach to
 * @returns Promise that resolves when attachment is successful
 * @throws Error if attachment fails
 * @example
 * ```typescript
 * await attachToTmuxSession(sshClient, 'my-session');
 * console.log('Attached to session');
 * ```
 */
export async function attachToTmuxSession(
  sshClient: SSHClientWrapper,
  sessionName: string
): Promise<void> {
  try {
    await sshClient.executeCommand(`tmux attach-session -t "${sessionName}"`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to attach to tmux session: ${errorMessage}`);
  }
}

/**
 * Kills a tmux session
 * @description Terminates the specified tmux session
 * @param sshClient - Connected SSH client
 * @param sessionName - Name of the session to kill
 * @returns Promise that resolves when session is killed
 * @throws Error if kill operation fails
 * @example
 * ```typescript
 * await killTmuxSession(sshClient, 'old-session');
 * console.log('Session terminated');
 * ```
 */
export async function killTmuxSession(
  sshClient: SSHClientWrapper,
  sessionName: string
): Promise<void> {
  try {
    await sshClient.executeCommand(`tmux kill-session -t "${sessionName}"`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to kill tmux session: ${errorMessage}`);
  }
}

/**
 * Sends keys to a tmux session
 * @description Sends command keystrokes to the specified tmux session
 * @param sshClient - Connected SSH client
 * @param sessionName - Target session name
 * @param command - Command to send
 * @returns Promise that resolves when keys are sent
 * @throws Error if send operation fails
 * @example
 * ```typescript
 * await sendKeysToSession(sshClient, 'my-session', 'ls -la');
 * console.log('Command sent to session');
 * ```
 */
export async function sendKeysToSession(
  sshClient: SSHClientWrapper,
  sessionName: string,
  command: string
): Promise<void> {
  try {
    const escapedCommand = escapeCommand(command);
    await sshClient.executeCommand(
      `tmux send-keys -t "${sessionName}" "${escapedCommand}" Enter`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send keys to tmux session: ${errorMessage}`);
  }
}

/**
 * Gets detailed information about a specific tmux session
 * @description Retrieves extended session information including pane details
 * @param sshClient - Connected SSH client
 * @param sessionName - Session name to query
 * @returns Promise resolving to session details
 * @throws Error if query fails
 */
export async function getTmuxSessionInfo(
  sshClient: SSHClientWrapper,
  sessionName: string
): Promise<{
  windows: number;
  panes: number;
  clients: number;
  lastActivity: Date;
}> {
  try {
    // Get session format: windows,panes,clients,activity
    const output = await sshClient.executeCommand(
      `tmux display-message -t "${sessionName}" -p "#{session_windows},#{session_many_attached},#{session_activity}"`
    );

    const [windows, clients, activity] = output.trim().split(',');

    // Get total panes across all windows
    const panesOutput = await sshClient.executeCommand(
      `tmux list-panes -t "${sessionName}" -a | wc -l`
    );

    return {
      windows: parseInt(windows, 10) || 1,
      panes: parseInt(panesOutput.trim(), 10) || 1,
      clients: parseInt(clients, 10) || 0,
      lastActivity: new Date(parseInt(activity, 10) * 1000),
    };
  } catch (error) {
    // Return default values if detailed info fails
    return {
      windows: 1,
      panes: 1,
      clients: 0,
      lastActivity: new Date(),
    };
  }
}

/**
 * High-level tmux session manager
 * @description Provides comprehensive tmux session management with state tracking
 */
export class TmuxManager {
  private sshClient: SSHClientWrapper;
  private connectionId: string;
  private sessions: Map<string, TmuxSession> = new Map();

  constructor(sshClient: SSHClientWrapper, connectionId: string) {
    this.sshClient = sshClient;
    this.connectionId = connectionId;
  }

  /**
   * Refreshes the list of tmux sessions
   * @description Updates internal session tracking with latest server state
   * @returns Promise resolving to current session list
   */
  async refreshSessions(): Promise<TmuxSession[]> {
    const sessions = await listTmuxSessions(this.sshClient, this.connectionId);

    // Update internal tracking
    this.sessions.clear();
    for (const session of sessions) {
      this.sessions.set(session.name, session);
    }

    return sessions;
  }

  /**
   * Creates a new tmux session with enhanced tracking
   * @description Creates session and updates internal state
   * @param sessionName - Optional session name
   * @returns Promise resolving to session name
   */
  async createSession(sessionName?: string): Promise<string> {
    const name = await createTmuxSession(this.sshClient, sessionName);

    // Add to internal tracking
    const newSession: TmuxSession = {
      id: `${this.connectionId}-${name}`,
      name,
      created: new Date(),
      lastActivity: new Date(),
      windowCount: 1,
      isActive: false,
      connectionId: this.connectionId,
    };

    this.sessions.set(name, newSession);
    return name;
  }

  /**
   * Kills a tmux session with state cleanup
   * @description Removes session and updates tracking
   * @param sessionName - Session to kill
   * @returns Promise that resolves when session is killed
   */
  async killSession(sessionName: string): Promise<void> {
    await killTmuxSession(this.sshClient, sessionName);
    this.sessions.delete(sessionName);
  }

  /**
   * Sends command to tmux session with activity tracking
   * @description Sends command and updates last activity
   * @param sessionName - Target session
   * @param command - Command to send
   * @returns Promise that resolves when command is sent
   */
  async sendCommand(sessionName: string, command: string): Promise<void> {
    await sendKeysToSession(this.sshClient, sessionName, command);

    // Update last activity
    const session = this.sessions.get(sessionName);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Checks if a session exists in current tracking
   * @description Quick session existence check
   * @param sessionName - Session name to check
   * @returns True if session exists
   */
  hasSession(sessionName: string): boolean {
    return this.sessions.has(sessionName);
  }

  /**
   * Gets a session from internal tracking
   * @description Retrieves session object by name
   * @param sessionName - Session name
   * @returns Session object or undefined
   */
  getSession(sessionName: string): TmuxSession | undefined {
    return this.sessions.get(sessionName);
  }

  /**
   * Gets all tracked sessions
   * @description Returns current session tracking state
   * @returns Array of all tracked sessions
   */
  getAllSessions(): TmuxSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Updates session metadata with detailed information
   * @description Fetches and updates extended session details
   * @param sessionName - Session to update
   * @returns Promise that resolves when update is complete
   */
  async updateSessionDetails(sessionName: string): Promise<void> {
    try {
      const details = await getTmuxSessionInfo(this.sshClient, sessionName);
      const session = this.sessions.get(sessionName);

      if (session) {
        session.windowCount = details.windows;
        session.lastActivity = details.lastActivity;
      }
    } catch (error) {
      console.warn(`Failed to update session details for ${sessionName}:`, error);
    }
  }
}
