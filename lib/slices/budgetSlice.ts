import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../types/budget'

export interface BudgetState {
  budgets: Budget[]
  loading: boolean
  error: string | null
}

const initialState: BudgetState = {
  budgets: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async () => {
    const response = await fetch('/api/budgets')
    if (!response.ok) {
      throw new Error('Failed to fetch budgets')
    }
    return response.json()
  }
)

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budgetData: CreateBudgetRequest) => {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budgetData),
    })
    if (!response.ok) {
      throw new Error('Failed to create budget')
    }
    return response.json()
  }
)

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async ({ id, budget }: { id: string; budget: UpdateBudgetRequest }) => {
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(budget),
    })
    if (!response.ok) {
      throw new Error('Failed to update budget')
    }
    return response.json()
  }
)

export const deleteBudget = createAsyncThunk(
  'budgets/deleteBudget',
  async (id: string) => {
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete budget')
    }
    return id
  }
)

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    updateBudgetSpending: (state, action) => {
      const { budgetId, spent } = action.payload
      const budget = state.budgets.find(b => b.id === budgetId)
      if (budget) {
        budget.spent = spent
        budget.remaining = budget.amount - spent
        budget.percentage = (spent / budget.amount) * 100
        budget.isOverBudget = spent > budget.amount
        budget.alertTriggered = budget.percentage >= 80
      }
    },
  },
  extraReducers: builder => {
    builder
      // Fetch budgets
      .addCase(fetchBudgets.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false
        state.budgets = action.payload
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch budgets'
      })
      // Create budget
      .addCase(createBudget.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.loading = false
        state.budgets.push(action.payload)
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create budget'
      })
      // Update budget
      .addCase(updateBudget.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.loading = false
        const index = state.budgets.findIndex(b => b.id === action.payload.id)
        if (index !== -1) {
          state.budgets[index] = action.payload
        }
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update budget'
      })
      // Delete budget
      .addCase(deleteBudget.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.loading = false
        state.budgets = state.budgets.filter(b => b.id !== action.payload)
      })
      .addCase(deleteBudget.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete budget'
      })
  },
})

export const { updateBudgetSpending } = budgetSlice.actions

// Selectors
export const selectBudgets = (state: { budgets: BudgetState }): Budget[] =>
  state.budgets.budgets
export const selectBudgetsLoading = (state: {
  budgets: BudgetState
}): boolean => state.budgets.loading
export const selectBudgetsError = (state: {
  budgets: BudgetState
}): string | null => state.budgets.error

export const selectBudgetById = (
  state: { budgets: BudgetState },
  id: string
): Budget | undefined => state.budgets.budgets.find(budget => budget.id === id)

export const selectOverBudgets = (state: { budgets: BudgetState }): Budget[] =>
  state.budgets.budgets.filter(budget => budget.isOverBudget)

export const selectActiveBudgets = (state: {
  budgets: BudgetState
}): Budget[] => {
  // For now, consider all non-overbudget budgets as active
  // You can modify this logic based on your business requirements
  return state.budgets.budgets.filter(budget => !budget.isOverBudget)
}

export default budgetSlice.reducer
