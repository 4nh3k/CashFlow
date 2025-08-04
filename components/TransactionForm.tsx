'use client'

import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Transaction } from '../types/transaction'
import type { Category } from '../types/category'
import type { Wallet } from '../types/wallet'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import {
  addTransaction,
  updateTransaction,
  fetchTransactions,
} from '../lib/slices/transactionSlice'

// Form validation schema
const transactionFormDataSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  type: z
    .enum(['expense', 'income'])
    .refine(val => val === 'expense' || val === 'income', {
      message: 'Type is required',
    }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description too long'),
  categoryId: z.string().min(1, 'Category is required'),
  walletId: z.string().min(1, 'Wallet is required'),
  date: z.string().min(1, 'Date is required'),
})

// Form data types - use string for form inputs then convert to proper types
type TransactionFormData = z.infer<typeof transactionFormDataSchema>

interface TransactionFormProps {
  transaction?: Transaction | undefined
  onSubmit: () => void
  onCancel: () => void
  mode: 'create' | 'edit'
  categories: Category[]
  wallets: Wallet[]
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
  mode,
  categories,
  wallets,
}) => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector(state => state.transactions)

  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])

  const isEditMode = mode === 'edit'

  const defaultWallet = wallets.find(wallet => wallet.isDefault)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormDataSchema),
    defaultValues: (transaction
      ? {
          amount: transaction.amount.toString(),
          type: transaction.type,
          description: transaction.description,
          categoryId: transaction.categoryId,
          walletId: transaction.walletId,
          date: new Date(transaction.date).toISOString().split('T')[0],
        }
      : {
          amount: '',
          type: 'expense' as const,
          description: '',
          categoryId: '',
          walletId: defaultWallet?.id || '',
          date: new Date().toISOString().split('T')[0],
        }) as any,
  })

  const watchedType = watch('type')

  // Filter categories based on transaction type
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter(
        (category: Category) => category.defaultType === watchedType
      )
      setFilteredCategories(filtered)
    }
  }, [categories, watchedType])

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      const formData = {
        amount: Number(data.amount),
        type: data.type,
        description: data.description,
        categoryId: data.categoryId,
        walletId: data.walletId,
        date: new Date(data.date),
      }

      if (isEditMode && transaction) {
        await dispatch(
          updateTransaction({
            id: transaction.id,
            ...formData,
          })
        ).unwrap()
      } else {
        await dispatch(addTransaction(formData)).unwrap()
      }

      // Refresh transactions list
      await dispatch(fetchTransactions()).unwrap()
      onSubmit()
    } catch (error) {
      console.error('Error submitting transaction:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            )}
          />
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (VND)
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount in VND"
              />
            )}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Description with AI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="flex space-x-2">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Mua cà phê 35000 đồng tại Highlands"
                />
              )}
            />
            <button
              type="button"
              onClick={async () => {
                const description = watch('description')
                if (!description.trim()) {
                  alert('Vui lòng nhập mô tả trước')
                  return
                }

                try {
                  const response = await fetch('/api/ai/parse-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: description }),
                  })

                  if (response.ok) {
                    const data = await response.json()
                    const parsed = data.parsed

                    // Update form fields with parsed data using setValue
                    if (parsed.amount) {
                      setValue('amount', parsed.amount.toString())
                    }
                    if (parsed.description) {
                      setValue('description', parsed.description)
                    }
                    if (parsed.type) {
                      setValue('type', parsed.type)
                    }

                    alert(
                      `AI phân tích: ${parsed.amount?.toLocaleString('vi-VN')} VNĐ - ${parsed.description}`
                    )
                  } else {
                    const errorData = await response.json()
                    alert(
                      `Lỗi: ${errorData.error || 'Không thể phân tích bằng AI'}`
                    )
                  }
                } catch (error) {
                  console.error('AI parsing error:', error)
                  alert('Lỗi kết nối AI')
                }
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              AI
            </button>
          </div>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Nhập mô tả bằng tiếng Việt và nhấn AI để tự động phân tích
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet *
          </label>
          <Controller
            name="walletId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatVND(wallet.balance)})
                    {wallet.isDefault ? ' - Default' : ''}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.walletId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.walletId.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Choose which wallet this transaction affects
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </div>
            ) : isEditMode ? (
              'Update Transaction'
            ) : (
              'Add Transaction'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default TransactionForm
