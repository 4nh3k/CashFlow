// Simple localStorage-based database for local development
// This provides the same interface as MongoDB but stores data locally

interface Collection {
  [key: string]: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

class LocalStorageDatabase {
  private getStorageKey(collectionName: string): string {
    return `personal-finance-${collectionName}`
  }

  private loadCollection(collectionName: string): any[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(collectionName))
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error loading ${collectionName}:`, error)
      return []
    }
  }

  private saveCollection(collectionName: string, data: any[]): void {
    try {
      localStorage.setItem(
        this.getStorageKey(collectionName),
        JSON.stringify(data)
      )
    } catch (error) {
      console.error(`Error saving ${collectionName}:`, error)
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  async find(collectionName: string, filter: any = {}): Promise<any[]> {
    const data = this.loadCollection(collectionName)

    if (Object.keys(filter).length === 0) {
      return data
    }

    return data.filter(item => {
      return Object.keys(filter).every(key => {
        if (
          key === '_id' &&
          typeof filter[key] === 'object' &&
          filter[key].$eq
        ) {
          return item._id === filter[key].$eq
        }
        return item[key] === filter[key]
      })
    })
  }

  async findOne(collectionName: string, filter: any): Promise<any | null> {
    const results = await this.find(collectionName, filter)
    return results.length > 0 ? results[0] : null
  }

  async insertOne(
    collectionName: string,
    document: any
  ): Promise<{ insertedId: string }> {
    const data = this.loadCollection(collectionName)
    const newDoc = {
      ...document,
      _id: this.generateId(),
      id: this.generateId(), // Add both _id and id for compatibility
    }
    data.push(newDoc)
    this.saveCollection(collectionName, data)
    return { insertedId: newDoc._id }
  }

  async insertMany(
    collectionName: string,
    documents: any[]
  ): Promise<{ insertedCount: number; insertedIds: string[] }> {
    const data = this.loadCollection(collectionName)
    const insertedIds: string[] = []

    const newDocs = documents.map(doc => {
      const id = this.generateId()
      insertedIds.push(id)
      return {
        ...doc,
        _id: id,
        id: id,
      }
    })

    data.push(...newDocs)
    this.saveCollection(collectionName, data)

    return { insertedCount: newDocs.length, insertedIds }
  }

  async updateOne(
    collectionName: string,
    filter: any,
    update: any
  ): Promise<{ modifiedCount: number }> {
    const data = this.loadCollection(collectionName)
    const index = data.findIndex(item => {
      return Object.keys(filter).every(key => {
        if (
          key === '_id' &&
          typeof filter[key] === 'object' &&
          filter[key].$eq
        ) {
          return item._id === filter[key].$eq
        }
        return item[key] === filter[key]
      })
    })

    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...update.$set,
        updatedAt: new Date(),
      }
      this.saveCollection(collectionName, data)
      return { modifiedCount: 1 }
    }

    return { modifiedCount: 0 }
  }

  async deleteOne(
    collectionName: string,
    filter: any
  ): Promise<{ deletedCount: number }> {
    const data = this.loadCollection(collectionName)
    const index = data.findIndex(item => {
      return Object.keys(filter).every(key => {
        if (
          key === '_id' &&
          typeof filter[key] === 'object' &&
          filter[key].$eq
        ) {
          return item._id === filter[key].$eq
        }
        return item[key] === filter[key]
      })
    })

    if (index !== -1) {
      data.splice(index, 1)
      this.saveCollection(collectionName, data)
      return { deletedCount: 1 }
    }

    return { deletedCount: 0 }
  }

  async deleteMany(
    collectionName: string,
    filter: any
  ): Promise<{ deletedCount: number }> {
    if (Object.keys(filter).length === 0) {
      // Delete all
      this.saveCollection(collectionName, [])
      const data = this.loadCollection(collectionName)
      return { deletedCount: data.length }
    }

    let data = this.loadCollection(collectionName)
    const originalLength = data.length
    data = data.filter(item => {
      return !Object.keys(filter).every(key => item[key] === filter[key])
    })

    this.saveCollection(collectionName, data)
    return { deletedCount: originalLength - data.length }
  }

  collection(name: string) {
    return {
      find: (filter?: any) => ({
        toArray: () => this.find(name, filter),
      }),
      findOne: (filter: any) => this.findOne(name, filter),
      insertOne: (doc: any) => this.insertOne(name, doc),
      insertMany: (docs: any[]) => this.insertMany(name, docs),
      updateOne: (filter: any, update: any) =>
        this.updateOne(name, filter, update),
      deleteOne: (filter: any) => this.deleteOne(name, filter),
      deleteMany: (filter: any) => this.deleteMany(name, filter),
    }
  }
}

export const localDb = new LocalStorageDatabase()

// Create a database interface that can switch between MongoDB and localStorage
export function createDatabase() {
  if (typeof window !== 'undefined') {
    // Client-side: use localStorage
    return {
      db: () => localDb,
    }
  } else {
    // Server-side: try MongoDB, fallback to mock
    try {
      const clientPromise = require('../lib/mongodb').default
      return {
        db: async () => {
          const client = await clientPromise
          return client.db('personal-finance')
        },
      }
    } catch (error) {
      console.warn('MongoDB not available, using mock database')
      return {
        db: () => localDb,
      }
    }
  }
}

export default localDb
