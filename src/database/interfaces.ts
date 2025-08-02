// Repository interfaces for better abstraction and testing

export interface IRepository<T, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, any>): Promise<T[]>;
  update(id: string, data: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: Record<string, any>): Promise<number>;
}

export interface ITransactionRepository<T, CreateDTO, UpdateDTO> extends IRepository<T, CreateDTO, UpdateDTO> {
  findByWallet(walletId: string): Promise<T[]>;
  findByCategory(categoryId: string): Promise<T[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<T[]>;
  findByType(type: 'expense' | 'income'): Promise<T[]>;
  getTotalByType(type: 'expense' | 'income'): Promise<number>;
  reassignToUncategorized(categoryId: string, uncategorizedCategoryId: string): Promise<number>;
}

export interface ICategoryRepository<T, CreateDTO, UpdateDTO> extends IRepository<T, CreateDTO, UpdateDTO> {
  findByName(name: string): Promise<T | null>;
  findByNameExcludingId(name: string, excludeId: string): Promise<T | null>;
  findByType(type: 'expense' | 'income'): Promise<T[]>;
  findDefaultCategories(): Promise<T[]>;
  getUncategorizedCategory(): Promise<T>;
  validateUniqueName(name: string, excludeId?: string): Promise<boolean>;
}

export interface IWalletRepository<T, CreateDTO, UpdateDTO> extends IRepository<T, CreateDTO, UpdateDTO> {
  findDefaultWallet(): Promise<T | null>;
  updateBalance(walletId: string, amount: number): Promise<T | null>;
}

// Transaction support for batch operations
export interface ITransaction {
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

// Storage provider interface for abstraction
export interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// Error types
export class RepositoryError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends RepositoryError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', details);
  }
}

export class DuplicateError extends RepositoryError {
  constructor(message: string, details?: any) {
    super(message, 'DUPLICATE_ERROR', details);
  }
}
