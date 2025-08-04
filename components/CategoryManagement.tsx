'use client'

import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../lib/hooks'
import { fetchCategories } from '../lib/slices/categorySlice'
import CategoryList from './CategoryList'
import CategoryForm from './CategoryForm'
import Modal from './Modal'
import type { Category } from '../types/category'

type ViewMode = 'list' | 'create' | 'edit'

export default function CategoryManagement() {
  const dispatch = useAppDispatch()
  const { categories, loading, error } = useAppSelector(
    state => state.categories
  )

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()

  // Load categories on component mount
  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const handleCreateCategory = () => {
    setEditingCategory(undefined)
    setViewMode('create')
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setViewMode('edit')
  }

  const handleFormSubmit = async () => {
    setViewMode('list')
    setEditingCategory(undefined)
    // Refresh categories after form submission
    try {
      await dispatch(fetchCategories()).unwrap()
    } catch (error) {
      console.error('Error refreshing categories:', error)
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingCategory(undefined)
  }

  const renderContent = () => {
    if (loading && categories.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading categories...</span>
        </div>
      )
    }

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
            Error Loading Categories
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchCategories())}
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
          <Modal isOpen={true} onClose={handleFormCancel}>
            <CategoryForm
              category={editingCategory}
              mode={viewMode}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </Modal>
        )

      case 'list':
      default:
        return (
          <CategoryList
            onEditCategory={handleEditCategory}
            onAddCategory={handleCreateCategory}
          />
        )
    }
  }

  const expenseCategories = categories.filter(
    c => c.defaultType === 'expense'
  ).length
  const incomeCategories = categories.filter(
    c => c.defaultType === 'income'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Category Management
            </h2>
            <p className="text-gray-600 mt-1">
              Organize your transactions with custom categories
            </p>
          </div>
          <button
            onClick={handleCreateCategory}
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
            Add Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  {categories.length}
                </h3>
                <p className="text-blue-700 text-sm">Total Categories</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-900">
                  {expenseCategories}
                </h3>
                <p className="text-red-700 text-sm">Expense Categories</p>
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
                  {incomeCategories}
                </h3>
                <p className="text-green-700 text-sm">Income Categories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {renderContent()}
      </div>
    </div>
  )
}
