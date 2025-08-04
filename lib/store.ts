import { configureStore } from '@reduxjs/toolkit'
import transactionReducer from './slices/transactionSlice'
import walletReducer from './slices/walletSlice'
import budgetReducer from './slices/budgetSlice'
import categoryReducer from './slices/categorySlice'
import keywordMappingReducer from './slices/keywordMappingSlice'

export const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    wallets: walletReducer,
    budgets: budgetReducer,
    categories: categoryReducer,
    keywordMappings: keywordMappingReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions - including createdAt/updatedAt in payloads
        ignoredActionPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.0.createdAt',
          'payload.0.updatedAt',
          // For array responses
          /^payload\.\d+\.createdAt$/,
          /^payload\.\d+\.updatedAt$/,
          // For nested objects
          /^payload\..*\.createdAt$/,
          /^payload\..*\.updatedAt$/,
        ],
        // Ignore these paths in the state - using regex patterns to match array indices
        ignoredPaths: [
          'items.dates',
          // Match any array index for createdAt/updatedAt fields
          /^wallets\.wallets\.\d+\.createdAt$/,
          /^wallets\.wallets\.\d+\.updatedAt$/,
          /^budgets\.budgets\.\d+\.createdAt$/,
          /^budgets\.budgets\.\d+\.updatedAt$/,
          /^transactions\.transactions\.\d+\.createdAt$/,
          /^transactions\.transactions\.\d+\.updatedAt$/,
          /^categories\.categories\.\d+\.createdAt$/,
          /^categories\.categories\.\d+\.updatedAt$/,
          /^keywordMappings\.mappings\.\d+\.createdAt$/,
          /^keywordMappings\.mappings\.\d+\.updatedAt$/,
        ],
      },
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
