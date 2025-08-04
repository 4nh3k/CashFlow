import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

async function testConnection() {
  console.log('🔧 Testing MongoDB connection...')
  console.log('MongoDB URI:', process.env.MONGODB_URI)

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables')
    return
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI)
    console.log('📡 Attempting to connect...')

    await client.connect()
    console.log('✅ Successfully connected to MongoDB!')

    // Test basic operations
    const db = client.db('personal-finance')
    const collections = await db.listCollections().toArray()
    console.log(
      `📊 Database has ${collections.length} collections:`,
      collections.map(c => c.name)
    )

    await client.close()
    console.log('🔌 Connection closed')
  } catch (error) {
    console.error('❌ Connection failed:', error)
  }
}

testConnection()
