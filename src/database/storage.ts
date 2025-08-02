// Enhanced localStorage implementation with transaction support and better error handling
import type { 
  IStorageProvider, 
  ITransaction
} from './interfaces';

// LocalStorage implementation
export class LocalStorageProvider implements IStorageProvider {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      throw new Error('Storage operation failed');
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      throw new Error('Storage operation failed');
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw new Error('Storage operation failed');
    }
  }
}

// Simple transaction implementation for localStorage
export class LocalStorageTransaction implements ITransaction {
  private operations: Array<() => void> = [];
  private rollbackOperations: Array<() => void> = [];

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      
      // Execute all pending operations
      this.operations.forEach(op => op());
      this.operations = [];
      this.rollbackOperations = [];
      
      return result;
    } catch (error) {
      // Rollback all operations
      this.rollbackOperations.reverse().forEach(op => {
        try {
          op();
        } catch (rollbackError) {
          console.error('Rollback operation failed:', rollbackError);
        }
      });
      this.operations = [];
      this.rollbackOperations = [];
      throw error;
    }
  }

  addOperation(operation: () => void, rollback: () => void): void {
    this.operations.push(operation);
    this.rollbackOperations.push(rollback);
  }
}

// Storage manager with caching and batching
export class StorageManager {
  private cache = new Map<string, any>();
  private dirtyKeys = new Set<string>();
  private flushTimeout: NodeJS.Timeout | null = null;
  private provider: IStorageProvider;
  
  constructor(provider: IStorageProvider) {
    this.provider = provider;
  }

  get<T>(key: string): T[] {
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      return Array.isArray(cached) ? [...cached] : []; // Return mutable copy
    }

    try {
      const data = this.provider.getItem(key);
      const parsed = data ? JSON.parse(data) : [];
      const result = Array.isArray(parsed) ? parsed : [];
      this.cache.set(key, result);
      return [...result]; // Return mutable copy
    } catch (error) {
      console.error(`[StorageManager] Error parsing data from storage (${key}):`, error);
      return [];
    }
  }

  set<T>(key: string, value: T[]): void {
    // Ensure we're storing a proper array
    const arrayValue = Array.isArray(value) ? [...value] : [];
    this.cache.set(key, arrayValue);
    this.dirtyKeys.add(key);
    this.schedulePersist();
  }

  private schedulePersist(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 100); // Batch writes with 100ms delay
  }

  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    this.dirtyKeys.forEach(key => {
      try {
        const value = this.cache.get(key);
        this.provider.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error persisting data to storage (${key}):`, error);
      }
    });
    
    this.dirtyKeys.clear();
  }

  clear(): void {
    this.cache.clear();
    this.dirtyKeys.clear();
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.provider.clear();
  }
}

// Singleton instances
export const storageProvider = new LocalStorageProvider();
export const storageManager = new StorageManager(storageProvider);
