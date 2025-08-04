import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') })

// Now check if we have the MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  console.log('Please make sure .env.local file exists with MONGODB_URI set')
  process.exit(1)
}

const seedData = {
  categories: [
    {
      name: 'Food & Drinks',
      defaultType: 'expense',
      icon: '🍽️',
      color: '#FF6B6B',
      isDefault: true,
    },
    {
      name: 'Transportation',
      defaultType: 'expense',
      icon: '🚗',
      color: '#4ECDC4',
      isDefault: true,
    },
    {
      name: 'Shopping',
      defaultType: 'expense',
      icon: '🛍️',
      color: '#45B7D1',
      isDefault: true,
    },
    {
      name: 'Salary',
      defaultType: 'income',
      icon: '💰',
      color: '#96CEB4',
      isDefault: true,
    },
    {
      name: 'Freelance',
      defaultType: 'income',
      icon: '💼',
      color: '#96CEB4',
      isDefault: true,
    },
  ],
  wallets: [
    {
      name: 'Cash',
      balance: 500000,
      currency: 'VND',
      isDefault: true,
    },
    {
      name: 'Bank Account',
      balance: 2000000,
      currency: 'VND',
      isDefault: false,
    },
  ],
  keywordMappings: [
    {
      keyword: 'coffee',
      categoryId: '', // Will be filled after categories are created
    },
    {
      keyword: 'gas',
      categoryId: '', // Will be filled after categories are created
    },
  ],
}

async function seedDatabase() {
  try {
    // Create direct MongoDB connection
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db('personal-finance')

    console.log('🌱 Starting database seeding...')

    // Clear existing data
    await db.collection('categories').deleteMany({})
    await db.collection('wallets').deleteMany({})
    await db.collection('keywordMappings').deleteMany({})
    await db.collection('transactions').deleteMany({})

    console.log('🗑️ Cleared existing data')

    // Seed categories
    const categoriesResult = await db.collection('categories').insertMany(
      seedData.categories.map(cat => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    console.log(`✅ Seeded ${categoriesResult.insertedCount} categories`)

    // Seed wallets
    const walletsResult = await db.collection('wallets').insertMany(
      seedData.wallets.map(wallet => ({
        ...wallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    )
    console.log(`✅ Seeded ${walletsResult.insertedCount} wallets`)

    // Get category IDs for keyword mappings
    const categories = await db.collection('categories').find({}).toArray()
    const foodCategory = categories.find(
      (cat: any) => cat.name === 'Food & Drinks'
    )
    const transportCategory = categories.find(
      (cat: any) => cat.name === 'Transportation'
    )

    // Seed keyword mappings
    if (foodCategory && transportCategory) {
      const keywordMappings = [
        {
          keyword: 'coffee',
          categoryId: foodCategory._id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          keyword: 'gas',
          categoryId: transportCategory._id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const keywordResult = await db
        .collection('keywordMappings')
        .insertMany(keywordMappings)
      console.log(`✅ Seeded ${keywordResult.insertedCount} keyword mappings`)
    }

    // Add some sample transactions
    const wallets = await db.collection('wallets').find({}).toArray()
    const cashWallet = wallets.find((w: any) => w.name === 'Cash')

    if (cashWallet && foodCategory && transportCategory) {
      const sampleTransactions = [
        {
          amount: 50000,
          type: 'expense',
          description: 'Coffee at Starbucks',
          categoryId: foodCategory._id.toString(),
          walletId: cashWallet._id.toString(),
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          amount: 100000,
          type: 'expense',
          description: 'Gas for car',
          categoryId: transportCategory._id.toString(),
          walletId: cashWallet._id.toString(),
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const transactionsResult = await db
        .collection('transactions')
        .insertMany(sampleTransactions)
      console.log(
        `✅ Seeded ${transactionsResult.insertedCount} sample transactions`
      )
    }

    console.log('🎉 Database seeding completed successfully!')

    // Close the connection
    await client.close()
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0))
}

export default seedDatabase
