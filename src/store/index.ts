import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import sessionSlice from './sessionSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    session: sessionSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;