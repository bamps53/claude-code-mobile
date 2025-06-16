/**
 * Core type definitions for the Claude Code Mobile application
 * @description Centralized type definitions for SSH connections, sessions, and app state
 */

export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  lastConnected?: Date | string; // string when serialized, Date when in memory
  isConnected: boolean;
  connectionError?: string;
}

export interface SSHConnectionResult {
  success: boolean;
  error?: string;
  client?: any; // Will be typed more specifically when implementing
}

export interface TmuxSession {
  id: string;
  name: string;
  created: Date | string; // string when serialized, Date when in memory
  lastActivity: Date | string; // string when serialized, Date when in memory
  windowCount: number;
  isActive: boolean;
  connectionId: string;
}

export interface AppState {
  connections: SSHConnection[];
  sessions: TmuxSession[];
  activeConnectionId?: string;
  activeSessionId?: string;
  isAuthenticated: boolean;
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  autoTimeout: number; // minutes
  enableBiometrics: boolean;
  notificationsEnabled: boolean;
}

export interface TerminalConfig {
  fontSize: number;
  theme: 'light' | 'dark';
  fontFamily: string;
  cursorBlink: boolean;
  cursorStyle: 'block' | 'underline' | 'bar';
}

export type NavigationScreens = {
  Welcome: undefined;
  Main: undefined;
  Connections: undefined;
  Sessions: { connectionId: string };
  Terminal: { sessionId: string; connectionId: string };
  Settings: undefined;
};
