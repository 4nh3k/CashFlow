// Budget-related types
export interface Budget {
  id: string // Changed from _id to id for consistency with other types
  categoryId: string | null // null for overall budget
  amount: number // In VND
  period: 'monthly' | 'weekly' | 'custom'
  startDate: string // ISO 8601
  endDate?: string // ISO 8601, optional for custom periods
  spent: number // Calculated field
  remaining: number // Calculated field
  percentage: number // Spent percentage (0-100)
  isOverBudget: boolean // Calculated field
  alertTriggered: boolean // For 80% threshold
  createdAt: Date
  updatedAt: Date
}

export interface CreateBudgetRequest {
  categoryId: string | null
  amount: number
  period: 'monthly' | 'weekly' | 'custom'
  startDate: string
  endDate?: string
}

export interface UpdateBudgetRequest {
  categoryId?: string | null
  amount?: number
  period?: 'monthly' | 'weekly' | 'custom'
  startDate?: string
  endDate?: string
}

export interface BudgetSpending {
  budgetId: string
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
  shouldAlert: boolean // True when spending reaches 80%
}

export interface BudgetAlert {
  budgetId: string
  percentage: number
  triggered: boolean
}

export interface BudgetFilter {
  categoryId?: string
  period?: 'monthly' | 'weekly' | 'custom'
  isOverBudget?: boolean
  alertTriggered?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// Form-specific types
export interface BudgetFormData {
  categoryId?: string // Empty string for overall budget
  amount: string
  period: string
  startDate: string
  endDate?: string
}
