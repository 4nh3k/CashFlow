import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionSortOptions,
} from '../../types/transaction'

// Helper function to update budget spending for affected budgets
const updateBudgetsAfterTransaction = async (
  dispatch: any,
  transaction: Transaction
) => {
  // Import the budget actions dynamically to avoid circular dependencies
  try {
    const { updateBudgetSpending } = await import('./budgetSlice')

    // Only update budgets for expense transactions
    if (transaction.type === 'expense') {
      // Update category-specific budget if exists
      if (transaction.categoryId) {
        dispatch(updateBudgetSpending(transaction.categoryId))
      }
    }
  } catch (error) {
    console.warn('Failed to update budget spending:', error)
  }
}

// State interface
interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  filters: TransactionFilters
  sortOptions: TransactionSortOptions
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  filters: {},
  sortOptions: {
    field: 'date',
    direction: 'desc',
  },
}

// API service functions using Next.js API routes
const apiService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch('/api/transactions')
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    return response.json()
  },

  async createTransaction(
    transaction: CreateTransactionRequest
  ): Promise<Transaction> {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })
    if (!response.ok) {
      throw new Error('Failed to create transaction')
    }
    return response.json()
  },

  async updateTransaction(
    id: string,
    transaction: UpdateTransactionRequest
  ): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })
    if (!response.ok) {
      throw new Error('Failed to update transaction')
    }
    return response.json()
  },

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete transaction')
    }
  },
}

// Async thunks for CRUD operations
export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (
    transaction: CreateTransactionRequest,
    { dispatch }
  ): Promise<Transaction> => {
    try {
      const result = await apiService.createTransaction(transaction)

      // Update budget spending for expense transactions
      await updateBudgetsAfterTransaction(dispatch, result)

      return result
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw error
    }
  }
)

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async (
    updateData: UpdateTransactionRequest,
    { dispatch }
  ): Promise<Transaction> => {
    try {
      const result = await apiService.updateTransaction(
        updateData.id,
        updateData
      )

      // Update budget spending for expense transactions
      await updateBudgetsAfterTransaction(dispatch, result)

      return result
    } catch (error) {
      console.error('Failed to update transaction:', error)
      throw error
    }
  }
)

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId: string, { dispatch, getState }): Promise<string> => {
    try {
      // Get the transaction data before deletion for budget updates
      const state = getState() as { transactions: TransactionState }
      const transaction = state.transactions.transactions.find(
        t => t.id === transactionId
      )

      await apiService.deleteTransaction(transactionId)

      // Update budget spending after deletion if it was an expense
      if (transaction) {
        await updateBudgetsAfterTransaction(dispatch, transaction)
      }

      return transactionId
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      throw error
    }
  }
)

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (): Promise<Transaction[]> => {
    try {
      return await apiService.getTransactions()
    } catch (error) {
      console.error('[fetchTransactions] Exception:', error)
      throw error
    }
  }
)

// Transaction slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSortOptions: (state, action: PayloadAction<TransactionSortOptions>) => {
      state.sortOptions = action.payload
    },
    clearFilters: state => {
      state.filters = {}
    },
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    // Add transaction
    builder
      .addCase(addTransaction.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.transactions.unshift(action.payload)
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add transaction'
      })

    // Update transaction
    builder
      .addCase(updateTransaction.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false
        const index = state.transactions.findIndex(
          (t: Transaction) => t.id === action.payload.id
        )
        if (index !== -1) {
          state.transactions[index] = action.payload
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update transaction'
      })

    // Delete transaction
    builder
      .addCase(deleteTransaction.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = state.transactions.filter(
          (t: Transaction) => t.id !== action.payload
        )
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete transaction'
      })

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch transactions'
      })
  },
})

export const { setFilters, setSortOptions, clearFilters, clearError } =
  transactionSlice.actions

// Selectors
export const selectAllTransactions = (state: {
  transactions: TransactionState
}) => state.transactions.transactions

export const selectTransactionById = (
  state: { transactions: TransactionState },
  id: string
) => state.transactions.transactions.find(transaction => transaction.id === id)

export const selectFilteredTransactions = createSelector(
  [
    (state: { transactions: TransactionState }) =>
      state.transactions.transactions,
    (state: { transactions: TransactionState }) => state.transactions.filters,
    (state: { transactions: TransactionState }) =>
      state.transactions.sortOptions,
  ],
  (transactions, filters, sortOptions) => {
    let filtered = [...transactions]

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type)
    }
    if (filters.categoryId) {
      filtered = filtered.filter(t => t.categoryId === filters.categoryId)
    }
    if (filters.walletId) {
      filtered = filtered.filter(t => t.walletId === filters.walletId)
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status)
    }
    if (filters.startDate) {
      filtered = filtered.filter(
        t => new Date(t.date) >= new Date(filters.startDate!)
      )
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        t => new Date(t.date) <= new Date(filters.endDate!)
      )
    }

    // Apply sorting with proper date handling and error protection
    try {
      filtered.sort((a, b) => {
        let aValue: any = a[sortOptions.field]
        let bValue: any = b[sortOptions.field]

        // Safety check for undefined/null values
        if (aValue == null || bValue == null) {
          return 0
        }

        // Handle date sorting
        if (sortOptions.field === 'date') {
          const aTime = new Date(aValue).getTime()
          const bTime = new Date(bValue).getTime()

          // Check for invalid dates
          if (isNaN(aTime) || isNaN(bTime)) {
            return 0
          }

          aValue = aTime
          bValue = bTime
        }

        // Handle amount sorting
        if (sortOptions.field === 'amount') {
          aValue = Number(aValue)
          bValue = Number(bValue)

          // Check for NaN
          if (isNaN(aValue) || isNaN(bValue)) {
            return 0
          }
        }

        if (sortOptions.direction === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
        }
      })
    } catch (sortError) {
      console.error('[selectFilteredTransactions] Sort error:', sortError)
    }

    return filtered
  }
)

export const selectTransactionLoading = (state: {
  transactions: TransactionState
}) => state.transactions.loading

export const selectTransactionError = (state: {
  transactions: TransactionState
}) => state.transactions.error

export const selectTransactionFilters = (state: {
  transactions: TransactionState
}) => state.transactions.filters

export const selectTransactionSortOptions = (state: {
  transactions: TransactionState
}) => state.transactions.sortOptions

// Additional selectors for transaction analysis
export const selectTransactionsByType = (
  state: { transactions: TransactionState },
  type: 'expense' | 'income'
) => {
  const { transactions } = state.transactions
  return transactions.filter(t => t.type === type)
}

export const selectTotalByType = (
  state: { transactions: TransactionState },
  type: 'expense' | 'income'
) => {
  const transactions = selectTransactionsByType(state, type)
  return transactions.reduce((total, t) => total + t.amount, 0)
}

export const selectTransactionsByDateRange = (
  state: { transactions: TransactionState },
  startDate: Date,
  endDate: Date
) => {
  const { transactions } = state.transactions
  return transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

export const selectTransactionsByCategory = (
  state: { transactions: TransactionState },
  categoryId: string
) => {
  const { transactions } = state.transactions
  return transactions.filter(t => t.categoryId === categoryId)
}

export const selectTransactionsByWallet = (
  state: { transactions: TransactionState },
  walletId: string
) => {
  const { transactions } = state.transactions
  return transactions.filter(t => t.walletId === walletId)
}

export default transactionSlice.reducer
