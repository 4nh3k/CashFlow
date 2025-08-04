/**
 * MongoDB Schema Definitions for Personal Finance App
 *
 * This file defines the optimized MongoDB schema for Next.js native driver
 * Migrated from MongoDB Realm to improve performance and maintainability
 */

import { ObjectId } from 'mongodb'

// ============================================================================
// CORE ENTITY SCHEMAS
// ============================================================================

/**
 * Transaction Document Schema
 * Optimized with indexes for common queries (date, category, wallet)
 */
export interface TransactionDocument {
  _id: ObjectId
  amount: number
  description: string
  date: Date
  type: 'income' | 'expense'
  categoryId: ObjectId
  walletId: ObjectId
  userId?: ObjectId // For future multi-user support

  // Metadata for audit and sync
  createdAt: Date
  updatedAt: Date
  version: number // For optimistic locking
}

/**
 * Category Document Schema
 * Simple structure with efficient unique name constraints
 */
export interface CategoryDocument {
  _id: ObjectId
  name: string // Unique within user scope
  type: 'income' | 'expense'
  color?: string // For UI customization
  icon?: string // For UI customization
  userId?: ObjectId // For future multi-user support

  // Metadata
  createdAt: Date
  updatedAt: Date
  isDefault: boolean // For system categories like "Uncategorized"
}

/**
 * Wallet Document Schema
 * Track balances with transaction history for audit
 */
export interface WalletDocument {
  _id: ObjectId
  name: string // Unique within user scope
  balance: number
  currency: string // Default: 'VND'
  userId?: ObjectId // For future multi-user support

  // Metadata
  createdAt: Date
  updatedAt: Date
  isDefault: boolean // For default wallet selection
}

/**
 * Keyword Mapping Document Schema
 * For LLM integration - map Vietnamese phrases to categories
 */
export interface KeywordMappingDocument {
  _id: ObjectId
  keyword: string // e.g., "bida", "coffee", "taxi"
  categoryId: ObjectId
  userId?: ObjectId // For future multi-user support

  // AI/ML metadata
  confidence: number // 0-1 score for automatic suggestions
  frequency: number // How often this mapping is used

  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Budget Document Schema (Future Implementation)
 * Currently disabled due to infinite loop issues
 */
export interface BudgetDocument {
  _id: ObjectId
  name: string
  amount: number
  period: 'weekly' | 'monthly' | 'yearly'
  categoryIds: ObjectId[] // Can span multiple categories
  walletIds?: ObjectId[] // Optional wallet restriction
  userId?: ObjectId // For future multi-user support

  // Tracking
  spent: number // Current spending against budget
  startDate: Date
  endDate: Date

  // Metadata
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// ============================================================================
// COLLECTION NAMES
// ============================================================================

export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  WALLETS: 'wallets',
  KEYWORD_MAPPINGS: 'keywordMappings',
  BUDGETS: 'budgets', // Future implementation
  USERS: 'users', // Future multi-user support
} as const

// ============================================================================
// INDEX DEFINITIONS
// ============================================================================

/**
 * Database indexes for optimal query performance
 * These will be created during migration setup
 */
export const INDEXES = {
  // Transaction indexes for common query patterns
  transactions: [
    { date: -1 }, // Most recent transactions first
    { categoryId: 1, date: -1 }, // Category-based filtering
    { walletId: 1, date: -1 }, // Wallet-based filtering
    { type: 1, date: -1 }, // Income/expense filtering
    { userId: 1, date: -1 }, // User-scoped queries (future)
    { createdAt: 1 }, // For audit and sync

    // Compound indexes for dashboard queries
    { userId: 1, date: -1, type: 1 }, // User dashboard summary
    { categoryId: 1, date: -1, type: 1 }, // Category analysis
    { walletId: 1, type: 1 }, // Wallet balance calculations
  ],

  // Category indexes
  categories: [
    { name: 1 }, // Unique constraint will be applied
    { type: 1 }, // Filter by income/expense
    { userId: 1, name: 1 }, // User-scoped unique names (future)
    { isDefault: 1 }, // System categories
  ],

  // Wallet indexes
  wallets: [
    { name: 1 }, // Unique constraint will be applied
    { userId: 1, name: 1 }, // User-scoped unique names (future)
    { isDefault: 1 }, // Default wallet selection
  ],

  // Keyword mapping indexes
  keywordMappings: [
    { keyword: 1 }, // Fast keyword lookup
    { categoryId: 1 }, // Category-based queries
    { userId: 1, keyword: 1 }, // User-scoped mappings (future)
    { frequency: -1 }, // Most popular mappings
    { confidence: -1 }, // High-confidence suggestions
  ],

  // Budget indexes (future)
  budgets: [
    { userId: 1, isActive: 1 }, // Active user budgets
    { categoryIds: 1 }, // Category-based budget queries
    { startDate: 1, endDate: 1 }, // Date range queries
  ],
} as const

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schemas for runtime validation
 * These complement the TypeScript interfaces
 */
export const ValidationSchemas = {
  transaction: {
    amount: { type: 'number', minimum: 0 },
    description: { type: 'string', maxLength: 500 },
    date: { type: 'date' },
    type: { type: 'string', enum: ['income', 'expense'] },
    categoryId: { type: 'objectId' },
    walletId: { type: 'objectId' },
  },

  category: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    type: { type: 'string', enum: ['income', 'expense'] },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', optional: true },
    icon: { type: 'string', maxLength: 50, optional: true },
  },

  wallet: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    balance: { type: 'number' },
    currency: { type: 'string', default: 'VND' },
  },

  keywordMapping: {
    keyword: { type: 'string', minLength: 1, maxLength: 100 },
    categoryId: { type: 'objectId' },
    confidence: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
    frequency: { type: 'number', minimum: 0, default: 1 },
  },
} as const

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Data transformation utilities for migrating from MongoDB Realm
 */
export const MigrationHelpers = {
  /**
   * Convert Realm ObjectId string to MongoDB ObjectId
   */
  convertObjectId: (realmId: string): ObjectId => {
    return new ObjectId(realmId)
  },

  /**
   * Add required metadata fields to existing documents
   */
  addMetadata: (doc: any): any => {
    const now = new Date()
    return {
      ...doc,
      createdAt: doc.createdAt || now,
      updatedAt: now,
      version: doc.version || 1,
    }
  },

  /**
   * Ensure required fields exist with defaults
   */
  ensureDefaults: {
    category: (doc: any): Partial<CategoryDocument> => ({
      ...doc,
      isDefault: doc.isDefault || false,
      color: doc.color || '#6B7280',
      icon: doc.icon || 'tag',
    }),

    wallet: (doc: any): Partial<WalletDocument> => ({
      ...doc,
      currency: doc.currency || 'VND',
      isDefault: doc.isDefault || false,
    }),

    keywordMapping: (doc: any): Partial<KeywordMappingDocument> => ({
      ...doc,
      confidence: doc.confidence || 0.5,
      frequency: doc.frequency || 1,
    }),
  },
} as const

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Pre-built query patterns for common operations
 */
export const QueryBuilders = {
  transactions: {
    byDateRange: (startDate: Date, endDate: Date) => ({
      date: { $gte: startDate, $lte: endDate },
    }),

    byCategory: (categoryId: ObjectId) => ({
      categoryId: categoryId,
    }),

    byWallet: (walletId: ObjectId) => ({
      walletId: walletId,
    }),

    byType: (type: 'income' | 'expense') => ({
      type: type,
    }),

    recentFirst: () => ({
      sort: { date: -1, createdAt: -1 },
    }),
  },

  categories: {
    byType: (type: 'income' | 'expense') => ({
      type: type,
    }),

    defaults: () => ({
      isDefault: true,
    }),
  },

  wallets: {
    defaults: () => ({
      isDefault: true,
    }),
  },

  keywordMappings: {
    byKeyword: (keyword: string) => ({
      keyword: { $regex: new RegExp(keyword, 'i') },
    }),

    byPopularity: () => ({
      sort: { frequency: -1, confidence: -1 },
    }),
  },
} as const

export default {
  COLLECTIONS,
  INDEXES,
  ValidationSchemas,
  MigrationHelpers,
  QueryBuilders,
}
