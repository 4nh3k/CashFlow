'use client'

import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { deleteCategory, fetchCategories } from '../lib/slices/categorySlice'
import type { Category } from '../types/category'

// Props interface
interface CategoryListProps {
  onEditCategory?: (category: Category) => void
  onAddCategory?: () => void
}

const CategoryList: React.FC<CategoryListProps> = ({
  onEditCategory,
  onAddCategory,
}) => {
  const dispatch = useAppDispatch()
  const { categories, loading, error } = useAppSelector(
    state => state.categories
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Handle category deletion
  const handleDeleteCategory = async (category: Category) => {
    if (
      !confirm(
        `Are you sure you want to delete the category "${category.name}"? All transactions in this category will be moved to "Uncategorized".`
      )
    ) {
      return
    }

    try {
      setDeletingId(category.id)
      await dispatch(deleteCategory(category.id)).unwrap()
      console.log(`Category "${category.name}" deleted successfully`)
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Get category type badge styling
  const getCategoryTypeBadge = (defaultType: 'income' | 'expense') => {
    const baseClasses =
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full'
    const typeClasses =
      defaultType === 'income'
        ? 'text-green-600 bg-green-50 border border-green-200'
        : 'text-red-600 bg-red-50 border border-red-200'

    return `${baseClasses} ${typeClasses}`
  }

  // Loading state
  if (loading && categories.length === 0) {
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
          Error loading categories
        </div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={() => dispatch(fetchCategories())}
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
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your transaction categories
          </p>
        </div>
        <button
          onClick={onAddCategory}
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
          Add Category
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No categories yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start adding categories to organize your transactions.
          </p>
          <button
            onClick={onAddCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Category
          </button>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {category.icon && (
                          <span className="mr-3 text-lg">{category.icon}</span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                          {category.isDefault && (
                            <div className="text-xs text-blue-600">
                              Default category
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={getCategoryTypeBadge(category.defaultType)}
                      >
                        {category.defaultType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.color ? (
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 mr-2"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {category.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No color</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => onEditCategory?.(category)}
                        >
                          Edit
                        </button>
                        {!category.isDefault && (
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={deletingId === category.id}
                          >
                            {deletingId === category.id ? (
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
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Categories
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {categories.length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Income Categories
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.defaultType === 'income').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Expense Categories
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {categories.filter(c => c.defaultType === 'expense').length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryList
