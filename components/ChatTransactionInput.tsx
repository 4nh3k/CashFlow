'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { addTransaction } from '../lib/slices/transactionSlice'
import type {
  CreateTransactionRequest,
  TransactionType,
} from '../types/transaction'

// Mock TransactionExtraction type since geminiApi might not be migrated yet
interface TransactionExtraction {
  amount: number
  type: TransactionType
  description: string
  suggestedCategory?: string
  confidence: number
}

interface ChatTransactionInputProps {
  onTransactionCreated?: (transaction: CreateTransactionRequest) => void
  onClose?: () => void
}

export const ChatTransactionInput: React.FC<ChatTransactionInputProps> = ({
  onTransactionCreated,
  onClose,
}) => {
  const dispatch = useAppDispatch()
  const { categories } = useAppSelector(state => state.categories)
  const { wallets } = useAppSelector(state => state.wallets)

  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extraction, setExtraction] = useState<TransactionExtraction | null>(
    null
  )
  const [overrides, setOverrides] = useState<{
    amount?: number
    type?: TransactionType
    description?: string
    categoryId?: string
    walletId?: string
  }>({})

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Mock gemini API call for now
  const mockParseTransactionInput = async (
    input: string
  ): Promise<TransactionExtraction> => {
    // Simple mock parsing logic
    const lowerInput = input.toLowerCase()

    // Try to extract amount
    const amountMatch = input.match(
      /(\d+(?:\.\d+)?)\s*(?:k|thousand|triệu|million)?/i
    )
    let amount = amountMatch ? parseFloat(amountMatch[1]) : 0

    // Adjust for Vietnamese units
    if (input.includes('k') || input.includes('thousand')) {
      amount *= 1000
    } else if (input.includes('triệu') || input.includes('million')) {
      amount *= 1000000
    }

    // Determine type
    const isIncome =
      lowerInput.includes('nhận') ||
      lowerInput.includes('lương') ||
      lowerInput.includes('income') ||
      lowerInput.includes('salary')
    const type: TransactionType = isIncome ? 'income' : 'expense'

    // Extract description
    const description =
      input.length > 50 ? input.substring(0, 50) + '...' : input

    // Mock category suggestion
    let suggestedCategory = ''
    if (lowerInput.includes('cà phê') || lowerInput.includes('coffee')) {
      suggestedCategory = 'Food & Drinks'
    } else if (lowerInput.includes('xăng') || lowerInput.includes('fuel')) {
      suggestedCategory = 'Transportation'
    } else if (lowerInput.includes('lương') || lowerInput.includes('salary')) {
      suggestedCategory = 'Salary'
    }

    return {
      amount,
      type,
      description,
      suggestedCategory,
      confidence: amount > 0 ? 0.8 : 0.4,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsProcessing(true)
    try {
      // Use mock for now, replace with actual gemini API later
      const result = await mockParseTransactionInput(input)
      setExtraction(result)
    } catch (error) {
      console.error('Failed to process transaction:', error)
      alert('Failed to process transaction. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTransaction = async () => {
    if (!extraction) return

    const defaultWallet = wallets.find(w => w.isDefault) || wallets[0]
    if (!defaultWallet) {
      alert('Please create a wallet first')
      return
    }

    const transactionData: CreateTransactionRequest = {
      amount: overrides.amount ?? extraction.amount,
      type: overrides.type ?? extraction.type,
      description: overrides.description ?? extraction.description,
      categoryId:
        overrides.categoryId ||
        (extraction.suggestedCategory
          ? categories.find(c => c.name === extraction.suggestedCategory)?.id ||
            ''
          : ''),
      walletId: overrides.walletId ?? defaultWallet.id,
      date: new Date(),
    }

    try {
      await dispatch(addTransaction(transactionData)).unwrap()
      onTransactionCreated?.(transactionData)

      // Reset form
      setInput('')
      setExtraction(null)
      setOverrides({})
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Smart Transaction Entry
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="transaction-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe your transaction
          </label>
          <textarea
            id="transaction-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="E.g., 'Mua cà phê 25k tại The Coffee House' hoặc 'Nhận lương 10 triệu'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            'Analyze Transaction'
          )}
        </button>
      </form>

      {extraction && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Transaction Details
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Amount:</span>
              <div className="flex items-center">
                <span className="ml-2 font-medium">
                  {formatVND(extraction.amount)}
                </span>
                <input
                  type="number"
                  value={overrides.amount ?? extraction.amount}
                  onChange={e =>
                    setOverrides(prev => ({
                      ...prev,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="ml-2 w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <div className="flex items-center">
                <span
                  className={`ml-2 font-medium ${
                    extraction.type === 'income'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {extraction.type === 'income' ? 'Income' : 'Expense'}
                </span>
                <select
                  value={overrides.type ?? extraction.type}
                  onChange={e =>
                    setOverrides(prev => ({
                      ...prev,
                      type: e.target.value as TransactionType,
                    }))
                  }
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-gray-600 mt-1">
                Description:
              </span>
              <div className="flex flex-col items-end flex-1 ml-2">
                <span className="mb-1 font-medium text-right">
                  {extraction.description}
                </span>
                <input
                  type="text"
                  value={overrides.description ?? extraction.description}
                  onChange={e =>
                    setOverrides(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Category:
              </span>
              <div className="flex items-center">
                <span className="ml-2 font-medium">
                  {extraction.suggestedCategory || 'None'}
                </span>
                <select
                  value={
                    overrides.categoryId ??
                    (extraction.suggestedCategory
                      ? categories.find(
                          c => c.name === extraction.suggestedCategory
                        )?.id || ''
                      : '')
                  }
                  onChange={e =>
                    setOverrides(prev => ({
                      ...prev,
                      categoryId: e.target.value || '',
                    }))
                  }
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wallet */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Wallet:</span>
              <select
                value={
                  overrides.walletId ??
                  (wallets.find(w => w.isDefault)?.id || wallets[0]?.id || '')
                }
                onChange={e =>
                  setOverrides(prev => ({ ...prev, walletId: e.target.value }))
                }
                className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatVND(wallet.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Confidence:
              </span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      extraction.confidence >= 0.8
                        ? 'bg-green-500'
                        : extraction.confidence >= 0.6
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${extraction.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">
                  {Math.round(extraction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleCreateTransaction}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Create Transaction
            </button>
            <button
              onClick={() => {
                setExtraction(null)
                setOverrides({})
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatTransactionInput
