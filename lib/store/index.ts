import { configureStore } from '@reduxjs/toolkit'
import categoryReducer from '../slices/categorySlice'
import walletReducer from '../slices/walletSlice'
import budgetReducer from '../slices/budgetSlice'
import transactionReducer from '../slices/transactionSlice'

export const store = configureStore({
  reducer: {
    categories: categoryReducer,
    wallets: walletReducer,
    budgets: budgetReducer,
    transactions: transactionReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
