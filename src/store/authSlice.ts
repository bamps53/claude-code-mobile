import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConnectionConfig {
  hostname: string;
  port: number;
  username: string;
  privateKey?: string;
}

interface AuthState {
  isConnected: boolean;
  connectionConfig: ConnectionConfig | null;
  isConnecting: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isConnected: false,
  connectionConfig: null,
  isConnecting: false,
  error: null,
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
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnecting = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    disconnect: (state) => {
      state.isConnected = false;
      state.connectionConfig = null;
      state.error = null;
    },
  },
});

export const {
  setConnectionConfig,
  setConnecting,
  setConnected,
  setError,
  clearError,
  disconnect,
} = authSlice.actions;

export default authSlice.reducer;