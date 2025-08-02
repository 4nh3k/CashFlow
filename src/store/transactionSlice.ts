import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest, 
  TransactionFilters,
  TransactionSortOptions 
} from '../types';
import { realmApiService } from '../services/realmApi';

// State interface
interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  sortOptions: TransactionSortOptions;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  filters: {},
  sortOptions: {
    field: 'date',
    direction: 'desc'
  }
};

// Async thunks for CRUD operations
export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transaction: CreateTransactionRequest): Promise<Transaction> => {
    try {
      const result = await realmApiService.createTransaction(transaction);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to add transaction');
      }
      return result.data;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async (updateData: UpdateTransactionRequest): Promise<Transaction> => {
    try {
      const result = await realmApiService.updateTransaction(updateData.id, updateData);
      if (!result.success || !result.data) {
        throw new Error(result.error || `Transaction with id ${updateData.id} not found`);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId: string): Promise<string> => {
    try {
      const result = await realmApiService.deleteTransaction(transactionId);
      if (!result.success) {
        throw new Error(result.error || `Failed to delete transaction with id ${transactionId}`);
      }
      return transactionId;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (): Promise<Transaction[]> => {
    try {
      const result = await realmApiService.getTransactions();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
      
      return result.data;
    } catch (error) {
      console.error('[fetchTransactions] Exception:', error);
      throw error;
    }
  }
);

// Transaction slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSortOptions: (state, action: PayloadAction<TransactionSortOptions>) => {
      state.sortOptions = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Add transaction
    builder
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add transaction';
      });

    // Update transaction
    builder
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update transaction';
      });

    // Delete transaction
    builder
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete transaction';
      });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      });
  }
});

export const { setFilters, setSortOptions, clearFilters, clearError } = transactionSlice.actions;

// Selectors
export const selectAllTransactions = (state: { transactions: TransactionState }) => 
  state.transactions.transactions;

export const selectTransactionById = (state: { transactions: TransactionState }, id: string) =>
  state.transactions.transactions.find(transaction => transaction.id === id);

export const selectFilteredTransactions = createSelector(
  [
    (state: { transactions: TransactionState }) => state.transactions.transactions,
    (state: { transactions: TransactionState }) => state.transactions.filters,
    (state: { transactions: TransactionState }) => state.transactions.sortOptions
  ],
  (transactions, filters, sortOptions) => {
    console.log('[selectFilteredTransactions] Starting selector calculation...', {
      transactionsCount: transactions.length,
      filters,
      sortOptions
    });
    
    let filtered = [...transactions];
    console.log('[selectFilteredTransactions] Initial transactions:', filtered.length);
    
    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
      console.log('[selectFilteredTransactions] After type filter:', filtered.length);
    }
    if (filters.categoryId) {
      filtered = filtered.filter(t => t.categoryId === filters.categoryId);
      console.log('[selectFilteredTransactions] After category filter:', filtered.length);
    }
    if (filters.walletId) {
      filtered = filtered.filter(t => t.walletId === filters.walletId);
      console.log('[selectFilteredTransactions] After wallet filter:', filtered.length);
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
      console.log('[selectFilteredTransactions] After status filter:', filtered.length);
    }
    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.startDate!));
      console.log('[selectFilteredTransactions] After start date filter:', filtered.length);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.endDate!));
      console.log('[selectFilteredTransactions] After end date filter:', filtered.length);
    }
    
    console.log('[selectFilteredTransactions] Starting sort operation...');
    
    // Add performance timing
    const startTime = performance.now();
    
    // Check if we have any transactions to sort
    if (filtered.length === 0) {
      console.log('[selectFilteredTransactions] No transactions to sort, returning empty array');
      return filtered;
    }
    
    // Apply sorting with proper date handling and error protection
    try {
      filtered.sort((a, b) => {
        let aValue: any = a[sortOptions.field];
        let bValue: any = b[sortOptions.field];
        
        // Safety check for undefined/null values
        if (aValue == null || bValue == null) {
          console.warn('[selectFilteredTransactions] Null/undefined values in sort field:', sortOptions.field, { aValue, bValue });
          return 0;
        }
        
        // Handle date sorting
        if (sortOptions.field === 'date') {
          const aTime = new Date(aValue).getTime();
          const bTime = new Date(bValue).getTime();
          
          // Check for invalid dates
          if (isNaN(aTime) || isNaN(bTime)) {
            console.warn('[selectFilteredTransactions] Invalid dates found:', { aValue, bValue, aTime, bTime });
            return 0;
          }
          
          aValue = aTime;
          bValue = bTime;
        }
        
        // Handle amount sorting
        if (sortOptions.field === 'amount') {
          aValue = Number(aValue);
          bValue = Number(bValue);
          
          // Check for NaN
          if (isNaN(aValue) || isNaN(bValue)) {
            console.warn('[selectFilteredTransactions] Invalid numbers found:', { aValue, bValue });
            return 0;
          }
        }
        
        if (sortOptions.direction === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    } catch (sortError) {
      console.error('[selectFilteredTransactions] Sort error:', sortError);
      // Return unsorted if sorting fails
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[selectFilteredTransactions] Selector calculation completed in ${duration}ms. Returning:`, filtered.length, 'transactions');
    
    // Warn if it's taking too long
    if (duration > 100) {
      console.warn('[selectFilteredTransactions] Selector is taking longer than expected:', duration, 'ms');
    }
    
    return filtered;
  }
);

export const selectTransactionLoading = (state: { transactions: TransactionState }) =>
  state.transactions.loading;

export const selectTransactionError = (state: { transactions: TransactionState }) =>
  state.transactions.error;

export const selectTransactionFilters = (state: { transactions: TransactionState }) =>
  state.transactions.filters;

export const selectTransactionSortOptions = (state: { transactions: TransactionState }) =>
  state.transactions.sortOptions;

// Additional selectors for transaction analysis
export const selectTransactionsByType = (state: { transactions: TransactionState }, type: 'expense' | 'income') => {
  const { transactions } = state.transactions;
  return transactions.filter(t => t.type === type);
};

export const selectTotalByType = (state: { transactions: TransactionState }, type: 'expense' | 'income') => {
  const transactions = selectTransactionsByType(state, type);
  return transactions.reduce((total, t) => total + t.amount, 0);
};

export const selectTransactionsByDateRange = (state: { transactions: TransactionState }, startDate: Date, endDate: Date) => {
  const { transactions } = state.transactions;
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

export const selectTransactionsByCategory = (state: { transactions: TransactionState }, categoryId: string) => {
  const { transactions } = state.transactions;
  return transactions.filter(t => t.categoryId === categoryId);
};

export const selectTransactionsByWallet = (state: { transactions: TransactionState }, walletId: string) => {
  const { transactions } = state.transactions;
  return transactions.filter(t => t.walletId === walletId);
};

export default transactionSlice.reducer; 