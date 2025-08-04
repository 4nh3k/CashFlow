'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import {
  fetchTransactions,
  selectFilteredTransactions,
  selectTransactionLoading,
  selectTransactionError,
  selectTransactionFilters,
  selectTransactionSortOptions,
  setFilters,
  setSortOptions,
  clearFilters,
  deleteTransaction,
} from '../lib/slices/transactionSlice'
import {
  selectCategories,
} from '../lib/slices/categorySlice'
import {
  selectWallets,
} from '../lib/slices/walletSlice'
import type {
  TransactionType,
  TransactionStatus,
  Transaction,
} from '../types/transaction'

// Props interface for optional callbacks
interface TransactionListProps {
  onEditTransaction?: (transaction: Transaction) => void
}

const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
}) => {
  const dispatch = useAppDispatch()
  const transactions = useAppSelector(selectFilteredTransactions)
  const loading = useAppSelector(selectTransactionLoading)
  const error = useAppSelector(selectTransactionError)
  const filters = useAppSelector(selectTransactionFilters)
  const sortOptions = useAppSelector(selectTransactionSortOptions)
  const categories = useAppSelector(selectCategories)
  const wallets = useAppSelector(selectWallets)

  const [localFilters, setLocalFilters] = useState({
    type: filters.type || '',
    startDate: filters.startDate
      ? new Date(filters.startDate).toISOString().split('T')[0]
      : '',
    endDate: filters.endDate
      ? new Date(filters.endDate).toISOString().split('T')[0]
      : '',
  })

  // Helper functions to get category and wallet names
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId)
    return wallet ? wallet.name : 'Unknown Wallet'
  }

  const handleFilterChange = (field: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    const newFilters: any = {}

    if (localFilters.type)
      newFilters.type = localFilters.type as TransactionType
    if (localFilters.startDate)
      newFilters.startDate = new Date(localFilters.startDate).toISOString()
    if (localFilters.endDate)
      newFilters.endDate = new Date(localFilters.endDate).toISOString()

    dispatch(setFilters(newFilters))
  }

  const handleSortChange = (field: string) => {
    const direction =
      sortOptions.field === field && sortOptions.direction === 'asc'
        ? 'desc'
        : 'asc'
    dispatch(setSortOptions({ field: field as any, direction }))
  }

  const clearAllFilters = () => {
    setLocalFilters({
      type: '',
      startDate: '',
      endDate: '',
    })
    dispatch(clearFilters())
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await dispatch(deleteTransaction(transactionId)).unwrap()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        alert('Failed to delete transaction. Please try again.')
      }
    }
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const getTransactionTypeColor = (type: TransactionType) => {
    return type === 'income'
      ? 'text-green-600 bg-green-50'
      : 'text-red-600 bg-red-50'
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Error loading transactions
        </div>
        <div className="text-gray-600">{error}</div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
          onClick={() => dispatch(fetchTransactions())}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={localFilters.type}
              onChange={e => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={localFilters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={localFilters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={applyFilters}
          >
            Apply Filters
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Transactions ({transactions.length})
          </h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('date')}
                  >
                    Date
                    {sortOptions.field === 'date' && (
                      <span className="ml-1">
                        {sortOptions.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('amount')}
                  >
                    Amount
                    {sortOptions.field === 'amount' && (
                      <span className="ml-1">
                        {sortOptions.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(transaction.date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatVND(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(transaction.categoryId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getWalletName(transaction.walletId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => onEditTransaction?.(transaction)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionList
