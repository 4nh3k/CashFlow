// Mock database for testing purposes
// This will be replaced with actual MongoDB connection later

interface MockData {
  transactions: any[]
  categories: any[]
  wallets: any[]
  keywordMappings: any[]
}

const mockData: MockData = {
  transactions: [
    {
      _id: '1',
      amount: 50000,
      type: 'expense',
      description: 'Coffee at Starbucks',
      categoryId: '1',
      walletId: '1',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      amount: 100000,
      type: 'income',
      description: 'Freelance payment',
      categoryId: '4',
      walletId: '1',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  categories: [
    {
      _id: '1',
      id: '1',
      name: 'Food & Drinks',
      defaultType: 'expense',
      icon: '🍽️',
      color: '#FF6B6B',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      id: '2',
      name: 'Transportation',
      defaultType: 'expense',
      icon: '🚗',
      color: '#4ECDC4',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '3',
      id: '3',
      name: 'Shopping',
      defaultType: 'expense',
      icon: '🛍️',
      color: '#45B7D1',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '4',
      id: '4',
      name: 'Salary',
      defaultType: 'income',
      icon: '💰',
      color: '#96CEB4',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  wallets: [
    {
      _id: '1',
      id: '1',
      name: 'Cash',
      balance: 500000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      id: '2',
      name: 'Bank Account',
      balance: 2000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  keywordMappings: [
    {
      _id: '1',
      id: '1',
      keyword: 'coffee',
      categoryId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      id: '2',
      keyword: 'gas',
      categoryId: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}

export class MockDatabase {
  static async getCollection(collectionName: keyof MockData) {
    // Simulate async database call
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log(
      `🔧 MockDB: Getting ${collectionName}, count:`,
      mockData[collectionName].length
    )
    return mockData[collectionName]
  }

  static async insertOne(collectionName: keyof MockData, document: any) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const newDoc = {
      ...document,
      _id: Date.now().toString(),
      id: Date.now().toString(),
      // Ensure dates are ISO strings
      createdAt:
        document.createdAt instanceof Date
          ? document.createdAt.toISOString()
          : document.createdAt,
      updatedAt:
        document.updatedAt instanceof Date
          ? document.updatedAt.toISOString()
          : document.updatedAt,
    }
    console.log(`🔧 MockDB: Inserting into ${collectionName}:`, newDoc)
    mockData[collectionName].push(newDoc)
    console.log(
      `🔧 MockDB: Total ${collectionName} count:`,
      mockData[collectionName].length
    )
    return { insertedId: newDoc._id }
  }

  static async updateOne(
    collectionName: keyof MockData,
    filter: any,
    update: any
  ) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const collection = mockData[collectionName]
    const index = collection.findIndex(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    )

    if (index !== -1) {
      const updateData = { ...update.$set, updatedAt: new Date().toISOString() }
      collection[index] = { ...collection[index], ...updateData }
      return { modifiedCount: 1 }
    }
    return { modifiedCount: 0 }
  }

  static async deleteOne(collectionName: keyof MockData, filter: any) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const collection = mockData[collectionName]
    const index = collection.findIndex(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    )

    if (index !== -1) {
      collection.splice(index, 1)
      return { deletedCount: 1 }
    }
    return { deletedCount: 0 }
  }

  static async findOne(collectionName: keyof MockData, filter: any) {
    await new Promise(resolve => setTimeout(resolve, 100))
    const collection = mockData[collectionName]
    return collection.find(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    )
  }
}

export default MockDatabase
