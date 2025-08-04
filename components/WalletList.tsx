'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../lib/store'
import {
  fetchWallets,
  deleteWallet,
  updateWallet,
  selectWallets,
  selectWalletsLoading,
  selectWalletsError,
} from '../lib/slices/walletSlice'
import type { Wallet } from '../lib/types/wallet'

interface WalletListProps {
  onEditWallet?: (wallet: Wallet) => void
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const WalletList: React.FC<WalletListProps> = ({ onEditWallet }) => {
  const dispatch = useDispatch<AppDispatch>()
  const wallets = useSelector(selectWallets)
  const loading = useSelector(selectWalletsLoading)
  const error = useSelector(selectWalletsError)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Handle wallet deletion
  const handleDeleteWallet = async (wallet: Wallet) => {
    if (wallet.isDefault) {
      console.warn('Cannot delete default wallet')
      return
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`
    )

    if (!isConfirmed) return

    try {
      setDeletingId(wallet.id)
      await dispatch(deleteWallet(wallet.id)).unwrap()
      console.log('Wallet deleted successfully')
    } catch (error) {
      console.error('Error deleting wallet:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle setting default wallet
  const handleSetDefaultWallet = async (walletId: string) => {
    try {
      // First, remove default status from all wallets
      const currentDefault = wallets.find(w => w.isDefault)
      if (currentDefault && currentDefault.id !== walletId) {
        await dispatch(
          updateWallet({
            id: currentDefault.id,
            updates: { isDefault: false },
          })
        ).unwrap()
      }

      // Set the new default wallet
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
      {/* Total Balance Summary */}
      {wallets.length > 0 && (
        <div className="mx-4 sm:mx-6 mb-6 bg-gray-50 p-4 sm:p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Balance
              </h3>
              <p
                className={`text-2xl sm:text-3xl font-bold ${getBalanceColor(totalBalance)}`}
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
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="block sm:hidden">
            <div className="space-y-4 px-4">
              {wallets.map(wallet => (
                <div key={wallet.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{wallet.name}</p>
                        {wallet.isDefault && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${getBalanceColor(wallet.balance)}`}>
                        {formatVND(wallet.balance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(wallet.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      {!wallet.isDefault && (
                        <button
                          onClick={() => handleSetDefaultWallet(wallet.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => onEditWallet && onEditWallet(wallet)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      {!wallet.isDefault && (
                        <button
                          onClick={() => handleDeleteWallet(wallet)}
                          disabled={deletingId === wallet.id}
                          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          {deletingId === wallet.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block overflow-hidden">
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
                              Created {new Date(wallet.createdAt).toLocaleDateString()}
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
        </>
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
