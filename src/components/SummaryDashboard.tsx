import React, { useEffect, useState } from 'react';
import { enhancedTransactionRepository, enhancedCategoryRepository } from '../database/localStorageRepositories';
import type { Category } from '../types';

// Summary data interface
interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  loading: boolean;
  error: string | null;
}

// Category summary interface
interface CategorySummary {
  category: Category;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

// Summary card component
interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'balance';
  loading: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type, loading }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCardStyles = () => {
    switch (type) {
      case 'income':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'expense':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'balance':
        return amount >= 0 
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAmountStyles = () => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'balance':
        return amount >= 0 ? 'text-blue-600' : 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border shadow-sm ${getCardStyles()}`}>
      <h3 className="text-sm font-medium opacity-75 mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${getAmountStyles()}`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
};

// Main Summary Dashboard component
export const SummaryDashboard: React.FC = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
    loading: true,
    error: null
  });

  const [categorySummaries, setCategorySummaries] = useState<{
    income: CategorySummary[];
    expense: CategorySummary[];
    loading: boolean;
  }>({
    income: [],
    expense: [],
    loading: true
  });

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      setSummaryData(prev => ({ ...prev, loading: true, error: null }));
      setCategorySummaries(prev => ({ ...prev, loading: true }));
      
      // Fetch all transactions and categories
      const [transactions, categories] = await Promise.all([
        enhancedTransactionRepository.findAll(),
        enhancedCategoryRepository.findAll()
      ]);

      // Calculate basic summary
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = totalIncome - totalExpenses;

      // Calculate category summaries
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      const categoryTotals = new Map<string, { amount: number; count: number; type: 'income' | 'expense' }>();

      transactions.forEach(transaction => {
        const category = categoryMap.get(transaction.categoryId);
        if (category) {
          const existing = categoryTotals.get(category.id) || { amount: 0, count: 0, type: category.defaultType };
          categoryTotals.set(category.id, {
            amount: existing.amount + transaction.amount,
            count: existing.count + 1,
            type: transaction.type
          });
        }
      });

      // Create category summaries
      const incomeSummaries: CategorySummary[] = [];
      const expenseSummaries: CategorySummary[] = [];

      categoryTotals.forEach((totals, categoryId) => {
        const category = categoryMap.get(categoryId);
        if (category) {
          const summary: CategorySummary = {
            category,
            totalAmount: totals.amount,
            transactionCount: totals.count,
            percentage: totals.type === 'income' 
              ? totalIncome > 0 ? (totals.amount / totalIncome) * 100 : 0
              : totalExpenses > 0 ? (totals.amount / totalExpenses) * 100 : 0
          };

          if (totals.type === 'income') {
            incomeSummaries.push(summary);
          } else {
            expenseSummaries.push(summary);
          }
        }
      });

      // Sort by amount (descending)
      incomeSummaries.sort((a, b) => b.totalAmount - a.totalAmount);
      expenseSummaries.sort((a, b) => b.totalAmount - a.totalAmount);

      setSummaryData({
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount: transactions.length,
        loading: false,
        error: null
      });

      setCategorySummaries({
        income: incomeSummaries.slice(0, 5), // Top 5
        expense: expenseSummaries.slice(0, 5), // Top 5
        loading: false
      });

    } catch (error) {
      console.error('Error fetching summary data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summary data';
      setSummaryData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      setCategorySummaries(prev => ({ ...prev, loading: false }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSummaryData();
  }, []);

  // Refresh button handler
  const handleRefresh = () => {
    fetchSummaryData();
  };

  if (summaryData.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading summary</h3>
            <p className="text-sm text-red-600 mt-1">{summaryData.error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Summary</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your income, expenses, and net balance
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={summaryData.loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {summaryData.loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Income"
          amount={summaryData.totalIncome}
          type="income"
          loading={summaryData.loading}
        />
        <SummaryCard
          title="Total Expenses"
          amount={summaryData.totalExpenses}
          type="expense"
          loading={summaryData.loading}
        />
        <SummaryCard
          title="Net Balance"
          amount={summaryData.netBalance}
          type="balance"
          loading={summaryData.loading}
        />
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transactions</h3>
          {summaryData.loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {summaryData.transactionCount.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Category-based Summaries */}
      {!summaryData.loading && summaryData.transactionCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Income Categories */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Top Income Categories
            </h3>
            {categorySummaries.loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : categorySummaries.income.length > 0 ? (
              <div className="space-y-4">
                {categorySummaries.income.map((summary) => (
                  <div key={summary.category.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {summary.category.icon && (
                        <span className="mr-2 text-lg">{summary.category.icon}</span>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{summary.category.name}</div>
                        <div className="text-sm text-gray-500">
                          {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(summary.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {summary.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No income categories found</p>
            )}
          </div>

          {/* Top Expense Categories */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Top Expense Categories
            </h3>
            {categorySummaries.loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : categorySummaries.expense.length > 0 ? (
              <div className="space-y-4">
                {categorySummaries.expense.map((summary) => (
                  <div key={summary.category.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {summary.category.icon && (
                        <span className="mr-2 text-lg">{summary.category.icon}</span>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{summary.category.name}</div>
                        <div className="text-sm text-gray-500">
                          {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(summary.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {summary.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No expense categories found</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!summaryData.loading && summaryData.transactionCount > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Expense Ratio</p>
              <p className="text-xl font-bold text-gray-900">
                {summaryData.totalIncome > 0 
                  ? `${((summaryData.totalExpenses / summaryData.totalIncome) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-xl font-bold text-gray-900">
                {summaryData.transactionCount > 0
                  ? new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format((summaryData.totalIncome + summaryData.totalExpenses) / summaryData.transactionCount)
                  : 'N/A'
                }
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Financial Health</p>
              <p className={`text-xl font-bold ${
                summaryData.netBalance > 0 ? 'text-green-600' : 
                summaryData.netBalance === 0 ? 'text-gray-600' : 'text-red-600'
              }`}>
                {summaryData.netBalance > 0 ? 'Positive' : 
                 summaryData.netBalance === 0 ? 'Neutral' : 'Negative'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!summaryData.loading && summaryData.transactionCount === 0 && (
        <div className="bg-white p-12 rounded-lg border border-gray-200 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-6">Start adding transactions to see your financial summary.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Add Your First Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryDashboard;
