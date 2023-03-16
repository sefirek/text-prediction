import { configureStore } from '@reduxjs/toolkit';
import marketSlice from '../reducers/marketSlice';

export const store = configureStore({
  reducer: {
    market: marketSlice,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
