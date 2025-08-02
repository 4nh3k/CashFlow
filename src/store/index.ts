import { configureStore } from '@reduxjs/toolkit';
import transactionReducer from './transactionSlice';

export const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    // TODO: Add other slices as they are created
    // categories: categoryReducer,
    // wallets: walletReducer,
    // budgets: budgetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 