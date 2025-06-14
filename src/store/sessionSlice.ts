import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'inactive';
  lastActivity?: string;
}

interface SessionState {
  sessions: Session[];
  currentSession: string | null;
  isLoading: boolean;
  error: string | null;
  terminalOutput: string[];
}

// Async thunk for fetching sessions
export const fetchSessions = createAsyncThunk(
  'session/fetchSessions',
  async () => {
    // TODO: Replace with actual SSH tmux list sessions call
    // For now, return mock data
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    
    const mockSessions: Session[] = [
      {
        id: '1',
        name: 'claude-main',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'active',
        lastActivity: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: '2', 
        name: 'development',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        status: 'inactive',
        lastActivity: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    
    return mockSessions;
  }
);

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
      if (state.currentSession === action.payload) {
        state.currentSession = null;
      }
    },
    setCurrentSession: (state, action: PayloadAction<string>) => {
      state.currentSession = action.payload;
      state.terminalOutput = [];
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      });
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