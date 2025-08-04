'use client'

import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { fetchWallets } from '../lib/slices/walletSlice'
import WalletList from './WalletList'
import WalletForm from './WalletForm'
import Modal from './Modal'
import type { Wallet } from '../types/wallet'

export default function WalletManagement() {
  const dispatch = useAppDispatch()
  const { wallets, loading, error } = useAppSelector(state => state.wallets)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchWallets()).unwrap()
      } catch (error) {
        console.error('Error loading wallets:', error)
      }
    }

    loadData()
  }, [dispatch])

  const handleAddWallet = () => {
    setEditingWallet(undefined)
    setIsFormOpen(true)
  }

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async () => {
    setIsFormOpen(false)
    setEditingWallet(undefined)
    // Refresh wallets after form submission
    try {
      await dispatch(fetchWallets()).unwrap()
    } catch (error) {
      console.error('Error refreshing wallets:', error)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingWallet(undefined)
  }

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const defaultWallet = wallets.find(w => w.isDefault)

  if (loading && wallets.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Wallet Management
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your wallets and track your balances
            </p>
          </div>
          <button
            onClick={handleAddWallet}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Wallet
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  {wallets.length}
                </h3>
                <p className="text-blue-700 text-sm">Total Wallets</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-900">
                  {formatVND(totalBalance)}
                </h3>
                <p className="text-green-700 text-sm">Total Balance</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-purple-900">
                  {defaultWallet?.name || 'None'}
                </h3>
                <p className="text-purple-700 text-sm">Default Wallet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Wallets list */}
      <div className="bg-white rounded-lg shadow">
        <WalletList
          onEditWallet={handleEditWallet}
          onAddWallet={handleAddWallet}
        />
      </div>

      {/* Wallet form modal */}
      <Modal isOpen={isFormOpen} onClose={handleFormCancel}>
        <WalletForm
          wallet={editingWallet}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          mode={editingWallet ? 'edit' : 'create'}
        />
      </Modal>
    </div>
  )
}
