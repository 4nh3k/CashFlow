#!/usr/bin/env node

/**
 * Verify Default Categories Migration
 * 
 * Quick script to verify the categories were added correctly
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'
import { COLLECTIONS } from '../lib/database/schema'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function verifyCategories() {
  let client: MongoClient | null = null
  
  try {
    console.log('🔍 Verifying Default Categories Migration')
    console.log('=========================================')
    
    client = new MongoClient(process.env.MONGODB_URI!, { retryWrites: true })
    await client.connect()
    const db = client.db(process.env.DATABASE_NAME || 'personal-finance')
    
    console.log('✅ Connected to MongoDB')
    
    // Get all categories
    const categories = await db.collection(COLLECTIONS.CATEGORIES)
      .find({ isDefault: true })
      .sort({ defaultType: 1, name: 1 })
      .toArray()
    
    // Get keyword mappings
    const keywordMappings = await db.collection(COLLECTIONS.KEYWORD_MAPPINGS)
      .find({})
      .toArray()
    
    console.log('')
    console.log('📊 MIGRATION RESULTS')
    console.log('===================')
    console.log(`Total default categories: ${categories.length}`)
    console.log(`Total keyword mappings: ${keywordMappings.length}`)
    
    // Group by type
    const expenseCategories = categories.filter(cat => cat.defaultType === 'expense')
    const incomeCategories = categories.filter(cat => cat.defaultType === 'income')
    
    console.log('')
    console.log('💸 EXPENSE CATEGORIES:')
    expenseCategories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} - ${cat.englishName}`)
    })
    
    console.log('')
    console.log('💰 INCOME CATEGORIES:')
    incomeCategories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} - ${cat.englishName}`)
    })
    
    console.log('')
    console.log('🔑 KEYWORD MAPPING SAMPLE:')
    const sampleMappings = keywordMappings.slice(0, 10)
    for (const mapping of sampleMappings) {
      const category = categories.find(cat => cat.id === mapping.categoryId)
      if (category) {
        console.log(`   "${mapping.keyword}" → ${category.icon} ${category.name}`)
      }
    }
    
    console.log('')
    console.log('✅ Verification completed successfully!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('✅ Disconnected from MongoDB')
    }
  }
}

if (require.main === module) {
  verifyCategories()
}

export { verifyCategories }
