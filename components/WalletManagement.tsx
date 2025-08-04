'use client'

import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { selectWalletsLoading, createWallet, updateWallet, selectWallets, deleteWallet, selectWalletsError, selectTotalBalance, fetchWallets } from "@/lib/slices/walletSlice"
import { Wallet, CreateWalletRequest } from "@/types"
import { useState, useEffect } from "react"



// Modal component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Wallet Form component
interface WalletFormProps {
  wallet?: Wallet
  mode: 'create' | 'edit'
  onSubmit: (success: boolean, wallet?: Wallet) => void
  onCancel: () => void
}

const WalletForm: React.FC<WalletFormProps> = ({
  wallet,
  mode,
  onSubmit,
  onCancel,
}) => {
  const dispatch = useAppDispatch()
  const loading = useAppSelector(selectWalletsLoading)

  const [formData, setFormData] = useState<CreateWalletRequest>({
    name: wallet?.name || '',
    balance: wallet?.balance || 0,
    currency: wallet?.currency || 'VND',
    isDefault: wallet?.isDefault || false,
  })

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (mode === 'create') {
        await dispatch(createWallet(formData)).unwrap()
      } else if (wallet) {
        const updateData = {
          id: wallet.id,
          name: formData.name,
          balance: formData.balance,
          currency: formData.currency,
          isDefault: formData.isDefault,
        }
        await dispatch(
          updateWallet({ id: wallet.id, updates: updateData })
        ).unwrap()
      }
      onSubmit(true)
    } catch (error) {
      console.error('Error saving wallet:', error)
      onSubmit(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wallet Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter wallet name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Balance
        </label>
        <input
          type="number"
          value={formData.balance}
          onChange={e =>
            setFormData({
              ...formData,
              balance: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
          min="0"
          step="1000"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(formData.balance)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
        <select
          value={formData.currency}
          onChange={e => setFormData({ ...formData, currency: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="VND">VND (Vietnamese Dong)</option>
          <option value="USD">USD (US Dollar)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={e =>
            setFormData({ ...formData, isDefault: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
          Set as default wallet
        </label>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          {loading
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Wallet'
              : 'Update Wallet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// Wallet List component
interface WalletListProps {
  onEditWallet: (wallet: Wallet) => void
  onAddWallet: () => void
}

const WalletList: React.FC<WalletListProps> = ({
  onEditWallet,
  onAddWallet,
}) => {
  const dispatch = useAppDispatch()
  const wallets = useAppSelector(selectWallets)
  const loading = useAppSelector(selectWalletsLoading)

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      try {
        await dispatch(deleteWallet(id)).unwrap()
      } catch (error) {
        console.error('Error deleting wallet:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading wallets...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Wallets ({wallets.length})
        </h3>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(wallet => (
          <div
            key={wallet.id}
            className={`bg-white border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${
              wallet.isDefault
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
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
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{wallet.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {wallet.currency}
                    {wallet.isDefault && ' • Default'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => onEditWallet(wallet)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(wallet.id)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-all">
                {formatCurrency(wallet.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {wallets.length === 0 && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No wallets</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new wallet.
          </p>
          <div className="mt-6">
            <button
              onClick={onAddWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              Add your first wallet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Wallet Management component
export default function WalletsManagement() {
  const dispatch = useAppDispatch()
  const wallets = useAppSelector(selectWallets)
  const loading = useAppSelector(selectWalletsLoading)
  const error = useAppSelector(selectWalletsError)
  const totalBalance = useAppSelector(selectTotalBalance)

  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingWallet, setEditingWallet] = useState<Wallet | undefined>()

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Load wallets on component mount
  useEffect(() => {
    dispatch(fetchWallets())
  }, [dispatch])

  const handleCreateWallet = () => {
    setEditingWallet(undefined)
    setViewMode('create')
  }

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet)
    setViewMode('edit')
  }

  const handleFormSubmit = async (success: boolean, _wallet?: Wallet) => {
    if (success) {
      setViewMode('list')
      setEditingWallet(undefined)
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingWallet(undefined)
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="h-12 w-12 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Wallets
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchWallets())}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    switch (viewMode) {
      case 'create':
      case 'edit':
        return (
          <Modal
            isOpen={true}
            onClose={handleFormCancel}
            title={viewMode === 'create' ? 'Add New Wallet' : 'Edit Wallet'}
          >
            <WalletForm
              wallet={editingWallet}
              mode={viewMode}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </Modal>
        )

      case 'list':
      default:
        return (
          <WalletList
            onEditWallet={handleEditWallet}
            onAddWallet={handleCreateWallet}
          />
        )
    }
  }

  return (
    <div className="container mx-auto p-3 sm:p-4">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Wallet Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Track your accounts and balances
              </p>
            </div>
            <button
              onClick={handleCreateWallet}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base w-full sm:w-auto"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
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
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900">
                    {wallets.length}
                  </h3>
                  <p className="text-blue-700 text-xs sm:text-sm">Total Wallets</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
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
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-green-900 truncate">
                    {formatCurrency(totalBalance)}
                  </h3>
                  <p className="text-green-700 text-xs sm:text-sm">Total Balance</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-yellow-900">
                    {wallets.filter(w => w.isDefault).length}
                  </h3>
                  <p className="text-yellow-700 text-xs sm:text-sm">Default Wallets</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
