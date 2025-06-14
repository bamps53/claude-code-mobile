import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  privateKey?: string;
  password?: string;
}

interface AuthState {
  isConnected: boolean;
  connectionConfig: ConnectionConfig | null;
  isConnecting: boolean;
  error: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected: string | null;
}

const initialState: AuthState = {
  isConnected: false,
  connectionConfig: null,
  isConnecting: false,
  error: null,
  connectionStatus: 'idle',
  lastConnected: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setConnectionConfig: (state, action: PayloadAction<ConnectionConfig>) => {
      state.connectionConfig = action.payload;
    },
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload;
      state.connectionStatus = action.payload ? 'connecting' : 'idle';
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      state.connectionStatus = action.payload ? 'connected' : 'disconnected';
      if (action.payload) {
        state.error = null;
        state.lastConnected = new Date().toISOString();
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnecting = false;
      state.connectionStatus = 'error';
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.isConnected = false;
      state.connectionConfig = null;
      state.error = null;
      state.connectionStatus = 'disconnected';
      state.isConnecting = false;
    },
    disconnect: (state) => {
      state.isConnected = false;
      state.connectionConfig = null;
      state.error = null;
      state.connectionStatus = 'disconnected';
      state.isConnecting = false;
    },
  },
});

export const {
  setConnectionConfig,
  setConnecting,
  setConnected,
  setError,
  clearError,
  logout,
  disconnect,
} = authSlice.actions;

export default authSlice.reducer;