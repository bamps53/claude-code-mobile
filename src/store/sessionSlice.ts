import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Session {
  id: string;
  name: string;
  created: string;
  isActive: boolean;
  lastActivity?: string;
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  terminalOutput: string[];
}

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  terminalOutput: [],
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.push(action.payload);
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(session => session.id !== action.payload);
      if (state.currentSession?.id === action.payload) {
        state.currentSession = null;
      }
    },
    setCurrentSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload;
      if (action.payload) {
        state.terminalOutput = [];
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    addTerminalOutput: (state, action: PayloadAction<string>) => {
      state.terminalOutput.push(action.payload);
    },
    clearTerminalOutput: (state) => {
      state.terminalOutput = [];
    },
  },
});

export const {
  setSessions,
  addSession,
  removeSession,
  setCurrentSession,
  setLoading,
  setError,
  clearError,
  addTerminalOutput,
  clearTerminalOutput,
} = sessionSlice.actions;

export default sessionSlice.reducer;