/**
 * Database Backup and Recovery Procedures
 *
 * Implements comprehensive backup, restore, and disaster recovery
 * for the Personal Finance App MongoDB database
 */

import { MongoClient, Db } from 'mongodb'
import { COLLECTIONS } from './schema'
import { DatabaseMigration } from './migration'
import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// BACKUP CONFIGURATION
// ============================================================================

interface BackupConfig {
  mongoUri: string
  databaseName: string
  backupDirectory: string
  compressionEnabled?: boolean
  encryptionEnabled?: boolean
  retentionDays?: number
}

interface BackupMetadata {
  timestamp: string
  databaseName: string
  version: string
  documentCounts: Record<string, number>
  size: number
  checksum?: string
}

// ============================================================================
// BACKUP MANAGER
// ============================================================================

export class BackupManager {
  private config: BackupConfig
  private client: MongoClient | null = null
  private db: Db | null = null

  constructor(config: BackupConfig) {
    this.config = {
      compressionEnabled: true,
      encryptionEnabled: false,
      retentionDays: 30,
      ...config,
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.config.mongoUri)
      await this.client.connect()
      this.db = this.client.db(this.config.databaseName)
      console.log('✅ Connected to MongoDB for backup operations')
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

  // ==========================================================================
  // BACKUP OPERATIONS
  // ==========================================================================

  /**
   * Create a full database backup
   */
  async createFullBackup(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `full-backup-${timestamp}`
    const backupPath = path.join(this.config.backupDirectory, backupId)

    console.log(`💾 Creating full backup: ${backupId}`)

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupPath, { recursive: true })

      const backup: any = {}
      const documentCounts: Record<string, number> = {}
      let totalSize = 0

      // Backup all collections
      for (const collectionName of Object.values(COLLECTIONS)) {
        console.log(`  📦 Backing up collection: ${collectionName}`)

        const collection = this.db.collection(collectionName)
        const documents = await collection.find({}).toArray()

        backup[collectionName] = documents
        documentCounts[collectionName] = documents.length

        // Calculate size
        const collectionSize = JSON.stringify(documents).length
        totalSize += collectionSize

        console.log(
          `    ✅ ${documents.length} documents (${this.formatBytes(collectionSize)})`
        )
      }

      // Save backup data
      const backupData = JSON.stringify(backup, null, 2)
      const backupFile = path.join(backupPath, 'data.json')
      await fs.writeFile(backupFile, backupData)

      // Create metadata
      const metadata: BackupMetadata = {
        timestamp,
        databaseName: this.config.databaseName,
        version: '1.0.0',
        documentCounts,
        size: totalSize,
        checksum: await this.calculateChecksum(backupData),
      }

      const metadataFile = path.join(backupPath, 'metadata.json')
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2))

      // Compress if enabled
      if (this.config.compressionEnabled) {
        await this.compressBackup(backupPath)
      }

      console.log(`✅ Full backup completed: ${this.formatBytes(totalSize)}`)
      console.log(`📁 Backup location: ${backupPath}`)

      return backupId
    } catch (error) {
      console.error('❌ Failed to create backup:', error)
      throw error
    }
  }

  /**
   * Create an incremental backup (based on timestamps)
   */
  async createIncrementalBackup(lastBackupTime: Date): Promise<string> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `incremental-backup-${timestamp}`
    const backupPath = path.join(this.config.backupDirectory, backupId)

    console.log(
      `📈 Creating incremental backup since: ${lastBackupTime.toISOString()}`
    )

    try {
      await fs.mkdir(backupPath, { recursive: true })

      const backup: any = {}
      const documentCounts: Record<string, number> = {}
      let totalSize = 0

      // Backup only changed documents
      for (const collectionName of Object.values(COLLECTIONS)) {
        console.log(`  📦 Backing up changes in: ${collectionName}`)

        const collection = this.db.collection(collectionName)

        // Find documents modified since last backup
        const changedDocuments = await collection
          .find({
            $or: [
              { updatedAt: { $gt: lastBackupTime } },
              { createdAt: { $gt: lastBackupTime } },
            ],
          })
          .toArray()

        if (changedDocuments.length > 0) {
          backup[collectionName] = changedDocuments
          documentCounts[collectionName] = changedDocuments.length

          const collectionSize = JSON.stringify(changedDocuments).length
          totalSize += collectionSize

          console.log(`    ✅ ${changedDocuments.length} changed documents`)
        } else {
          console.log(`    ℹ️ No changes in ${collectionName}`)
        }
      }

      // Save backup data
      const backupData = JSON.stringify(backup, null, 2)
      const backupFile = path.join(backupPath, 'data.json')
      await fs.writeFile(backupFile, backupData)

      // Create metadata
      const metadata: BackupMetadata = {
        timestamp,
        databaseName: this.config.databaseName,
        version: '1.0.0',
        documentCounts,
        size: totalSize,
        checksum: await this.calculateChecksum(backupData),
      }

      const metadataFile = path.join(backupPath, 'metadata.json')
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2))

      console.log(
        `✅ Incremental backup completed: ${this.formatBytes(totalSize)}`
      )
      return backupId
    } catch (error) {
      console.error('❌ Failed to create incremental backup:', error)
      throw error
    }
  }

  // ==========================================================================
  // RESTORE OPERATIONS
  // ==========================================================================

  /**
   * Restore database from backup
   */
  async restoreFromBackup(
    backupId: string,
    options: {
      dropExisting?: boolean
      validateData?: boolean
      dryRun?: boolean
    } = {}
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }

    const {
      dropExisting = false,
      validateData = true,
      dryRun = false,
    } = options
    const backupPath = path.join(this.config.backupDirectory, backupId)

    console.log(`🔄 Restoring from backup: ${backupId}`)
    if (dryRun) {
      console.log('🧪 DRY RUN MODE - No actual changes will be made')
    }

    try {
      // Load metadata
      const metadataFile = path.join(backupPath, 'metadata.json')
      const metadataContent = await fs.readFile(metadataFile, 'utf-8')
      const metadata: BackupMetadata = JSON.parse(metadataContent)

      console.log(`📊 Backup info:`)
      console.log(`   Database: ${metadata.databaseName}`)
      console.log(`   Timestamp: ${metadata.timestamp}`)
      console.log(`   Size: ${this.formatBytes(metadata.size)}`)

      // Load backup data
      const backupFile = path.join(backupPath, 'data.json')
      const backupContent = await fs.readFile(backupFile, 'utf-8')
      const backupData = JSON.parse(backupContent)

      // Validate checksum if available
      if (validateData && metadata.checksum) {
        const calculatedChecksum = await this.calculateChecksum(backupContent)
        if (calculatedChecksum !== metadata.checksum) {
          throw new Error('Backup integrity check failed - checksum mismatch')
        }
        console.log('✅ Backup integrity verified')
      }

      if (dryRun) {
        console.log('🧪 Dry run completed - backup is valid and restorable')
        return
      }

      // Drop existing collections if requested
      if (dropExisting) {
        console.log('🗑️ Dropping existing collections...')
        for (const collectionName of Object.values(COLLECTIONS)) {
          try {
            await this.db.collection(collectionName).drop()
            console.log(`   ✅ Dropped ${collectionName}`)
          } catch (error) {
            // Collection might not exist, which is fine
            console.log(`   ℹ️ Collection ${collectionName} did not exist`)
          }
        }
      }

      // Restore collections
      for (const [collectionName, documents] of Object.entries(backupData)) {
        if (documents && Array.isArray(documents) && documents.length > 0) {
          console.log(
            `📥 Restoring ${collectionName}: ${documents.length} documents`
          )

          const collection = this.db.collection(collectionName)

          if (dropExisting) {
            // Insert all documents
            await collection.insertMany(documents)
          } else {
            // Upsert documents (update existing, insert new)
            for (const doc of documents) {
              await collection.replaceOne({ _id: doc._id }, doc, {
                upsert: true,
              })
            }
          }

          console.log(`   ✅ Restored ${documents.length} documents`)
        }
      }

      console.log('✅ Database restore completed successfully')
    } catch (error) {
      console.error('❌ Failed to restore backup:', error)
      throw error
    }
  }

  // ==========================================================================
  // BACKUP MANAGEMENT
  // ==========================================================================

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backupDirs = await fs.readdir(this.config.backupDirectory)
      const backups: BackupMetadata[] = []

      for (const backupDir of backupDirs) {
        const metadataPath = path.join(
          this.config.backupDirectory,
          backupDir,
          'metadata.json'
        )

        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8')
          const metadata: BackupMetadata = JSON.parse(metadataContent)
          backups.push(metadata)
        } catch (error) {
          console.warn(`⚠️ Could not read metadata for backup: ${backupDir}`)
        }
      }

      return backups.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      console.error('❌ Failed to list backups:', error)
      throw error
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays!)

      console.log(
        `🧹 Cleaning up backups older than: ${cutoffDate.toISOString()}`
      )

      const backups = await this.listBackups()
      let deletedCount = 0

      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp)

        if (backupDate < cutoffDate) {
          const backupPath = path.join(
            this.config.backupDirectory,
            `*backup-${backup.timestamp}`
          )

          try {
            // Find the actual backup directory (handle different backup types)
            const backupDirs = await fs.readdir(this.config.backupDirectory)
            const targetDir = backupDirs.find(dir =>
              dir.includes(backup.timestamp)
            )

            if (targetDir) {
              const fullPath = path.join(this.config.backupDirectory, targetDir)
              await fs.rm(fullPath, { recursive: true })
              console.log(`   🗑️ Deleted old backup: ${targetDir}`)
              deletedCount++
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to delete backup: ${backup.timestamp}`,
              error
            )
          }
        }
      }

      console.log(`✅ Cleanup completed: ${deletedCount} old backups removed`)
    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error)
      throw error
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Calculate MD5 checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const crypto = await import('crypto')
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Compress backup directory (placeholder - would use actual compression library)
   */
  private async compressBackup(backupPath: string): Promise<void> {
    console.log(
      `🗜️ Compression enabled but not implemented yet for: ${backupPath}`
    )
    // TODO: Implement compression using a library like tar or zip
  }
}

// ============================================================================
// DISASTER RECOVERY PROCEDURES
// ============================================================================

export class DisasterRecovery {
  private backupManager: BackupManager

  constructor(config: BackupConfig) {
    this.backupManager = new BackupManager(config)
  }

  /**
   * Complete disaster recovery procedure
   */
  async performDisasterRecovery(
    options: {
      backupId?: string
      useLatestBackup?: boolean
      reinstallDatabase?: boolean
    } = {}
  ): Promise<void> {
    const {
      backupId,
      useLatestBackup = true,
      reinstallDatabase = false,
    } = options

    console.log('🚨 Starting disaster recovery procedure...')

    try {
      await this.backupManager.connect()

      // Get backup to restore
      let targetBackupId = backupId

      if (useLatestBackup && !targetBackupId) {
        const backups = await this.backupManager.listBackups()
        if (backups.length === 0) {
          throw new Error('No backups available for recovery')
        }

        // Find the latest full backup
        const latestFullBackup = backups.find(b =>
          b.timestamp.includes('full-backup')
        )
        if (!latestFullBackup) {
          throw new Error('No full backup available for recovery')
        }

        targetBackupId = `full-backup-${latestFullBackup.timestamp}`
        console.log(`📋 Using latest full backup: ${targetBackupId}`)
      }

      if (!targetBackupId) {
        throw new Error('No backup specified for recovery')
      }

      // Perform database restoration
      if (reinstallDatabase) {
        console.log('🔧 Reinstalling database schema...')
        // This would involve recreating indexes, etc.
        // For now, we'll just restore with drop existing
        await this.backupManager.restoreFromBackup(targetBackupId, {
          dropExisting: true,
          validateData: true,
        })
      } else {
        await this.backupManager.restoreFromBackup(targetBackupId, {
          dropExisting: false,
          validateData: true,
        })
      }

      console.log('✅ Disaster recovery completed successfully')
    } catch (error) {
      console.error('❌ Disaster recovery failed:', error)
      throw error
    } finally {
      await this.backupManager.disconnect()
    }
  }

  /**
   * Validate database integrity after recovery
   */
  async validateRecovery(): Promise<boolean> {
    try {
      await this.backupManager.connect()

      // Use the existing migration validation
      const migration = new DatabaseMigration({
        mongoUri: '', // Will use existing connection
        databaseName: '',
      })

      // Override the database connection
      ;(migration as any).db = (this.backupManager as any).db

      const isValid = await migration.validateDatabase()
      return isValid
    } catch (error) {
      console.error('❌ Recovery validation failed:', error)
      return false
    } finally {
      await this.backupManager.disconnect()
    }
  }
}

// ============================================================================
// BACKUP AUTOMATION
// ============================================================================

export class BackupScheduler {
  private backupManager: BackupManager
  private scheduleConfig: {
    fullBackupCron?: string
    incrementalBackupCron?: string
    enableScheduling?: boolean
  }

  constructor(config: BackupConfig, scheduleConfig = {}) {
    this.backupManager = new BackupManager(config)
    this.scheduleConfig = {
      fullBackupCron: '0 2 * * 0', // Weekly at 2 AM on Sunday
      incrementalBackupCron: '0 2 * * 1-6', // Daily at 2 AM, Monday-Saturday
      enableScheduling: false,
      ...scheduleConfig,
    }
  }

  /**
   * Start automated backup scheduling
   */
  async startScheduling(): Promise<void> {
    if (!this.scheduleConfig.enableScheduling) {
      console.log('📅 Backup scheduling is disabled')
      return
    }

    console.log('📅 Starting backup scheduling...')
    console.log(`   Full backups: ${this.scheduleConfig.fullBackupCron}`)
    console.log(
      `   Incremental backups: ${this.scheduleConfig.incrementalBackupCron}`
    )

    // TODO: Implement actual cron scheduling using a library like node-cron
    console.log(
      '⚠️ Cron scheduling not implemented yet - manual backup required'
    )
  }

  /**
   * Perform scheduled backup
   */
  async performScheduledBackup(
    type: 'full' | 'incremental' = 'incremental'
  ): Promise<string> {
    try {
      await this.backupManager.connect()

      let backupId: string

      if (type === 'full') {
        backupId = await this.backupManager.createFullBackup()
      } else {
        // For incremental backup, get the timestamp of the last backup
        const backups = await this.backupManager.listBackups()
        const lastBackupTime =
          backups.length > 0
            ? new Date(backups[0].timestamp)
            : new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago if no backups

        backupId =
          await this.backupManager.createIncrementalBackup(lastBackupTime)
      }

      // Cleanup old backups
      await this.backupManager.cleanupOldBackups()

      return backupId
    } finally {
      await this.backupManager.disconnect()
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  BackupManager,
  DisasterRecovery,
  BackupScheduler,
}
