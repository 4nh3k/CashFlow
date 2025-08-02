import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction, Category, Wallet } from '../types';
import { transactionFormDataSchema } from '../validation/transactionSchemas';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTransaction, updateTransaction, fetchTransactions } from '../store/transactionSlice';

// Form data types - use string for form inputs then convert to proper types
type TransactionFormData = z.infer<typeof transactionFormDataSchema>;

interface TransactionFormProps {
  transaction?: Transaction | undefined;
  onSubmit: () => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
  categories: Category[];
  wallets: Wallet[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSubmit,
  onCancel,
  mode,
  categories,
  wallets
}) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.transactions);
  
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  
  const isEditMode = mode === 'edit';
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormDataSchema),
    defaultValues: (transaction ? {
      amount: transaction.amount.toString(),
      type: transaction.type,
      description: transaction.description,
      categoryId: transaction.categoryId,
      walletId: transaction.walletId,
      date: transaction.date.toISOString().split('T')[0],
    } : {
      amount: '',
      type: 'expense' as const,
      description: '',
      categoryId: '',
      walletId: '',
      date: new Date().toISOString().split('T')[0],
    }) as any
  });

  const watchedType = watch('type');

  // Filter categories based on transaction type
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter((category: Category) => 
        category.defaultType === watchedType
      );
      setFilteredCategories(filtered);
    }
  }, [categories, watchedType]);

  const onFormSubmit = async (data: TransactionFormData) => {
    try {
      const formData = {
        amount: Number(data.amount),
        type: data.type,
        description: data.description,
        categoryId: data.categoryId,
        walletId: data.walletId,
        date: new Date(data.date)
      };

      if (isEditMode && transaction) {
        await dispatch(updateTransaction({
          id: transaction.id,
          ...formData
        })).unwrap();
      } else {
        await dispatch(addTransaction(formData)).unwrap();
      }
      
      // Refresh transactions list
      await dispatch(fetchTransactions()).unwrap();
      onSubmit();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description"
              />
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
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
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Wallet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet
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
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.balance.toLocaleString('vi-VN')} VND)
                  </option>
                ))}
              </select>
            )}
          />
          {errors.walletId && (
            <p className="mt-1 text-sm text-red-600">{errors.walletId.message}</p>
          )}
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
            ) : (
              isEditMode ? 'Update Transaction' : 'Add Transaction'
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
  );
};
