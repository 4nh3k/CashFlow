import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchTransactions, 
  selectFilteredTransactions, 
  selectTransactionLoading, 
  selectTransactionError,
  selectTransactionFilters,
  selectTransactionSortOptions,
  setFilters,
  setSortOptions,
  clearFilters
} from '../store/transactionSlice';
import { formatVND } from '../utils/currency';
import { formatVietnameseDate } from '../utils/text';
import type { TransactionType, TransactionStatus, Transaction } from '../types';

// Props interface for optional callbacks
interface TransactionListProps {
  onEditTransaction?: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onEditTransaction }) => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectFilteredTransactions);
  const loading = useAppSelector(selectTransactionLoading);
  const error = useAppSelector(selectTransactionError);
  const filters = useAppSelector(selectTransactionFilters);
  const sortOptions = useAppSelector(selectTransactionSortOptions);

  const [localFilters, setLocalFilters] = useState({
    type: filters.type || '',
    status: filters.status || '',
    startDate: filters.startDate ? new Date(filters.startDate).toISOString().split('T')[0] : '',
    endDate: filters.endDate ? new Date(filters.endDate).toISOString().split('T')[0] : ''
  });

  // Remove this useEffect - TransactionManagement already handles data loading
  // useEffect(() => {
  //   console.log('[TransactionList] useEffect triggered - fetching transactions');
  //   dispatch(fetchTransactions());
  // }, [dispatch]);

  const handleFilterChange = (field: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    const newFilters: any = {};
    
    if (localFilters.type) newFilters.type = localFilters.type as TransactionType;
    if (localFilters.status) newFilters.status = localFilters.status as TransactionStatus;
    if (localFilters.startDate) newFilters.startDate = new Date(localFilters.startDate).toISOString();
    if (localFilters.endDate) newFilters.endDate = new Date(localFilters.endDate).toISOString();
    
    dispatch(setFilters(newFilters));
  };

  const handleSortChange = (field: string) => {
    const direction = sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc';
    dispatch(setSortOptions({ field: field as any, direction }));
  };

  const clearAllFilters = () => {
    setLocalFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    dispatch(clearFilters());
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    return type === 'income' ? 'text-success-600 bg-success-50' : 'text-danger-600 bg-danger-50';
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50';
      case 'pending':
        return 'text-warning-600 bg-warning-50';
      case 'cancelled':
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-danger-600 text-lg font-semibold mb-2">Error loading transactions</div>
        <div className="text-gray-600">{error}</div>
        <button 
          className="btn-primary mt-4"
          onClick={() => dispatch(fetchTransactions())}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="input-field"
              value={localFilters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input-field"
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="input-field"
              value={localFilters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="input-field"
              value={localFilters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <button className="btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="btn-secondary" onClick={clearAllFilters}>
            Clear All
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Transactions ({transactions.length})</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('date')}
                  >
                    Date
                    {sortOptions.field === 'date' && (
                      <span className="ml-1">
                        {sortOptions.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('amount')}
                  >
                    Amount
                    {sortOptions.field === 'amount' && (
                      <span className="ml-1">
                        {sortOptions.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatVietnameseDate(new Date(transaction.date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatVND(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        onClick={() => onEditTransaction?.(transaction)}
                      >
                        Edit
                      </button>
                      <button className="text-danger-600 hover:text-danger-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList; 