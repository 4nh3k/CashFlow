'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import {
  deleteWallet,
  fetchWallets,
  updateWallet,
} from '../lib/slices/walletSlice'
import type { Wallet } from '../types/wallet'

// Props interface
interface WalletListProps {
  onEditWallet?: (wallet: Wallet) => void
  onAddWallet?: () => void
}

const WalletList: React.FC<WalletListProps> = ({
  onEditWallet,
  onAddWallet,
}) => {
  const dispatch = useAppDispatch()
  const { wallets, loading, error } = useAppSelector(state => state.wallets)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Handle wallet deletion
  const handleDeleteWallet = async (wallet: Wallet) => {
    if (wallet.isDefault) {
      alert(
        'Cannot delete the default wallet. Please set another wallet as default first.'
      )
      return
    }

    if (
      !confirm(`Are you sure you want to delete the wallet "${wallet.name}"?`)
    ) {
      return
    }

    try {
      setDeletingId(wallet.id)
      await dispatch(deleteWallet(wallet.id)).unwrap()
      console.log(`Wallet "${wallet.name}" deleted successfully`)
    } catch (error) {
      console.error('Error deleting wallet:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle setting default wallet
  const handleSetDefaultWallet = async (walletId: string) => {
    try {
      // First, unset all other wallets as default
      const currentDefault = wallets.find(w => w.isDefault)
      if (currentDefault && currentDefault.id !== walletId) {
        await dispatch(
          updateWallet({
            id: currentDefault.id,
            updates: { isDefault: false },
          })
        ).unwrap()
      }

      // Set the selected wallet as default
      await dispatch(
        updateWallet({
          id: walletId,
          updates: { isDefault: true },
        })
      ).unwrap()

      console.log('Default wallet updated successfully')
    } catch (error) {
      console.error('Error setting default wallet:', error)
    }
  }

  // Handle retry
  const handleRetry = () => {
    dispatch(fetchWallets())
  }

  // Get wallet balance styling based on balance
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'
    if (balance === 0) return 'text-gray-600'
    return 'text-red-600'
  }

  // Get default wallet badge styling
  const getDefaultBadge = () => {
    return 'inline-flex px-2 py-1 text-xs font-semibold rounded-full text-blue-600 bg-blue-50 border border-blue-200'
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const defaultWallet = wallets.find(w => w.isDefault)

  // Loading state
  if (loading && wallets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Error loading wallets
        </div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Wallets</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your wallets and track balances
          </p>
        </div>
        <button
          onClick={onAddWallet}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
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
          Add Wallet
        </button>
      </div>

      {/* Total Balance Summary */}
      {wallets.length > 0 && (
        <div className="mx-6 mb-6 bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Balance
              </h3>
              <p
                className={`text-3xl font-bold ${getBalanceColor(totalBalance)}`}
              >
                {formatVND(totalBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
              </p>
              {defaultWallet && (
                <p className="text-xs text-blue-600 mt-1">
                  Default: {defaultWallet.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No wallets yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first wallet to start tracking your finances.
          </p>
          <button
            onClick={onAddWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Wallet
          </button>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wallets.map(wallet => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {wallet.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created{' '}
                            {new Date(wallet.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${getBalanceColor(wallet.balance)}`}
                      >
                        {formatVND(wallet.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wallet.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {wallet.isDefault ? (
                        <span className={getDefaultBadge()}>Default</span>
                      ) : (
                        <button
                          onClick={() => handleSetDefaultWallet(wallet.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(wallet.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => onEditWallet?.(wallet)}
                        >
                          Edit
                        </button>
                        {!wallet.isDefault && (
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            onClick={() => handleDeleteWallet(wallet)}
                            disabled={deletingId === wallet.id}
                          >
                            {deletingId === wallet.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-1"></div>
                                Deleting...
                              </div>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {wallets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 pb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Wallets
            </h3>
            <p className="text-2xl font-bold text-gray-900">{wallets.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Positive Balance
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {wallets.filter(w => w.balance > 0).length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Zero Balance
            </h3>
            <p className="text-2xl font-bold text-gray-600">
              {wallets.filter(w => w.balance === 0).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Negative Balance
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {wallets.filter(w => w.balance < 0).length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletList
