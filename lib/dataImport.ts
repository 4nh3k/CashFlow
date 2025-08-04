// Data import utility for migrating data to Next.js + MongoDB Native Driver
import clientPromise from '@/lib/mongodb'

// Type definitions for the import utility
export interface ExportedData {
  metadata: {
    exportDate: string
    version: string
    totalRecords: number
    collections: {
      transactions: number
      categories: number
      wallets: number
      budgets: number
      keywordMappings: number
    }
  }
  data: {
    transactions: Transaction[]
    categories: Category[]
    wallets: Wallet[]
    budgets: Budget[]
    keywordMappings: KeywordMapping[]
  }
}

// Basic type definitions (simplified for migration)
interface Transaction {
  id: string
  amount: number
  description: string
  date: Date
  type: 'income' | 'expense'
  categoryId: string
  walletId: string
  status?: string
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: string
  name: string
  defaultType: 'income' | 'expense'
  color?: string
  icon?: string
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

interface Wallet {
  id: string
  name: string
  balance: number
  currency?: string
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

interface Budget {
  id: string
  categoryId: string | null
  amount: number
  period: 'monthly' | 'weekly' | 'custom'
  startDate: string
  endDate?: string
  spent?: number
  remaining?: number
  percentage?: number
  isOverBudget?: boolean
  alertTriggered?: boolean
  createdAt: Date
  updatedAt: Date
}

interface KeywordMapping {
  id: string
  keyword: string
  categoryId: string
  createdAt: Date
  updatedAt: Date
}

export interface ImportProgress {
  step: string
  progress: number
  total: number
  completed: boolean
  error?: string
  recordsProcessed?: number
}

export interface ImportOptions {
  clearExistingData: boolean
  validateBeforeImport: boolean
  batchSize: number
  createIndexes: boolean
}

export interface ImportResult {
  success: boolean
  totalRecords: number
  processedRecords: number
  errors: string[]
  collections: {
    transactions: number
    categories: number
    wallets: number
    budgets: number
    keywordMappings: number
  }
}

export class DataImportService {
  private progressCallback?: (progress: ImportProgress) => void

  constructor(progressCallback?: (progress: ImportProgress) => void) {
    this.progressCallback = progressCallback
  }

  private updateProgress(
    step: string,
    progress: number,
    total: number,
    recordsProcessed?: number,
    error?: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({
        step,
        progress,
        total,
        completed: progress >= total,
        recordsProcessed,
        error,
      })
    }
  }

  async importData(
    data: ExportedData,
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRecords: data.metadata.totalRecords,
      processedRecords: 0,
      errors: [],
      collections: {
        transactions: 0,
        categories: 0,
        wallets: 0,
        budgets: 0,
        keywordMappings: 0,
      },
    }

    const totalSteps = 7
    let currentStep = 0

    try {
      this.updateProgress('Connecting to database...', currentStep, totalSteps)
      const client = await clientPromise
      const db = client.db('personal-finance')

      // Step 1: Clear existing data if requested
      if (options.clearExistingData) {
        currentStep++
        this.updateProgress(
          'Clearing existing data...',
          currentStep,
          totalSteps
        )
        await this.clearExistingData(db)
      }

      // Step 2: Create database indexes
      if (options.createIndexes) {
        currentStep++
        this.updateProgress(
          'Creating database indexes...',
          currentStep,
          totalSteps
        )
        await this.createIndexes(db)
      }

      // Step 3: Import categories first (other collections depend on them)
      currentStep++
      this.updateProgress('Importing categories...', currentStep, totalSteps)
      const categoriesResult = await this.importCategories(
        db,
        data.data.categories,
        options.batchSize
      )
      result.collections.categories = categoriesResult.imported
      result.processedRecords += categoriesResult.imported
      result.errors.push(...categoriesResult.errors)

      // Step 4: Import wallets
      currentStep++
      this.updateProgress('Importing wallets...', currentStep, totalSteps)
      const walletsResult = await this.importWallets(
        db,
        data.data.wallets,
        options.batchSize
      )
      result.collections.wallets = walletsResult.imported
      result.processedRecords += walletsResult.imported
      result.errors.push(...walletsResult.errors)

      // Step 5: Import transactions (depends on categories and wallets)
      currentStep++
      this.updateProgress('Importing transactions...', currentStep, totalSteps)
      const transactionsResult = await this.importTransactions(
        db,
        data.data.transactions,
        options.batchSize
      )
      result.collections.transactions = transactionsResult.imported
      result.processedRecords += transactionsResult.imported
      result.errors.push(...transactionsResult.errors)

      // Step 6: Import budgets (depends on categories)
      currentStep++
      this.updateProgress('Importing budgets...', currentStep, totalSteps)
      const budgetsResult = await this.importBudgets(
        db,
        data.data.budgets,
        options.batchSize
      )
      result.collections.budgets = budgetsResult.imported
      result.processedRecords += budgetsResult.imported
      result.errors.push(...budgetsResult.errors)

      // Step 7: Import keyword mappings (depends on categories)
      currentStep++
      this.updateProgress(
        'Importing keyword mappings...',
        currentStep,
        totalSteps
      )
      const keywordMappingsResult = await this.importKeywordMappings(
        db,
        data.data.keywordMappings,
        options.batchSize
      )
      result.collections.keywordMappings = keywordMappingsResult.imported
      result.processedRecords += keywordMappingsResult.imported
      result.errors.push(...keywordMappingsResult.errors)

      result.success = result.errors.length === 0
      this.updateProgress(
        'Import completed!',
        totalSteps,
        totalSteps,
        result.processedRecords
      )

      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      result.errors.push(`Import failed: ${errorMessage}`)
      this.updateProgress(
        'Import failed',
        currentStep,
        totalSteps,
        result.processedRecords,
        errorMessage
      )

      return result
    }
  }

  private async clearExistingData(db: any): Promise<void> {
    const collections = [
      'transactions',
      'categories',
      'wallets',
      'budgets',
      'keywordMappings',
    ]

    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).deleteMany({})
      } catch (error) {
        // Collection might not exist, that's okay
        console.log(
          `Collection ${collectionName} does not exist or could not be cleared`
        )
      }
    }
  }

  private async createIndexes(db: any): Promise<void> {
    try {
      // Transactions indexes
      await db.collection('transactions').createIndex({ date: -1 })
      await db.collection('transactions').createIndex({ categoryId: 1 })
      await db.collection('transactions').createIndex({ walletId: 1 })
      await db.collection('transactions').createIndex({ type: 1 })
      await db.collection('transactions').createIndex({ amount: -1 })

      // Categories indexes
      await db
        .collection('categories')
        .createIndex({ name: 1 }, { unique: true })
      await db.collection('categories').createIndex({ defaultType: 1 })

      // Wallets indexes
      await db.collection('wallets').createIndex({ name: 1 })
      await db.collection('wallets').createIndex({ isDefault: 1 })

      // Budgets indexes
      await db.collection('budgets').createIndex({ categoryId: 1 })
      await db.collection('budgets').createIndex({ period: 1 })
      await db.collection('budgets').createIndex({ startDate: 1, endDate: 1 })

      // Keyword mappings indexes
      await db
        .collection('keywordMappings')
        .createIndex({ keyword: 1 }, { unique: true })
      await db.collection('keywordMappings').createIndex({ categoryId: 1 })
    } catch (error) {
      console.warn('Some indexes could not be created:', error)
    }
  }

  private async importCategories(
    db: any,
    categories: Category[],
    batchSize: number
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const collection = db.collection('categories')

      // Process in batches
      for (let i = 0; i < categories.length; i += batchSize) {
        const batch = categories.slice(i, i + batchSize)

        const mappedCategories = batch.map(category => ({
          _id: category.id,
          name: category.name,
          defaultType: category.defaultType,
          color: category.color || '#6B7280',
          icon: category.icon || 'tag',
          isDefault: category.isDefault || false,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }))

        try {
          const result = await collection.insertMany(mappedCategories, {
            ordered: false,
          })
          imported += result.insertedCount
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate key error - handle individually
            for (const category of mappedCategories) {
              try {
                await collection.insertOne(category)
                imported++
              } catch (individualError: any) {
                if (individualError.code !== 11000) {
                  errors.push(
                    `Failed to import category ${category.name}: ${individualError.message}`
                  )
                }
              }
            }
          } else {
            errors.push(`Batch import failed for categories: ${error.message}`)
          }
        }
      }
    } catch (error) {
      errors.push(
        `Category import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return { imported, errors }
  }

  private async importWallets(
    db: any,
    wallets: Wallet[],
    batchSize: number
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const collection = db.collection('wallets')

      for (let i = 0; i < wallets.length; i += batchSize) {
        const batch = wallets.slice(i, i + batchSize)

        const mappedWallets = batch.map(wallet => ({
          _id: wallet.id,
          name: wallet.name,
          balance: wallet.balance,
          currency: wallet.currency || 'VND',
          isDefault: wallet.isDefault || false,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        }))

        try {
          const result = await collection.insertMany(mappedWallets, {
            ordered: false,
          })
          imported += result.insertedCount
        } catch (error: any) {
          if (error.code === 11000) {
            for (const wallet of mappedWallets) {
              try {
                await collection.insertOne(wallet)
                imported++
              } catch (individualError: any) {
                if (individualError.code !== 11000) {
                  errors.push(
                    `Failed to import wallet ${wallet.name}: ${individualError.message}`
                  )
                }
              }
            }
          } else {
            errors.push(`Batch import failed for wallets: ${error.message}`)
          }
        }
      }
    } catch (error) {
      errors.push(
        `Wallet import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return { imported, errors }
  }

  private async importTransactions(
    db: any,
    transactions: Transaction[],
    batchSize: number
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const collection = db.collection('transactions')

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)

        const mappedTransactions = batch.map(transaction => ({
          _id: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          type: transaction.type,
          categoryId: transaction.categoryId,
          walletId: transaction.walletId,
          status: transaction.status || 'completed',
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        }))

        try {
          const result = await collection.insertMany(mappedTransactions, {
            ordered: false,
          })
          imported += result.insertedCount
        } catch (error: any) {
          if (error.code === 11000) {
            for (const transaction of mappedTransactions) {
              try {
                await collection.insertOne(transaction)
                imported++
              } catch (individualError: any) {
                if (individualError.code !== 11000) {
                  errors.push(
                    `Failed to import transaction ${transaction._id}: ${individualError.message}`
                  )
                }
              }
            }
          } else {
            errors.push(
              `Batch import failed for transactions: ${error.message}`
            )
          }
        }
      }
    } catch (error) {
      errors.push(
        `Transaction import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return { imported, errors }
  }

  private async importBudgets(
    db: any,
    budgets: Budget[],
    batchSize: number
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const collection = db.collection('budgets')

      for (let i = 0; i < budgets.length; i += batchSize) {
        const batch = budgets.slice(i, i + batchSize)

        const mappedBudgets = batch.map(budget => ({
          _id: budget.id,
          categoryId: budget.categoryId,
          amount: budget.amount,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          spent: budget.spent || 0,
          remaining: budget.remaining || budget.amount,
          percentage: budget.percentage || 0,
          isOverBudget: budget.isOverBudget || false,
          alertTriggered: budget.alertTriggered || false,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        }))

        try {
          const result = await collection.insertMany(mappedBudgets, {
            ordered: false,
          })
          imported += result.insertedCount
        } catch (error: any) {
          if (error.code === 11000) {
            for (const budget of mappedBudgets) {
              try {
                await collection.insertOne(budget)
                imported++
              } catch (individualError: any) {
                if (individualError.code !== 11000) {
                  errors.push(
                    `Failed to import budget ${budget._id}: ${individualError.message}`
                  )
                }
              }
            }
          } else {
            errors.push(`Batch import failed for budgets: ${error.message}`)
          }
        }
      }
    } catch (error) {
      errors.push(
        `Budget import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return { imported, errors }
  }

  private async importKeywordMappings(
    db: any,
    mappings: KeywordMapping[],
    batchSize: number
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const collection = db.collection('keywordMappings')

      for (let i = 0; i < mappings.length; i += batchSize) {
        const batch = mappings.slice(i, i + batchSize)

        const mappedMappings = batch.map(mapping => ({
          _id: mapping.id,
          keyword: mapping.keyword,
          categoryId: mapping.categoryId,
          createdAt: mapping.createdAt,
          updatedAt: mapping.updatedAt,
        }))

        try {
          const result = await collection.insertMany(mappedMappings, {
            ordered: false,
          })
          imported += result.insertedCount
        } catch (error: any) {
          if (error.code === 11000) {
            for (const mapping of mappedMappings) {
              try {
                await collection.insertOne(mapping)
                imported++
              } catch (individualError: any) {
                if (individualError.code !== 11000) {
                  errors.push(
                    `Failed to import keyword mapping ${mapping.keyword}: ${individualError.message}`
                  )
                }
              }
            }
          } else {
            errors.push(
              `Batch import failed for keyword mappings: ${error.message}`
            )
          }
        }
      }
    } catch (error) {
      errors.push(
        `Keyword mapping import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return { imported, errors }
  }

  async verifyImport(
    expectedData: ExportedData
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const client = await clientPromise
      const db = client.db('personal-finance')

      // Verify collection counts
      const collections = [
        'transactions',
        'categories',
        'wallets',
        'budgets',
        'keywordMappings',
      ]

      for (const collectionName of collections) {
        const count = await db.collection(collectionName).countDocuments()
        const expectedCount =
          expectedData.metadata.collections[
            collectionName as keyof typeof expectedData.metadata.collections
          ]

        if (count !== expectedCount) {
          errors.push(
            `${collectionName}: expected ${expectedCount}, found ${count}`
          )
        }
      }

      // Verify some sample records exist
      const sampleTransaction = await db.collection('transactions').findOne()
      if (!sampleTransaction && expectedData.data.transactions.length > 0) {
        errors.push('No transactions found in database')
      }

      const sampleCategory = await db.collection('categories').findOne()
      if (!sampleCategory && expectedData.data.categories.length > 0) {
        errors.push('No categories found in database')
      }
    } catch (error) {
      errors.push(
        `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Export singleton instance
export const dataImportService = new DataImportService()
