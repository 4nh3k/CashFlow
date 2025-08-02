// Local API service for communicating with LocalStorage database
import { EnhancedTransactionRepository, EnhancedCategoryRepository, EnhancedWalletRepository } from '../database/localStorageRepositories';

// Create repository instances  
const transactionRepository = new EnhancedTransactionRepository();
const categoryRepository = new EnhancedCategoryRepository();
const walletRepository = new EnhancedWalletRepository();
import type { 
  Transaction, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Wallet,
  CreateWalletRequest,
  UpdateWalletRequest
} from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

class RealmApiService {
  // Helper method to wrap operations with error handling
  private async safeExecute<T>(operation: () => Promise<T>): Promise<ApiResponse<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      console.error('[realmApiService] Operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  // Transaction API methods
  async getTransactionSummary(): Promise<ApiResponse<TransactionSummary>> {
    return this.safeExecute(async () => {
      const [totalIncome, totalExpenses, transactionCount] = await Promise.all([
        transactionRepository.getTotalByType('income'),
        transactionRepository.getTotalByType('expense'),
        transactionRepository.count()
      ]);

      return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount
      };
    });
  }

  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return this.safeExecute(async () => {
      return await transactionRepository.findAll();
    });
  }

  async createTransaction(transaction: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    return this.safeExecute(async () => {
      const transactionData = {
        ...transaction,
        status: 'completed' as const,
      };
      return await transactionRepository.create(transactionData);
    });
  }

  async updateTransaction(id: string, transaction: UpdateTransactionRequest): Promise<ApiResponse<Transaction>> {
    return this.safeExecute(async () => {
      const updated = await transactionRepository.update(id, transaction);
      if (!updated) {
        throw new Error('Transaction not found');
      }
      return updated;
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    return this.safeExecute(async () => {
      return await transactionRepository.delete(id);
    });
  }

  async getTransactionsByWallet(walletId: string): Promise<ApiResponse<Transaction[]>> {
    return this.safeExecute(async () => {
      return await transactionRepository.findByWallet(walletId);
    });
  }

  async getTransactionsByCategory(categoryId: string): Promise<ApiResponse<Transaction[]>> {
    return this.safeExecute(async () => {
      return await transactionRepository.findByCategory(categoryId);
    });
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<ApiResponse<Transaction[]>> {
    return this.safeExecute(async () => {
      return await transactionRepository.findByDateRange(startDate, endDate);
    });
  }

  // Category API methods
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.safeExecute(async () => {
      return await categoryRepository.findAll();
    });
  }

  async createCategory(category: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return this.safeExecute(async () => {
      const categoryData = {
        ...category,
        isDefault: false,
      };
      return await categoryRepository.create(categoryData);
    });
  }

  async updateCategory(id: string, category: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    return this.safeExecute(async () => {
      const updated = await categoryRepository.update(id, category);
      if (!updated) {
        throw new Error('Category not found');
      }
      return updated;
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    return this.safeExecute(async () => {
      return await categoryRepository.delete(id);
    });
  }

  async getCategoriesByType(type: 'expense' | 'income'): Promise<ApiResponse<Category[]>> {
    return this.safeExecute(async () => {
      return await categoryRepository.findByType(type);
    });
  }

  async validateCategoryName(name: string, excludeId?: string): Promise<ApiResponse<boolean>> {
    return this.safeExecute(async () => {
      return await categoryRepository.validateUniqueName(name, excludeId);
    });
  }

  // Wallet API methods
  async getWallets(): Promise<ApiResponse<Wallet[]>> {
    return this.safeExecute(async () => {
      return await walletRepository.findAll();
    });
  }

  async createWallet(wallet: CreateWalletRequest): Promise<ApiResponse<Wallet>> {
    return this.safeExecute(async () => {
      const walletData = {
        ...wallet,
        currency: wallet.currency || 'VND',
        isDefault: wallet.isDefault || false,
      };
      return await walletRepository.create(walletData);
    });
  }

  async updateWallet(id: string, wallet: UpdateWalletRequest): Promise<ApiResponse<Wallet>> {
    return this.safeExecute(async () => {
      const updated = await walletRepository.update(id, wallet);
      if (!updated) {
        throw new Error('Wallet not found');
      }
      return updated;
    });
  }

  async deleteWallet(id: string): Promise<ApiResponse<boolean>> {
    return this.safeExecute(async () => {
      return await walletRepository.delete(id);
    });
  }

  async getDefaultWallet(): Promise<ApiResponse<Wallet | null>> {
    return this.safeExecute(async () => {
      return await walletRepository.findDefaultWallet();
    });
  }

  async updateWalletBalance(walletId: string, amount: number): Promise<ApiResponse<Wallet>> {
    return this.safeExecute(async () => {
      const updated = await walletRepository.updateBalance(walletId, amount);
      if (!updated) {
        throw new Error('Wallet not found');
      }
      return updated;
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.safeExecute(async () => {
      return {
        status: 'OK',
        timestamp: new Date().toISOString()
      };
    });
  }

  // Database initialization
  async initializeDatabase(): Promise<ApiResponse<boolean>> {
    return this.safeExecute(async () => {
      // Check if we have any categories, if not, create default ones
      const categories = await categoryRepository.findAll();
      if (categories.length === 0) {
        const defaultCategories: CreateCategoryRequest[] = [
          {
            name: 'Food & Dining',
            defaultType: 'expense',
            color: '#FF6B6B',
            icon: 'restaurant'
          },
          {
            name: 'Transportation',
            defaultType: 'expense',
            color: '#4ECDC4',
            icon: 'car'
          },
          {
            name: 'Shopping',
            defaultType: 'expense',
            color: '#45B7D1',
            icon: 'shopping-bag'
          },
          {
            name: 'Entertainment',
            defaultType: 'expense',
            color: '#F7DC6F',
            icon: 'music'
          },
          {
            name: 'Bills & Utilities',
            defaultType: 'expense',
            color: '#BB8FCE',
            icon: 'receipt'
          },
          {
            name: 'Salary',
            defaultType: 'income',
            color: '#58D68D',
            icon: 'dollar-sign'
          },
          {
            name: 'Investment',
            defaultType: 'income',
            color: '#85C1E9',
            icon: 'trending-up'
          }
        ];

        for (const category of defaultCategories) {
          const categoryData = {
            ...category,
            isDefault: false,
          };
          await categoryRepository.create(categoryData);
        }
      }

      // Check if we have any wallets, if not, create a default one
      const wallets = await walletRepository.findAll();
      if (wallets.length === 0) {
        await walletRepository.create({
          name: 'Cash',
          balance: 0,
          currency: 'VND',
          isDefault: true
        });
      }

      return true;
    });
  }
}

export const realmApiService = new RealmApiService();
