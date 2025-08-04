#!/usr/bin/env node

/**
 * Database Migration CLI Tool
 *
 * Command-line interface for running database migrations,
 * backups, and recovery operations
 */

import { runMigration } from '../lib/database/migration'
import {
  BackupManager,
  DisasterRecovery,
  BackupScheduler,
} from '../lib/database/backup'

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  databaseName: process.env.DATABASE_NAME || 'personal-finance',
  backupDirectory: process.env.BACKUP_DIR || './backups',
}

// ============================================================================
// CLI COMMANDS
// ============================================================================

async function runDatabaseMigration() {
  console.log('🚀 Starting database migration...')
  console.log('📋 Configuration:')
  console.log(`   MongoDB URI: ${DEFAULT_CONFIG.mongoUri}`)
  console.log(`   Database: ${DEFAULT_CONFIG.databaseName}`)
  console.log('')

  try {
    await runMigration({
      mongoUri: DEFAULT_CONFIG.mongoUri,
      databaseName: DEFAULT_CONFIG.databaseName,
    })

    console.log('')
    console.log('✅ Database migration completed successfully!')
    console.log('')
    console.log('🎯 Next steps:')
    console.log('   1. Update your application environment variables')
    console.log('   2. Test the application with the new database')
    console.log('   3. Set up automated backups')
    console.log('')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function createBackup(type: 'full' | 'incremental' = 'full') {
  console.log(`💾 Creating ${type} backup...`)

  const backupManager = new BackupManager(DEFAULT_CONFIG)

  try {
    await backupManager.connect()

    let backupId: string

    if (type === 'full') {
      backupId = await backupManager.createFullBackup()
    } else {
      // For incremental, use yesterday as the baseline
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      backupId = await backupManager.createIncrementalBackup(yesterday)
    }

    console.log(`✅ Backup created successfully: ${backupId}`)
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await backupManager.disconnect()
  }
}

async function listBackups() {
  console.log('📋 Listing available backups...')

  const backupManager = new BackupManager(DEFAULT_CONFIG)

  try {
    const backups = await backupManager.listBackups()

    if (backups.length === 0) {
      console.log('ℹ️ No backups found')
      return
    }

    console.log('')
    console.log('Available backups:')
    console.log('')

    backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString()
      const size = formatBytes(backup.size)
      const totalDocs = Object.values(backup.documentCounts).reduce(
        (sum, count) => sum + count,
        0
      )

      console.log(`${index + 1}. ${backup.timestamp}`)
      console.log(`   Date: ${date}`)
      console.log(`   Size: ${size}`)
      console.log(`   Documents: ${totalDocs}`)
      console.log(
        `   Collections: ${Object.keys(backup.documentCounts).join(', ')}`
      )
      console.log('')
    })
  } catch (error) {
    console.error('❌ Failed to list backups:', error)
    process.exit(1)
  }
}

async function restoreBackup(backupId?: string) {
  console.log('🔄 Restoring database from backup...')

  const backupManager = new BackupManager(DEFAULT_CONFIG)

  try {
    await backupManager.connect()

    if (!backupId) {
      // Use the latest backup
      const backups = await backupManager.listBackups()
      if (backups.length === 0) {
        throw new Error('No backups available')
      }

      const latestBackup = backups[0]
      backupId = `full-backup-${latestBackup.timestamp}`
      console.log(`Using latest backup: ${backupId}`)
    }

    // Perform a dry run first
    console.log('🧪 Performing dry run...')
    await backupManager.restoreFromBackup(backupId, { dryRun: true })

    // Confirm with user (in a real CLI, you'd prompt for confirmation)
    console.log(
      '⚠️ This will overwrite existing data. Proceeding with restore...'
    )

    await backupManager.restoreFromBackup(backupId, {
      dropExisting: true,
      validateData: true,
    })

    console.log('✅ Database restored successfully!')
  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  } finally {
    await backupManager.disconnect()
  }
}

async function performDisasterRecovery() {
  console.log('🚨 Starting disaster recovery...')

  const disasterRecovery = new DisasterRecovery(DEFAULT_CONFIG)

  try {
    await disasterRecovery.performDisasterRecovery({
      useLatestBackup: true,
      reinstallDatabase: true,
    })

    // Validate the recovery
    console.log('🔍 Validating recovery...')
    const isValid = await disasterRecovery.validateRecovery()

    if (isValid) {
      console.log('✅ Disaster recovery completed and validated successfully!')
    } else {
      throw new Error('Recovery validation failed')
    }
  } catch (error) {
    console.error('❌ Disaster recovery failed:', error)
    process.exit(1)
  }
}

async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...')

  const backupManager = new BackupManager(DEFAULT_CONFIG)

  try {
    await backupManager.cleanupOldBackups()
    console.log('✅ Cleanup completed successfully!')
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function showHelp() {
  console.log('📚 Database Migration CLI Tool')
  console.log('')
  console.log('Available commands:')
  console.log('')
  console.log('  migrate              Run database migration')
  console.log('  backup [type]        Create backup (full or incremental)')
  console.log('  list-backups         List all available backups')
  console.log('  restore [backup-id]  Restore from backup')
  console.log('  disaster-recovery    Perform complete disaster recovery')
  console.log('  cleanup              Clean up old backups')
  console.log('  help                 Show this help message')
  console.log('')
  console.log('Environment variables:')
  console.log('  MONGODB_URI          MongoDB connection string')
  console.log('  DATABASE_NAME        Database name')
  console.log('  BACKUP_DIR           Backup directory path')
  console.log('')
  console.log('Examples:')
  console.log('  npm run db:migrate')
  console.log('  npm run db:backup full')
  console.log('  npm run db:restore backup-2024-01-01T12-00-00-000Z')
  console.log('')
}

// ============================================================================
// MAIN CLI LOGIC
// ============================================================================

async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  switch (command) {
    case 'migrate':
      await runDatabaseMigration()
      break

    case 'backup':
      await createBackup((arg as 'full' | 'incremental') || 'full')
      break

    case 'list-backups':
      await listBackups()
      break

    case 'restore':
      await restoreBackup(arg)
      break

    case 'disaster-recovery':
      await performDisasterRecovery()
      break

    case 'cleanup':
      await cleanupOldBackups()
      break

    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break

    default:
      console.error('❌ Unknown command:', command)
      console.log('')
      showHelp()
      process.exit(1)
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('\n👋 Migration interrupted by user')
  process.exit(0)
})

// ============================================================================
// RUN CLI
// ============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('❌ CLI error:', error)
    process.exit(1)
  })
}

export {
  runDatabaseMigration,
  createBackup,
  listBackups,
  restoreBackup,
  performDisasterRecovery,
  cleanupOldBackups,
}
