'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { createWallet, updateWallet } from '../lib/slices/walletSlice'
import type { Wallet } from '../types/wallet'

// Form validation schema
const walletFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Wallet name is required')
    .max(50, 'Wallet name must not exceed 50 characters')
    .trim(),
  balance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .finite('Balance must be a valid number'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters'),
  isDefault: z.boolean(),
})

type WalletFormData = z.infer<typeof walletFormSchema>

interface WalletFormProps {
  wallet?: Wallet | undefined
  onSubmit: () => void
  onCancel: () => void
  mode: 'create' | 'edit'
}

const WalletForm: React.FC<WalletFormProps> = ({
  wallet,
  onSubmit,
  onCancel,
  mode,
}) => {
  const dispatch = useAppDispatch()
  const { wallets, loading } = useAppSelector(state => state.wallets)
  const [nameError, setNameError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const title = isEditMode ? 'Edit Wallet' : 'Add New Wallet'

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<WalletFormData>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: wallet?.name || '',
      balance: wallet?.balance || 0,
      currency: wallet?.currency || 'VND',
      isDefault: wallet?.isDefault || false,
    },
  })

  const watchedIsDefault = watch('isDefault')

  // Check for name uniqueness
  const checkNameUniqueness = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/wallets')
      if (!response.ok) {
        throw new Error('Failed to check wallets')
      }

      const existingWallets: Wallet[] = await response.json()
      const existingWallet = existingWallets.find(
        w => w.name.toLowerCase() === name.toLowerCase()
      )

      // If editing, allow the same name for the current wallet
      if (isEditMode && wallet && existingWallet?.id === wallet.id) {
        return true
      }

      return !existingWallet
    } catch (error) {
      console.error('Error checking name uniqueness:', error)
      return true // Allow the operation if check fails
    }
  }

  // Form submission handler
  const onFormSubmit = async (data: WalletFormData) => {
    try {
      setNameError(null)

      // Check name uniqueness
      const isUnique = await checkNameUniqueness(data.name)
      if (!isUnique) {
        setError('name', {
          message: 'A wallet with this name already exists',
        })
        setNameError('A wallet with this name already exists')
        return
      }

      if (isEditMode && wallet) {
        // Update existing wallet
        await dispatch(
          updateWallet({
            id: wallet.id,
            updates: {
              name: data.name,
              balance: data.balance,
              currency: data.currency,
              isDefault: data.isDefault,
            },
          })
        ).unwrap()
      } else {
        // Create new wallet
        await dispatch(
          createWallet({
            name: data.name,
            balance: data.balance,
            currency: data.currency || 'VND',
            isDefault: data.isDefault || false,
          })
        ).unwrap()
      }

      console.log(`Wallet ${isEditMode ? 'updated' : 'created'} successfully`)
      onSubmit()
    } catch (error: any) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} wallet:`,
        error
      )

      if (
        error?.message?.includes('name') ||
        error?.message?.includes('unique')
      ) {
        setError('name', { message: error.message })
        setNameError(error.message)
      } else {
        // Handle other errors
        alert(
          `Failed to ${isEditMode ? 'update' : 'create'} wallet: ${error?.message || 'Unknown error'}`
        )
      }
    }
  }

  // Predefined currency options
  const currencyOptions = [
    { value: 'VND', label: 'VND (Vietnamese Dong)', symbol: '₫' },
    { value: 'USD', label: 'USD (US Dollar)', symbol: '$' },
    { value: 'EUR', label: 'EUR (Euro)', symbol: '€' },
    { value: 'JPY', label: 'JPY (Japanese Yen)', symbol: '¥' },
    { value: 'GBP', label: 'GBP (British Pound)', symbol: '£' },
  ]

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode
            ? 'Update the wallet information below'
            : 'Create a new wallet to track your finances'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Wallet Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Name *
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="Enter wallet name"
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name || nameError
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
              />
            )}
          />
          {(errors.name || nameError) && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name?.message || nameError}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Choose a unique name for your wallet (e.g., "Cash", "Bank Account",
            "Credit Card")
          </p>
        </div>

        {/* Initial Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isEditMode ? 'Current Balance' : 'Initial Balance'} *
          </label>
          <Controller
            name="balance"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  onChange={e =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.balance ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₫</span>
                </div>
              </div>
            )}
          />
          {errors.balance && (
            <p className="mt-1 text-sm text-red-600">
              {errors.balance.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {isEditMode
              ? 'Update the current balance of this wallet'
              : 'Enter the starting amount in this wallet'}
          </p>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.currency ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {currencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currency.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Select the currency for this wallet
          </p>
        </div>

        {/* Default Wallet */}
        <div>
          <div className="flex items-center">
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value || false}
                    onChange={e => field.onChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Set as default wallet
                  </label>
                </div>
              )}
            />
          </div>
          {watchedIsDefault && (
            <p className="mt-1 text-xs text-blue-600">
              This wallet will be preselected when adding new transactions
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            The default wallet is automatically selected for new transactions
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isSubmitting || loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Update Wallet'
            ) : (
              'Create Wallet'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default WalletForm
