// Transaction-related type definitions for type safety

export type TransactionType = 'expense' | 'income'

export type TransactionStatus = 'pending' | 'completed' | 'cancelled'

export interface Transaction {
  id: string
  amount: number // Amount in VND (Vietnamese Dong)
  date: Date
  description: string
  categoryId: string
  walletId: string
  type: TransactionType
  status: TransactionStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateTransactionRequest {
  amount: number
  date: Date
  description: string
  categoryId: string
  walletId: string
  type: TransactionType
}

export interface UpdateTransactionRequest {
  id: string
  amount?: number
  date?: Date
  description?: string
  categoryId?: string
  walletId?: string
  type?: TransactionType
  status?: TransactionStatus
}

export interface TransactionFilters {
  type?: TransactionType
  categoryId?: string
  walletId?: string
  startDate?: string // ISO string for Redux serialization
  endDate?: string // ISO string for Redux serialization
  status?: TransactionStatus
}

export interface TransactionSortOptions {
  field: 'date' | 'amount' | 'description' | 'createdAt'
  direction: 'asc' | 'desc'
}

// Utility types for form validation
export type TransactionFormData = Omit<CreateTransactionRequest, 'date'> & {
  date: string // ISO date string for form inputs
}

// Type guards for runtime type checking
export const isTransactionType = (value: unknown): value is TransactionType => {
  return typeof value === 'string' && ['expense', 'income'].includes(value)
}

export const isTransactionStatus = (
  value: unknown
): value is TransactionStatus => {
  return (
    typeof value === 'string' &&
    ['pending', 'completed', 'cancelled'].includes(value)
  )
}

export const isValidAmount = (amount: unknown): amount is number => {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount)
}
