'use client'

import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { selectCategories } from '@/lib/slices/categorySlice'
import type {
  KeywordMapping,
  CreateKeywordMapping,
  Category,
} from '@/lib/types'

interface KeywordMappingSettingsProps {
  onClose?: () => void
}

// Mock Redux slice selectors and actions for keyword mappings
// TODO: Implement actual keywordMappingSlice once backend is ready
const selectKeywordMappings = () => [] as KeywordMapping[]
const selectKeywordMappingsLoading = () => false
const selectKeywordMappingsError = () => null

const mockKeywordMappingActions = {
  fetchKeywordMappings: () => ({ type: 'MOCK_FETCH' }),
  createKeywordMapping: (data: CreateKeywordMapping) => ({
    type: 'MOCK_CREATE',
    payload: data,
  }),
  updateKeywordMapping: ({
    id,
    data,
  }: {
    id: string
    data: Partial<KeywordMapping>
  }) => ({ type: 'MOCK_UPDATE', payload: { id, data } }),
  deleteKeywordMapping: (id: string) => ({ type: 'MOCK_DELETE', payload: id }),
}

export const KeywordMappingSettings: React.FC<KeywordMappingSettingsProps> = ({
  onClose,
}) => {
  const dispatch = useAppDispatch()
  const keywordMappings = useAppSelector(selectKeywordMappings)
  const categories = useAppSelector(selectCategories)
  const loading = useAppSelector(selectKeywordMappingsLoading)
  const error = useAppSelector(selectKeywordMappingsError)

  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editingMapping, setEditingMapping] = useState<KeywordMapping | null>(
    null
  )
  const [formData, setFormData] = useState({
    keyword: '',
    categoryId: '',
  })
  const [localMappings, setLocalMappings] = useState<KeywordMapping[]>([])

  useEffect(() => {
    // Mock implementation - fetch keyword mappings
    dispatch(mockKeywordMappingActions.fetchKeywordMappings())

    // Initialize with some mock data for demonstration
    const mockMappings: KeywordMapping[] = [
      {
        id: '1',
        keyword: 'cà phê',
        categoryId: categories[0]?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        keyword: 'xăng',
        categoryId: categories[1]?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    setLocalMappings(mockMappings)
  }, [dispatch, categories])

  const resetForm = () => {
    setFormData({
      keyword: '',
      categoryId: '',
    })
    setIsCreateMode(false)
    setEditingMapping(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.keyword.trim() || !formData.categoryId) return

    const createData: CreateKeywordMapping = {
      keyword: formData.keyword.trim(),
      categoryId: formData.categoryId,
    }

    try {
      // Mock implementation
      const newMapping: KeywordMapping = {
        id: Date.now().toString(),
        keyword: createData.keyword,
        categoryId: createData.categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setLocalMappings(prev => [...prev, newMapping])
      dispatch(mockKeywordMappingActions.createKeywordMapping(createData))
      resetForm()
    } catch (error) {
      console.error('Failed to create keyword mapping:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMapping || !formData.keyword.trim() || !formData.categoryId)
      return

    try {
      const updateData = {
        keyword: formData.keyword.trim(),
        categoryId: formData.categoryId,
      }

      setLocalMappings(prev =>
        prev.map(mapping =>
          mapping.id === editingMapping.id
            ? { ...mapping, ...updateData, updatedAt: new Date() }
            : mapping
        )
      )

      dispatch(
        mockKeywordMappingActions.updateKeywordMapping({
          id: editingMapping.id,
          data: updateData,
        })
      )
      resetForm()
    } catch (error) {
      console.error('Failed to update keyword mapping:', error)
    }
  }

  const handleDelete = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this keyword mapping?'))
      return

    try {
      setLocalMappings(prev => prev.filter(mapping => mapping.id !== mappingId))
      dispatch(mockKeywordMappingActions.deleteKeywordMapping(mappingId))
    } catch (error) {
      console.error('Failed to delete keyword mapping:', error)
    }
  }

  const startEdit = (mapping: KeywordMapping) => {
    setEditingMapping(mapping)
    setFormData({
      keyword: mapping.keyword,
      categoryId: mapping.categoryId,
    })
    setIsCreateMode(false)
  }

  const startCreate = () => {
    resetForm()
    setIsCreateMode(true)
  }

  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((c: Category) => c.id === categoryId)?.name ||
      'Unknown Category'
    )
  }

  // Use local mappings for demo purposes
  const displayMappings = localMappings.filter(mapping =>
    categories.some((cat: Category) => cat.id === mapping.categoryId)
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Keyword-to-Category Mappings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
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
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{String(error)}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreateMode || editingMapping) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isCreateMode ? 'Create New Mapping' : 'Edit Mapping'}
          </h3>

          <form
            onSubmit={isCreateMode ? handleCreate : handleUpdate}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="keyword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Keyword
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={formData.keyword}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, keyword: e.target.value }))
                  }
                  placeholder="e.g., 'cà phê', 'coffee', 'xăng'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading
                  ? 'Saving...'
                  : isCreateMode
                    ? 'Create Mapping'
                    : 'Update Mapping'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Actions */}
      <div className="mb-4">
        <button
          onClick={startCreate}
          disabled={isCreateMode || editingMapping !== null}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Add New Mapping
        </button>
      </div>

      {/* Mappings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Existing Mappings</h3>

        {loading && displayMappings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading mappings...</p>
          </div>
        ) : displayMappings.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-yellow-800">
                <strong>Demo Mode:</strong> This component uses mock data for
                demonstration. The keyword mapping functionality will be fully
                implemented when the backend API is ready.
              </p>
            </div>
            <p className="text-gray-500">
              No keyword mappings found. Create your first mapping above.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Currently showing demo data. Keyword
                mappings help the LLM automatically categorize transactions
                based on text patterns.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayMappings.map(mapping => (
                    <tr
                      key={mapping.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mapping.keyword}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCategoryName(mapping.categoryId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mapping.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEdit(mapping)}
                          disabled={isCreateMode || editingMapping !== null}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default KeywordMappingSettings
