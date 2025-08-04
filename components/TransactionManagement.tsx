'use client'

import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { fetchTransactions } from '../lib/slices/transactionSlice'
import { fetchCategories } from '../lib/slices/categorySlice'
import { fetchWallets } from '../lib/slices/walletSlice'
import TransactionList from './TransactionList'
import TransactionForm from './TransactionForm'
import Modal from './Modal'
import type { Transaction } from '../types/transaction'

export default function TransactionManagement() {
  const dispatch = useAppDispatch()
  const { transactions, loading, error } = useAppSelector(
    state => state.transactions
  )
  const { categories } = useAppSelector(state => state.categories)
  const { wallets } = useAppSelector(state => state.wallets)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchTransactions()).unwrap(),
          dispatch(fetchCategories()).unwrap(),
          dispatch(fetchWallets()).unwrap(),
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [dispatch])

  const handleAddTransaction = () => {
    setEditingTransaction(undefined)
    setIsFormOpen(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async () => {
    setIsFormOpen(false)
    setEditingTransaction(undefined)
    // Refresh data after form submission
    try {
      await Promise.all([
        dispatch(fetchTransactions()).unwrap(),
        dispatch(fetchWallets()).unwrap(), // Refresh wallets to update balances
      ])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingTransaction(undefined)
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={handleAddTransaction}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Transactions list */}
      <div className="bg-white rounded-lg shadow">
        <TransactionList onEditTransaction={handleEditTransaction} />
      </div>

      {/* Transaction form modal */}
      <Modal isOpen={isFormOpen} onClose={handleFormCancel}>
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          mode={editingTransaction ? 'edit' : 'create'}
          categories={categories}
          wallets={wallets}
        />
      </Modal>
    </div>
  )
}
