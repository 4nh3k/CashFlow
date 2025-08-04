import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types/category'

// State interface
export interface CategoryState {
  categories: Category[]
  loading: boolean
  error: string | null
}

// Initial state
const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
}

// API service functions using Next.js API routes
const categoryApiService = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch('/api/categories')
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    return response.json()
  },

  async createCategory(category: CreateCategoryRequest): Promise<Category> {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    if (!response.ok) {
      throw new Error('Failed to create category')
    }
    return response.json()
  },

  async updateCategory(
    id: string,
    category: Omit<UpdateCategoryRequest, 'id'>
  ): Promise<Category> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    if (!response.ok) {
      throw new Error('Failed to update category')
    }
    return response.json()
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete category')
    }
  },
}

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryApiService.getCategories()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch categories'
      )
    }
  }
)

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData: CreateCategoryRequest, { rejectWithValue }) => {
    try {
      return await categoryApiService.createCategory(categoryData)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create category'
      )
    }
  }
)

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (
    { id, updates }: { id: string; updates: Omit<UpdateCategoryRequest, 'id'> },
    { rejectWithValue }
  ) => {
    try {
      return await categoryApiService.updateCategory(id, updates)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update category'
      )
    }
  }
)

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await categoryApiService.deleteCategory(id)
      return id
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete category'
      )
    }
  }
)

// Category slice
const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoryError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create category
      .addCase(createCategory.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false
        state.categories.push(action.payload)
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update category
      .addCase(updateCategory.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false
        const index = state.categories.findIndex(
          (cat: Category) => cat.id === action.payload.id
        )
        if (index !== -1) {
          state.categories[index] = action.payload
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Delete category
      .addCase(deleteCategory.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false
        state.categories = state.categories.filter(
          (cat: Category) => cat.id !== action.payload
        )
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

// Actions
export const { clearCategoryError } = categorySlice.actions

// Selectors
export const selectCategories = (state: {
  categories: CategoryState
}): Category[] => state.categories.categories
export const selectCategoriesLoading = (state: {
  categories: CategoryState
}): boolean => state.categories.loading
export const selectCategoriesError = (state: {
  categories: CategoryState
}): string | null => state.categories.error

export const selectCategoryById = (
  state: { categories: CategoryState },
  id: string
): Category | undefined =>
  state.categories.categories.find(category => category.id === id)

export const selectCategoriesByType = (
  state: { categories: CategoryState },
  type: 'income' | 'expense'
): Category[] =>
  state.categories.categories.filter(category => category.defaultType === type)

export const selectExpenseCategories = (state: {
  categories: CategoryState
}): Category[] => selectCategoriesByType(state, 'expense')

export const selectIncomeCategories = (state: {
  categories: CategoryState
}): Category[] => selectCategoriesByType(state, 'income')

export default categorySlice.reducer
