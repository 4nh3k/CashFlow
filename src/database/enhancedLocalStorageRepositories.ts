// Enhanced local storage implementation for the database layer
import type { 
  Transaction, 
  Category,
  Wallet,
} from '../types';
import type {
  ITransactionRepository,
  ICategoryRepository,
  IWalletRepository
} from './interfaces';
import {
  ValidationError,
  NotFoundError,
  RepositoryError
} from './interfaces';
import { storageManager } from './storage';

// Utility function to generate IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Base repository class for local storage
class LocalStorageRepository<T extends { id: string }> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private getAll(): T[] {
    return storageManager.get<T>(this.key);
  }

  private saveAll(items: T[]): void {
    storageManager.set(this.key, items);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const items = this.getAll();
      const newItem = {
        ...data,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as T;

      items.push(newItem);
      this.saveAll(items);
      return newItem;
    } catch (error) {
      throw new RepositoryError(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'CREATE_ERROR');
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const items = this.getAll();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      throw new RepositoryError(`Failed to find item by id: ${error instanceof Error ? error.message : 'Unknown error'}`, 'FIND_ERROR');
    }
  }

  async findAll(filter?: Record<string, any>): Promise<T[]> {
    try {
      let items = this.getAll();
      
      if (filter && Object.keys(filter).length > 0) {
        items = items.filter(item => {
          return Object.entries(filter).every(([key, value]) => {
            if (value === null || value === undefined) return true;
            
            // Handle date range queries
            if (typeof value === 'object' && value !== null) {
              const itemValue = (item as any)[key];
              if (value.$gte && value.$lte) {
                const itemDate = new Date(itemValue);
                return itemDate >= new Date(value.$gte) && itemDate <= new Date(value.$lte);
              }
              if (value.$gte) {
                const itemDate = new Date(itemValue);
                return itemDate >= new Date(value.$gte);
              }
              if (value.$lte) {
                const itemDate = new Date(itemValue);
                return itemDate <= new Date(value.$lte);
              }
            }
            
            return (item as any)[key] === value;
          });
        });
      }
      
      return items;
    } catch (error) {
      throw new RepositoryError(`Failed to find items: ${error instanceof Error ? error.message : 'Unknown error'}`, 'FIND_ERROR');
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const items = this.getAll();
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new NotFoundError(`Item with id ${id} not found`);
      }

      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date(),
      } as unknown as T;

      this.saveAll(items);
      return items[index];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'UPDATE_ERROR');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const items = this.getAll();
      const initialLength = items.length;
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length === initialLength) {
        throw new NotFoundError(`Item with id ${id} not found`);
      }

      this.saveAll(filteredItems);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`, 'DELETE_ERROR');
    }
  }

  async count(filter?: Record<string, any>): Promise<number> {
    try {
      const items = await this.findAll(filter);
      return items.length;
    } catch (error) {
      throw new RepositoryError(`Failed to count items: ${error instanceof Error ? error.message : 'Unknown error'}`, 'COUNT_ERROR');
    }
  }
}

// Enhanced Transaction Repository implementing the interface
export class EnhancedTransactionRepository extends LocalStorageRepository<Transaction> implements ITransactionRepository<Transaction, Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, Partial<Transaction>> {
  constructor() {
    super('transactions');
  }

  async findByWallet(walletId: string): Promise<Transaction[]> {
    return this.findAll({ walletId });
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return this.findAll({ categoryId });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.findAll({
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });
  }

  async findByType(type: 'expense' | 'income'): Promise<Transaction[]> {
    return this.findAll({ type });
  }

  async getTotalByType(type: 'expense' | 'income'): Promise<number> {
    const transactions = await this.findByType(type);
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  }

  async reassignToUncategorized(categoryId: string, uncategorizedCategoryId: string): Promise<number> {
    const transactions = await this.findByCategory(categoryId);
    let count = 0;
    
    for (const transaction of transactions) {
      await this.update(transaction.id, { categoryId: uncategorizedCategoryId });
      count++;
    }
    
    return count;
  }

  // Legacy methods for backward compatibility
  async findByWalletId(walletId: string): Promise<Transaction[]> {
    return this.findByWallet(walletId);
  }

  async findByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.findByCategory(categoryId);
  }

  async getTotalByWallet(walletId: string): Promise<number> {
    const transactions = await this.findByWalletId(walletId);
    return transactions.reduce((total, transaction) => {
      return total + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);
  }

  async getTotalByCategory(categoryId: string): Promise<number> {
    const transactions = await this.findByCategoryId(categoryId);
    return transactions.reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);
  }

  async validateTransaction(transaction: Partial<Transaction>): Promise<void> {
    if (!transaction.amount || transaction.amount <= 0) {
      throw new ValidationError('Transaction amount must be positive');
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      throw new ValidationError('Transaction type must be income or expense');
    }

    if (!transaction.walletId) {
      throw new ValidationError('Transaction must have a wallet ID');
    }

    if (!transaction.categoryId) {
      throw new ValidationError('Transaction must have a category ID');
    }

    if (!transaction.description || transaction.description.trim().length === 0) {
      throw new ValidationError('Transaction must have a description');
    }
  }

  override async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    await this.validateTransaction(data);
    return super.create(data);
  }

  override async update(id: string, data: Partial<Transaction>): Promise<Transaction | null> {
    if (Object.keys(data).length > 0) {
      await this.validateTransaction(data);
    }
    return super.update(id, data);
  }
}

// Enhanced Category Repository implementing the interface
export class EnhancedCategoryRepository extends LocalStorageRepository<Category> implements ICategoryRepository<Category, Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, Partial<Category>> {
  constructor() {
    super('categories');
  }

  async findByType(type: 'income' | 'expense'): Promise<Category[]> {
    return this.findAll({ defaultType: type });
  }

  async findByName(name: string): Promise<Category | null> {
    const categories = await this.findAll({ name });
    return categories[0] || null;
  }

  async findByNameExcludingId(name: string, excludeId: string): Promise<Category | null> {
    const categories = await this.findAll({ name });
    return categories.find(cat => cat.id !== excludeId) || null;
  }

  async findDefaultCategories(): Promise<Category[]> {
    // Assuming default categories have a special property or naming convention
    return this.findAll({ isDefault: true });
  }

  async getUncategorizedCategory(): Promise<Category> {
    const uncategorized = await this.findByName('Uncategorized');
    if (!uncategorized) {
      // Create uncategorized category if it doesn't exist
      return this.create({
        name: 'Uncategorized',
        defaultType: 'expense',
        isDefault: true
      });
    }
    return uncategorized;
  }

  async validateUniqueName(name: string, excludeId?: string): Promise<boolean> {
    const existing = excludeId 
      ? await this.findByNameExcludingId(name, excludeId)
      : await this.findByName(name);
    return !existing;
  }

  async validateCategory(category: Partial<Category>): Promise<void> {
    if (!category.name || category.name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    if (category.defaultType && !['income', 'expense'].includes(category.defaultType)) {
      throw new ValidationError('Category type must be income or expense');
    }

    // Check for duplicate names
    const existing = await this.findByName(category.name);
    if (existing && existing.id !== (category as Category).id) {
      throw new ValidationError('Category name must be unique');
    }
  }

  override async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    await this.validateCategory(data);
    return super.create(data);
  }

  override async update(id: string, data: Partial<Category>): Promise<Category | null> {
    if (Object.keys(data).length > 0) {
      await this.validateCategory({ ...data, id } as Category);
    }
    return super.update(id, data);
  }
}

// Enhanced Wallet Repository implementing the interface
export class EnhancedWalletRepository extends LocalStorageRepository<Wallet> implements IWalletRepository<Wallet, Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>, Partial<Wallet>> {
  constructor() {
    super('wallets');
  }

  async findByName(name: string): Promise<Wallet | null> {
    const wallets = await this.findAll({ name });
    return wallets[0] || null;
  }

  async findDefaultWallet(): Promise<Wallet | null> {
    const wallets = await this.findAll({ isDefault: true });
    return wallets[0] || null;
  }

  async updateBalance(walletId: string, amount: number): Promise<Wallet | null> {
    const wallet = await this.findById(walletId);
    if (!wallet) {
      throw new NotFoundError(`Wallet with id ${walletId} not found`);
    }

    return this.update(walletId, { balance: wallet.balance + amount });
  }

  async validateWallet(wallet: Partial<Wallet>): Promise<void> {
    if (!wallet.name || wallet.name.trim().length === 0) {
      throw new ValidationError('Wallet name is required');
    }

    if (wallet.balance !== undefined && wallet.balance < 0) {
      throw new ValidationError('Wallet balance cannot be negative');
    }

    // Check for duplicate names
    const existing = await this.findByName(wallet.name);
    if (existing && existing.id !== (wallet as Wallet).id) {
      throw new ValidationError('Wallet name must be unique');
    }
  }

  override async create(data: Omit<Wallet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    await this.validateWallet(data);
    return super.create({
      ...data,
      balance: data.balance || 0
    });
  }

  override async update(id: string, data: Partial<Wallet>): Promise<Wallet | null> {
    if (Object.keys(data).length > 0) {
      await this.validateWallet({ ...data, id } as Wallet);
    }
    return super.update(id, data);
  }
}

// Export repository instances
export const enhancedTransactionRepository = new EnhancedTransactionRepository();
export const enhancedCategoryRepository = new EnhancedCategoryRepository();
export const enhancedWalletRepository = new EnhancedWalletRepository();
