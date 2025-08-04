'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/slices/budgetSlice'
import { fetchCategories } from '@/lib/slices/categorySlice'
import { Budget, CreateBudget } from '@/lib/types/budget'
import { RootState } from '@/lib/store'

export default function BudgetsPage() {
  const dispatch = useAppDispatch()
  const { budgets, loading, error } = useAppSelector(
    (state: RootState) => state.budgets
  )
  const { categories } = useAppSelector((state: RootState) => state.categories)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState<CreateBudget>({
    name: '',
    amount: 0,
    period: 'monthly',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    dispatch(fetchBudgets())
    dispatch(fetchCategories())
  }, [dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBudget) {
      dispatch(updateBudget({ id: editingBudget.id, budget: formData }))
    } else {
      dispatch(
        createBudget({
          name: formData.name,
          categoryId: formData.categoryId || null,
          amount: formData.amount,
          period: formData.period,
          startDate: formData.startDate,
          endDate: formData.endDate,
        })
      )
    }
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      period: 'monthly',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })
    setEditingBudget(null)
    setIsFormOpen(false)
  }

  const handleEdit = (budget: Budget) => {
    setFormData({
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.categoryId || '',
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
    })
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      dispatch(deleteBudget(id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Budgets</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Budget
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Budget Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Budget Name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={e =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={formData.period}
                onChange={e =>
                  setFormData({
                    ...formData,
                    period: e.target.value as 'weekly' | 'monthly' | 'yearly',
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
                value={formData.categoryId}
                onChange={e =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Start Date"
                value={formData.startDate}
                onChange={e =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="date"
                placeholder="End Date"
                value={formData.endDate}
                onChange={e =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBudget ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget: Budget) => {
          const category = categories.find(
            (c: any) => c.id === budget.categoryId
          )
          const spent = budget.spent || 0
          const remaining = budget.amount - spent
          const progress = (spent / budget.amount) * 100

          return (
            <div key={budget.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {budget.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {category && (
                <p className="text-sm text-gray-500 mb-2">
                  Category: {category.name}
                </p>
              )}

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Spent: {formatCurrency(spent)}</span>
                  <span>Remaining: {formatCurrency(remaining)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      progress > 100
                        ? 'bg-red-500'
                        : progress > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.toFixed(1)}% used
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  Budget: {formatCurrency(budget.amount)} ({budget.period})
                </p>
                <p>
                  Period: {new Date(budget.startDate).toLocaleDateString()} -{' '}
                  {new Date(budget.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {budgets.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No budgets found
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first budget.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Budget
          </button>
        </div>
      )}
    </div>
  )
}
