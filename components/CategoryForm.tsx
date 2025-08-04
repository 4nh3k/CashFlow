'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch } from '../lib/hooks'
import { createCategory, updateCategory } from '../lib/slices/categorySlice'
import type { Category } from '../types/category'

// Form validation schema
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must not exceed 50 characters')
    .trim(),
  defaultType: z.enum(['expense', 'income'], {
    message: 'Please select a category type',
  }),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Please enter a valid hex color'
    )
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .max(10, 'Icon must not exceed 10 characters')
    .optional()
    .or(z.literal('')),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  category?: Category
  onSubmit: () => void
  onCancel: () => void
  mode: 'create' | 'edit'
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  mode,
}) => {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'
  const title = isEditMode ? 'Edit Category' : 'Add New Category'

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      defaultType: category?.defaultType || 'expense',
      color: category?.color || '',
      icon: category?.icon || '',
    },
  })

  const watchedColor = watch('color')

  // Check for name uniqueness
  const checkNameUniqueness = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to check categories')
      }

      const existingCategories: Category[] = await response.json()
      const existingCategory = existingCategories.find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )

      // If editing, allow the same name for the current category
      if (isEditMode && category && existingCategory?.id === category.id) {
        return true
      }

      return !existingCategory
    } catch (error) {
      console.error('Error checking name uniqueness:', error)
      return true // Allow the operation if check fails
    }
  }

  // Form submission handler
  const onFormSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true)
      setNameError(null)

      // Check name uniqueness
      const isUnique = await checkNameUniqueness(data.name)
      if (!isUnique) {
        setError('name', {
          message: 'A category with this name already exists',
        })
        setNameError('A category with this name already exists')
        return
      }

      if (isEditMode && category) {
        // Update existing category
        await dispatch(
          updateCategory({
            id: category.id,
            updates: {
              name: data.name,
              defaultType: data.defaultType,
              color: data.color || undefined,
              icon: data.icon || undefined,
            },
          })
        ).unwrap()
      } else {
        // Create new category
        await dispatch(
          createCategory({
            name: data.name,
            defaultType: data.defaultType,
            color: data.color || undefined,
            icon: data.icon || undefined,
          })
        ).unwrap()
      }

      console.log(`Category ${isEditMode ? 'updated' : 'created'} successfully`)
      onSubmit()
    } catch (error: any) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} category:`,
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
          `Failed to ${isEditMode ? 'update' : 'create'} category: ${error?.message || 'Unknown error'}`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Predefined color options
  const colorOptions = [
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#84CC16',
    '#22C55E',
    '#10B981',
    '#14B8A6',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#D946EF',
    '#EC4899',
    '#F43F5E',
  ]

  // Predefined icon options
  const iconOptions = [
    '🍔',
    '🍕',
    '🍝',
    '☕',
    '🛒',
    '🚗',
    '⛽',
    '🏠',
    '💡',
    '📱',
    '👕',
    '💊',
    '🎬',
    '🎮',
    '📚',
    '✈️',
    '🏥',
    '🎓',
    '💰',
    '💼',
  ]

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isEditMode
            ? 'Update the category information below'
            : 'Add a new category to organize your transactions'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name *
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="Enter category name"
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
        </div>

        {/* Default Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Type *
          </label>
          <Controller
            name="defaultType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
                    field.value === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value="expense"
                    checked={field.value === 'expense'}
                    onChange={field.onChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Expense</span>
                </label>
                <label
                  className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
                    field.value === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    value="income"
                    checked={field.value === 'income'}
                    onChange={field.onChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Income</span>
                </label>
              </div>
            )}
          />
          {errors.defaultType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.defaultType.message}
            </p>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color (Optional)
          </label>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    {...field}
                    type="text"
                    placeholder="#FF0000"
                    className={`flex-1 px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.color ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {watchedColor && (
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-300"
                      style={{ backgroundColor: watchedColor }}
                    />
                  )}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        field.value === color
                          ? 'border-gray-800'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          />
          {errors.color && (
            <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
          )}
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon (Optional)
          </label>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <input
                  {...field}
                  type="text"
                  placeholder="Enter an emoji or icon"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.icon ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="grid grid-cols-10 gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => field.onChange(icon)}
                      className={`w-8 h-8 rounded border text-lg flex items-center justify-center ${
                        field.value === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
          {errors.icon && (
            <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>
          )}
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
              'Update Category'
            ) : (
              'Create Category'
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

export default CategoryForm
