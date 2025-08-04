// LLM and Keyword Mapping Types
export interface KeywordMapping {
  id: string
  keyword: string
  categoryId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateKeywordMapping {
  keyword: string
  categoryId: string
}

export interface UpdateKeywordMapping {
  keyword?: string
  categoryId?: string
}

export interface ChatInput {
  message: string
  timestamp?: Date
}

export interface TransactionExtraction {
  amount: number
  type: 'income' | 'expense'
  description: string
  suggestedCategory: string | undefined
  confidence: number
}

export interface LLMSettings {
  apiKey?: string
  autoSuggestCategories: boolean
  autoCreateTransactions: boolean
  confidenceThreshold: number
  defaultCurrency: string
}
