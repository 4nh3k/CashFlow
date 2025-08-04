import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type {
  Wallet,
  CreateWalletRequest,
  UpdateWalletRequest,
} from '../../types/wallet'

// State interface
export interface WalletState {
  wallets: Wallet[]
  loading: boolean
  error: string | null
}

// Initial state
const initialState: WalletState = {
  wallets: [],
  loading: false,
  error: null,
}

// API service functions using Next.js API routes
const walletApiService = {
  async getWallets(): Promise<Wallet[]> {
    const response = await fetch('/api/wallets')
    if (!response.ok) {
      throw new Error('Failed to fetch wallets')
    }
    return response.json()
  },

  async createWallet(wallet: CreateWalletRequest): Promise<Wallet> {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet),
    })
    if (!response.ok) {
      throw new Error('Failed to create wallet')
    }
    return response.json()
  },

  async updateWallet(id: string, wallet: UpdateWalletRequest): Promise<Wallet> {
    const response = await fetch(`/api/wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet),
    })
    if (!response.ok) {
      throw new Error('Failed to update wallet')
    }
    return response.json()
  },

  async deleteWallet(id: string): Promise<void> {
    const response = await fetch(`/api/wallets/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete wallet')
    }
  },
}

// Async thunks for wallet operations
export const fetchWallets = createAsyncThunk(
  'wallets/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      return await walletApiService.getWallets()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch wallets'
      )
    }
  }
)

export const createWallet = createAsyncThunk(
  'wallets/createWallet',
  async (walletData: CreateWalletRequest, { rejectWithValue }) => {
    try {
      return await walletApiService.createWallet(walletData)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create wallet'
      )
    }
  }
)

export const updateWallet = createAsyncThunk(
  'wallets/updateWallet',
  async (
    { id, updates }: { id: string; updates: UpdateWalletRequest },
    { rejectWithValue }
  ) => {
    try {
      return await walletApiService.updateWallet(id, updates)
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update wallet'
      )
    }
  }
)

export const deleteWallet = createAsyncThunk(
  'wallets/deleteWallet',
  async (id: string, { rejectWithValue }) => {
    try {
      await walletApiService.deleteWallet(id)
      return id
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete wallet'
      )
    }
  }
)

// Wallet slice
const walletSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    clearWalletError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // Fetch wallets
      .addCase(fetchWallets.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.loading = false
        state.wallets = action.payload
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create wallet
      .addCase(createWallet.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.loading = false
        state.wallets.push(action.payload)
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Update wallet
      .addCase(updateWallet.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateWallet.fulfilled, (state, action) => {
        state.loading = false
        const index = state.wallets.findIndex(
          (wallet: Wallet) => wallet.id === action.payload.id
        )
        if (index !== -1) {
          state.wallets[index] = action.payload
        }
      })
      .addCase(updateWallet.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Delete wallet
      .addCase(deleteWallet.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteWallet.fulfilled, (state, action) => {
        state.loading = false
        state.wallets = state.wallets.filter(
          (wallet: Wallet) => wallet.id !== action.payload
        )
      })
      .addCase(deleteWallet.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

// Actions
export const { clearWalletError } = walletSlice.actions

// Selectors
export const selectWallets = (state: { wallets: WalletState }): Wallet[] =>
  state.wallets.wallets
export const selectWalletsLoading = (state: {
  wallets: WalletState
}): boolean => state.wallets.loading
export const selectWalletsError = (state: {
  wallets: WalletState
}): string | null => state.wallets.error

export const selectWalletById = (
  state: { wallets: WalletState },
  id: string
): Wallet | undefined => state.wallets.wallets.find(wallet => wallet.id === id)

export const selectDefaultWallet = (state: {
  wallets: WalletState
}): Wallet | undefined => state.wallets.wallets.find(wallet => wallet.isDefault)

export const selectTotalBalance = (state: { wallets: WalletState }): number =>
  state.wallets.wallets.reduce((total, wallet) => total + wallet.balance, 0)

export default walletSlice.reducer
