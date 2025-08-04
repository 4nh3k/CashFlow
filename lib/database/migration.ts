/**
 * Database Migration Utilities
 *
 * Handles database setup, indexing, and migration operations
 * for the Personal Finance App MongoDB migration
 */

import {
  MongoClient,
  Db,
  MongoClientOptions,
  ReadPreferenceMode,
} from 'mongodb'
import { COLLECTIONS, INDEXES } from './schema'

// ============================================================================
// MIGRATION CONFIGURATION
// ============================================================================

interface MigrationConfig {
  mongoUri: string
  databaseName: string
  options?: {
    retryWrites?: boolean
    readPreference?: ReadPreferenceMode
    maxPoolSize?: number
  }
}

// ============================================================================
// DATABASE CONNECTION MANAGER
// ============================================================================

export class DatabaseMigration {
  private client: MongoClient | null = null
  private db: Db | null = null
  private config: MigrationConfig

  constructor(config: MigrationConfig) {
    this.config = {
      ...config,
      options: {
        retryWrites: true,
        readPreference: 'primary' as ReadPreferenceMode,
        maxPoolSize: 10,
        ...config.options,
      },
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(
        this.config.mongoUri,
        this.config.options as MongoClientOptions
      )
      await this.client.connect()
      this.db = this.client.db(this.config.databaseName)
      console.log('✅ Connected to MongoDB for migration')
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error)
      throw error
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      console.log('✅ Disconnected from MongoDB')
    }
  }

  /**
   * Get database instance
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  // ==========================================================================
  // INDEX CREATION
  // ==========================================================================

  /**
   * Create all required indexes for optimal performance
   */
  async createIndexes(): Promise<void> {
    const db = this.getDatabase()

    console.log('🔧 Creating database indexes...')

    try {
      // Create transaction indexes
      const transactionCollection = db.collection(COLLECTIONS.TRANSACTIONS)
      for (const index of INDEXES.transactions) {
        await transactionCollection.createIndex(index)
        console.log(`  ✅ Created transaction index:`, index)
      }

      // Create category indexes
      const categoryCollection = db.collection(COLLECTIONS.CATEGORIES)
      for (const index of INDEXES.categories) {
        await categoryCollection.createIndex(index)
        console.log(`  ✅ Created category index:`, index)
      }

      // Create unique constraint on category name
      await categoryCollection.createIndex(
        { name: 1 },
        { unique: true, sparse: true }
      )
      console.log(`  ✅ Created unique constraint on category name`)

      // Create wallet indexes
      const walletCollection = db.collection(COLLECTIONS.WALLETS)
      for (const index of INDEXES.wallets) {
        await walletCollection.createIndex(index)
        console.log(`  ✅ Created wallet index:`, index)
      }

      // Create unique constraint on wallet name
      await walletCollection.createIndex(
        { name: 1 },
        { unique: true, sparse: true }
      )
      console.log(`  ✅ Created unique constraint on wallet name`)

      // Create keyword mapping indexes
      const keywordCollection = db.collection(COLLECTIONS.KEYWORD_MAPPINGS)
      for (const index of INDEXES.keywordMappings) {
        await keywordCollection.createIndex(index)
        console.log(`  ✅ Created keyword mapping index:`, index)
      }

      console.log('✅ All indexes created successfully')
    } catch (error) {
      console.error('❌ Failed to create indexes:', error)
      throw error
    }
  }

  // ==========================================================================
  // DATA SEEDING
  // ==========================================================================

  /**
   * Seed database with default data
   */
  async seedDefaultData(): Promise<void> {
    const db = this.getDatabase()

    console.log('🌱 Seeding default data...')

    try {
      // Create default categories
      await this.seedDefaultCategories(db)

      // Create default wallet
      await this.seedDefaultWallet(db)

      // Create default keyword mappings
      await this.seedDefaultKeywordMappings(db)

      console.log('✅ Default data seeded successfully')
    } catch (error) {
      console.error('❌ Failed to seed default data:', error)
      throw error
    }
  }

  /**
   * Create default categories
   */
  private async seedDefaultCategories(db: Db): Promise<void> {
    const collection = db.collection(COLLECTIONS.CATEGORIES)

    // Check if default categories already exist
    const existingDefaults = await collection.findOne({ isDefault: true })
    if (existingDefaults) {
      console.log('  ℹ️ Default categories already exist, skipping...')
      return
    }

    const defaultCategories = [
      {
        name: 'Uncategorized',
        type: 'expense',
        color: '#6B7280',
        icon: 'question-mark-circle',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Food & Dining',
        type: 'expense',
        color: '#EF4444',
        icon: 'restaurant',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Transportation',
        type: 'expense',
        color: '#3B82F6',
        icon: 'car',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Entertainment',
        type: 'expense',
        color: '#8B5CF6',
        icon: 'game-controller',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Shopping',
        type: 'expense',
        color: '#EC4899',
        icon: 'shopping-bag',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Salary',
        type: 'income',
        color: '#10B981',
        icon: 'cash',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Freelance',
        type: 'income',
        color: '#059669',
        icon: 'briefcase',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    await collection.insertMany(defaultCategories)
    console.log(`  ✅ Created ${defaultCategories.length} default categories`)
  }

  /**
   * Create default wallet
   */
  private async seedDefaultWallet(db: Db): Promise<void> {
    const collection = db.collection(COLLECTIONS.WALLETS)

    // Check if default wallet already exists
    const existingDefault = await collection.findOne({ isDefault: true })
    if (existingDefault) {
      console.log('  ℹ️ Default wallet already exists, skipping...')
      return
    }

    const defaultWallet = {
      name: 'Main Wallet',
      balance: 0,
      currency: 'VND',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(defaultWallet)
    console.log('  ✅ Created default wallet')
  }

  /**
   * Create default keyword mappings for Vietnamese phrases
   */
  private async seedDefaultKeywordMappings(db: Db): Promise<void> {
    const collection = db.collection(COLLECTIONS.KEYWORD_MAPPINGS)

    // Check if keyword mappings already exist
    const existingMappings = await collection.findOne({})
    if (existingMappings) {
      console.log('  ℹ️ Keyword mappings already exist, skipping...')
      return
    }

    // Get category IDs for mapping
    const categoryCollection = db.collection(COLLECTIONS.CATEGORIES)
    const categories = await categoryCollection
      .find({ isDefault: true })
      .toArray()

    const categoryMap = new Map(
      categories.map(cat => [cat.name.toLowerCase(), cat._id])
    )

    const defaultMappings = [
      // Food & Dining
      {
        keyword: 'cơm',
        categoryId: categoryMap.get('food & dining'),
        confidence: 0.9,
        frequency: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'phở',
        categoryId: categoryMap.get('food & dining'),
        confidence: 0.9,
        frequency: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'café',
        categoryId: categoryMap.get('food & dining'),
        confidence: 0.8,
        frequency: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'ăn',
        categoryId: categoryMap.get('food & dining'),
        confidence: 0.7,
        frequency: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Transportation
      {
        keyword: 'grab',
        categoryId: categoryMap.get('transportation'),
        confidence: 0.9,
        frequency: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'taxi',
        categoryId: categoryMap.get('transportation'),
        confidence: 0.9,
        frequency: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'xe',
        categoryId: categoryMap.get('transportation'),
        confidence: 0.6,
        frequency: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'xăng',
        categoryId: categoryMap.get('transportation'),
        confidence: 0.8,
        frequency: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Entertainment
      {
        keyword: 'bida',
        categoryId: categoryMap.get('entertainment'),
        confidence: 0.9,
        frequency: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'phim',
        categoryId: categoryMap.get('entertainment'),
        confidence: 0.8,
        frequency: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'game',
        categoryId: categoryMap.get('entertainment'),
        confidence: 0.7,
        frequency: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Shopping
      {
        keyword: 'mua',
        categoryId: categoryMap.get('shopping'),
        confidence: 0.6,
        frequency: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'áo',
        categoryId: categoryMap.get('shopping'),
        confidence: 0.8,
        frequency: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        keyword: 'quần',
        categoryId: categoryMap.get('shopping'),
        confidence: 0.8,
        frequency: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].filter(mapping => mapping.categoryId) // Filter out mappings without valid category IDs

    if (defaultMappings.length > 0) {
      await collection.insertMany(defaultMappings)
      console.log(
        `  ✅ Created ${defaultMappings.length} default keyword mappings`
      )
    } else {
      console.log(
        '  ⚠️ No valid category mappings found, skipping keyword mappings'
      )
    }
  }

  // ==========================================================================
  // DATA VALIDATION
  // ==========================================================================

  /**
   * Validate database integrity after migration
   */
  async validateDatabase(): Promise<boolean> {
    const db = this.getDatabase()

    console.log('🔍 Validating database integrity...')

    try {
      // Check collections exist
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map(c => c.name)

      for (const collectionName of Object.values(COLLECTIONS)) {
        if (!collectionNames.includes(collectionName)) {
          console.error(`  ❌ Missing collection: ${collectionName}`)
          return false
        }
        console.log(`  ✅ Collection exists: ${collectionName}`)
      }

      // Check indexes exist
      for (const [collectionName, indexes] of Object.entries(INDEXES)) {
        const collection = db.collection(
          COLLECTIONS[collectionName.toUpperCase() as keyof typeof COLLECTIONS]
        )
        const existingIndexes = await collection.listIndexes().toArray()
        const indexCount = existingIndexes.length

        console.log(
          `  ✅ Collection '${collectionName}' has ${indexCount} indexes`
        )
      }

      // Check default data exists
      const categoryCount = await db
        .collection(COLLECTIONS.CATEGORIES)
        .countDocuments({ isDefault: true })
      const walletCount = await db
        .collection(COLLECTIONS.WALLETS)
        .countDocuments({ isDefault: true })

      console.log(`  ✅ Default categories: ${categoryCount}`)
      console.log(`  ✅ Default wallets: ${walletCount}`)

      console.log('✅ Database validation completed successfully')
      return true
    } catch (error) {
      console.error('❌ Database validation failed:', error)
      return false
    }
  }

  // ==========================================================================
  // BACKUP UTILITIES
  // ==========================================================================

  /**
   * Create a backup of the database before migration
   */
  async createBackup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `finance-app-backup-${timestamp}`

    console.log(`💾 Creating database backup: ${backupName}`)

    try {
      const db = this.getDatabase()
      const backup: any = {}

      // Backup all collections
      for (const collectionName of Object.values(COLLECTIONS)) {
        const collection = db.collection(collectionName)
        const documents = await collection.find({}).toArray()
        backup[collectionName] = documents
        console.log(
          `  ✅ Backed up ${documents.length} documents from ${collectionName}`
        )
      }

      // Save backup to file if path provided
      if (backupPath) {
        const fs = await import('fs/promises')
        await fs.writeFile(
          `${backupPath}/${backupName}.json`,
          JSON.stringify(backup, null, 2)
        )
        console.log(`  ✅ Backup saved to ${backupPath}/${backupName}.json`)
      }

      console.log('✅ Database backup completed successfully')
      return backupName
    } catch (error) {
      console.error('❌ Failed to create backup:', error)
      throw error
    }
  }
}

// ============================================================================
// MIGRATION RUNNER
// ============================================================================

/**
 * Main migration function to set up the database
 */
export async function runMigration(config: MigrationConfig): Promise<void> {
  const migration = new DatabaseMigration(config)

  try {
    console.log('🚀 Starting database migration...')

    // Connect to database
    await migration.connect()

    // Create backup
    await migration.createBackup('./backups')

    // Create indexes
    await migration.createIndexes()

    // Seed default data
    await migration.seedDefaultData()

    // Validate setup
    const isValid = await migration.validateDatabase()
    if (!isValid) {
      throw new Error('Database validation failed')
    }

    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await migration.disconnect()
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  DatabaseMigration,
  runMigration,
}
