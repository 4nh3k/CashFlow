#!/usr/bin/env node

/**
 * Default Categories Migration Script
 * 
 * Adds comprehensive default categories for Vietnamese users
 * with proper icons, colors, and localization
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient, Db } from 'mongodb'
import { COLLECTIONS } from '../lib/database/schema'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  console.log('Please make sure .env.local file exists with MONGODB_URI set')
  process.exit(1)
}

// ============================================================================
// DEFAULT CATEGORIES DATA
// ============================================================================

const defaultCategories = [
  // EXPENSE CATEGORIES
  {
    name: 'Ăn uống',
    englishName: 'Food & Drinks',
    defaultType: 'expense' as const,
    icon: '🍽️',
    color: '#FF6B6B',
    isDefault: true,
    description: 'Các chi phí ăn uống, cà phê, nhà hàng',
    keywords: ['cơm', 'phở', 'cà phê', 'coffee', 'trà sữa', 'bánh mì', 'nhà hàng', 'quán ăn']
  },
  {
    name: 'Di chuyển',
    englishName: 'Transportation',
    defaultType: 'expense' as const,
    icon: '🚗',
    color: '#4ECDC4',
    isDefault: true,
    description: 'Xe bus, taxi, xăng xe, bảo dưỡng xe',
    keywords: ['xe bus', 'taxi', 'grab', 'xăng', 'xe máy', 'ô tô', 'bảo dưỡng']
  },
  {
    name: 'Mua sắm',
    englishName: 'Shopping',
    defaultType: 'expense' as const,
    icon: '🛍️',
    color: '#45B7D1',
    isDefault: true,
    description: 'Quần áo, giày dép, phụ kiện',
    keywords: ['áo', 'quần', 'giày', 'túi', 'đồ dùng', 'mua sắm', 'shopping']
  },
  {
    name: 'Nhà ở',
    englishName: 'Housing',
    defaultType: 'expense' as const,
    icon: '🏠',
    color: '#96CEB4',
    isDefault: true,
    description: 'Tiền thuê nhà, điện nước, internet',
    keywords: ['thuê nhà', 'điện', 'nước', 'internet', 'wifi', 'gas', 'nhà ở']
  },
  {
    name: 'Y tế',
    englishName: 'Healthcare',
    defaultType: 'expense' as const,
    icon: '⚕️',
    color: '#FFA07A',
    isDefault: true,
    description: 'Khám bệnh, thuốc men, bảo hiểm y tế',
    keywords: ['bệnh viện', 'thuốc', 'khám bệnh', 'y tế', 'bác sĩ', 'răng']
  },
  {
    name: 'Giáo dục',
    englishName: 'Education',
    defaultType: 'expense' as const,
    icon: '📚',
    color: '#DDA0DD',
    isDefault: true,
    description: 'Học phí, sách vở, khóa học',
    keywords: ['học phí', 'sách', 'khóa học', 'học', 'giáo dục', 'trường']
  },
  {
    name: 'Giải trí',
    englishName: 'Entertainment',
    defaultType: 'expense' as const,
    icon: '🎬',
    color: '#FFB347',
    isDefault: true,
    description: 'Phim ảnh, game, du lịch, thể thao',
    keywords: ['phim', 'game', 'du lịch', 'thể thao', 'giải trí', 'rạp chiếu']
  },
  {
    name: 'Viễn thông',
    englishName: 'Communication',
    defaultType: 'expense' as const,
    icon: '📱',
    color: '#87CEEB',
    isDefault: true,
    description: 'Điện thoại, data, internet di động',
    keywords: ['điện thoại', 'data', '3G', '4G', '5G', 'viễn thông', 'sim']
  },
  {
    name: 'Làm đẹp',
    englishName: 'Beauty & Personal Care',
    defaultType: 'expense' as const,
    icon: '💄',
    color: '#F0A0C9',
    isDefault: true,
    description: 'Mỹ phẩm, cắt tóc, spa, chăm sóc cá nhân',
    keywords: ['mỹ phẩm', 'cắt tóc', 'spa', 'làm đẹp', 'chăm sóc']
  },
  {
    name: 'Đầu tư',
    englishName: 'Investment',
    defaultType: 'expense' as const,
    icon: '📈',
    color: '#9370DB',
    isDefault: true,
    description: 'Cổ phiếu, quỹ đầu tư, tiết kiệm',
    keywords: ['cổ phiếu', 'đầu tư', 'quỹ', 'tiết kiệm', 'chứng khoán']
  },
  {
    name: 'Khác',
    englishName: 'Other Expenses',
    defaultType: 'expense' as const,
    icon: '💸',
    color: '#C0C0C0',
    isDefault: true,
    description: 'Chi phí khác không thuộc danh mục nào',
    keywords: ['khác', 'other', 'misc', 'linh tinh']
  },

  // INCOME CATEGORIES
  {
    name: 'Lương',
    englishName: 'Salary',
    defaultType: 'income' as const,
    icon: '💰',
    color: '#32CD32',
    isDefault: true,
    description: 'Lương chính thức từ công ty',
    keywords: ['lương', 'salary', 'tiền lương', 'công ty']
  },
  {
    name: 'Freelance',
    englishName: 'Freelance',
    defaultType: 'income' as const,
    icon: '💼',
    color: '#20B2AA',
    isDefault: true,
    description: 'Thu nhập từ việc làm tự do',
    keywords: ['freelance', 'tự do', 'part-time', 'project']
  },
  {
    name: 'Kinh doanh',
    englishName: 'Business',
    defaultType: 'income' as const,
    icon: '🏪',
    color: '#FFD700',
    isDefault: true,
    description: 'Thu nhập từ kinh doanh, bán hàng',
    keywords: ['kinh doanh', 'bán hàng', 'business', 'shop']
  },
  {
    name: 'Đầu tư',
    englishName: 'Investment Income',
    defaultType: 'income' as const,
    icon: '📊',
    color: '#4169E1',
    isDefault: true,
    description: 'Lợi nhuận từ đầu tư, cổ tức',
    keywords: ['lợi nhuận', 'cổ tức', 'dividend', 'profit', 'đầu tư']
  },
  {
    name: 'Quà tặng',
    englishName: 'Gifts',
    defaultType: 'income' as const,
    icon: '🎁',
    color: '#FF69B4',
    isDefault: true,
    description: 'Tiền quà, tiền mừng, hỗ trợ từ gia đình',
    keywords: ['quà', 'gift', 'mừng', 'gia đình', 'hỗ trợ']
  },
  {
    name: 'Khác',
    englishName: 'Other Income',
    defaultType: 'income' as const,
    icon: '💎',
    color: '#40E0D0',
    isDefault: true,
    description: 'Thu nhập khác không thuộc danh mục nào',
    keywords: ['khác', 'other', 'misc', 'linh tinh']
  }
]

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(process.env.MONGODB_URI!, {
    retryWrites: true,
  })
  
  await client.connect()
  const db = client.db(process.env.DATABASE_NAME || 'personal-finance')
  
  console.log('✅ Connected to MongoDB')
  return { client, db }
}

async function checkExistingCategories(db: Db): Promise<string[]> {
  const collection = db.collection(COLLECTIONS.CATEGORIES)
  const existingCategories = await collection.find({ isDefault: true }).toArray()
  
  console.log(`📋 Found ${existingCategories.length} existing default categories`)
  
  return existingCategories.map(cat => cat.name)
}

async function addDefaultCategories(db: Db): Promise<void> {
  const collection = db.collection(COLLECTIONS.CATEGORIES)
  const existingNames = await checkExistingCategories(db)
  
  // Filter out categories that already exist
  const categoriesToAdd = defaultCategories.filter(
    category => !existingNames.includes(category.name)
  )
  
  if (categoriesToAdd.length === 0) {
    console.log('ℹ️ All default categories already exist')
    return
  }
  
  console.log(`🔄 Adding ${categoriesToAdd.length} new default categories...`)
  
  // Prepare categories for insertion
  const categoriesWithDates = categoriesToAdd.map(category => ({
    ...category,
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  
  // Insert categories
  const result = await collection.insertMany(categoriesWithDates)
  
  console.log(`✅ Successfully added ${result.insertedCount} default categories`)
  
  // Log added categories
  categoriesWithDates.forEach(category => {
    console.log(`   • ${category.icon} ${category.name} (${category.englishName})`)
  })
}

async function createKeywordMappings(db: Db): Promise<void> {
  const categoriesCollection = db.collection(COLLECTIONS.CATEGORIES)
  const keywordCollection = db.collection(COLLECTIONS.KEYWORD_MAPPINGS)
  
  console.log('🔄 Creating keyword mappings for categories...')
  
  // Get all categories with keywords
  const categories = await categoriesCollection.find({ 
    isDefault: true,
    keywords: { $exists: true, $ne: [] }
  }).toArray()
  
  let mappingsAdded = 0
  
  for (const category of categories) {
    if (!category.keywords || category.keywords.length === 0) continue
    
    for (const keyword of category.keywords) {
      // Check if mapping already exists
      const existingMapping = await keywordCollection.findOne({
        keyword: keyword.toLowerCase(),
        categoryId: category.id
      })
      
      if (!existingMapping) {
        await keywordCollection.insertOne({
          id: `km_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          keyword: keyword.toLowerCase(),
          categoryId: category.id,
          confidence: 0.8,
          frequency: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mappingsAdded++
      }
    }
  }
  
  console.log(`✅ Created ${mappingsAdded} keyword mappings`)
}

async function validateMigration(db: Db): Promise<void> {
  console.log('🔍 Validating migration...')
  
  const categoriesCollection = db.collection(COLLECTIONS.CATEGORIES)
  const keywordCollection = db.collection(COLLECTIONS.KEYWORD_MAPPINGS)
  
  // Count categories by type
  const expenseCount = await categoriesCollection.countDocuments({ 
    isDefault: true, 
    defaultType: 'expense' 
  })
  const incomeCount = await categoriesCollection.countDocuments({ 
    isDefault: true, 
    defaultType: 'income' 
  })
  const totalKeywords = await keywordCollection.countDocuments()
  
  console.log(`✅ Validation Results:`)
  console.log(`   • Default expense categories: ${expenseCount}`)
  console.log(`   • Default income categories: ${incomeCount}`)
  console.log(`   • Total keyword mappings: ${totalKeywords}`)
  
  if (expenseCount === 0 || incomeCount === 0) {
    throw new Error('Migration validation failed: Missing categories')
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runDefaultCategoriesMigration(): Promise<void> {
  let client: MongoClient | null = null
  
  try {
    console.log('🚀 Starting Default Categories Migration')
    console.log('=====================================')
    console.log(`📅 Date: ${new Date().toLocaleString('vi-VN')}`)
    console.log(`🗄️ Database: ${process.env.DATABASE_NAME || 'personal-finance'}`)
    console.log('')
    
    // Connect to database
    const connection = await connectToDatabase()
    client = connection.client
    const db = connection.db
    
    // Run migration steps
    await addDefaultCategories(db)
    await createKeywordMappings(db)
    await validateMigration(db)
    
    console.log('')
    console.log('🎉 Default Categories Migration Completed Successfully!')
    console.log('=====================================================')
    console.log('')
    console.log('📝 Summary:')
    console.log('   • Added comprehensive Vietnamese category system')
    console.log('   • Created keyword mappings for smart categorization')
    console.log('   • Included both expense and income categories')
    console.log('   • Added icons and colors for better UI experience')
    console.log('')
    console.log('🎯 Next Steps:')
    console.log('   1. Restart your application to see new categories')
    console.log('   2. Test transaction categorization with keywords')
    console.log('   3. Customize categories as needed for your users')
    console.log('')
    
  } catch (error) {
    console.error('')
    console.error('❌ Migration Failed')
    console.error('==================')
    console.error('Error:', error)
    console.error('')
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('✅ Disconnected from MongoDB')
    }
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  runDefaultCategoriesMigration()
    .then(() => {
      console.log('✨ Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export { runDefaultCategoriesMigration, defaultCategories }
