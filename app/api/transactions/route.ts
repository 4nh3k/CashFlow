import { NextRequest, NextResponse } from 'next/server'

async function getDatabase() {
  try {
    // Try MongoDB first
    const clientPromise = (await import('@/lib/mongodb')).default
    const client = await clientPromise
    return { db: client.db('personal-finance'), type: 'mongodb' as const }
  } catch (error) {
    console.warn(
      'MongoDB not available, using mock database:',
      (error as Error).message
    )
    // Fallback to mock database
    const { MockDatabase } = await import('@/lib/mockDatabase')
    return { db: MockDatabase, type: 'mock' as const }
  }
}

export async function GET() {
  try {
    const { db, type } = await getDatabase()

    let transactions
    if (type === 'mongodb') {
      transactions = await (db as any)
        .collection('transactions')
        .find({})
        .toArray()
    } else {
      transactions = await (db as any).getCollection('transactions')
    }

    // Serialize dates to ISO strings and convert _id to id
    const serializedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      _id: transaction._id?.toString(),
      id: transaction._id?.toString(),
      createdAt: transaction.createdAt
        ? transaction.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: transaction.updatedAt
        ? transaction.updatedAt.toISOString()
        : new Date().toISOString(),
      date: transaction.date
        ? typeof transaction.date === 'string'
          ? transaction.date
          : transaction.date.toISOString()
        : new Date().toISOString(),
    }))

    return NextResponse.json(serializedTransactions)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const transaction = await request.json()
    const { db, type } = await getDatabase()

    const now = new Date()
    const transactionData = {
      ...transaction,
      createdAt: now,
      updatedAt: now,
    }

    let result
    if (type === 'mongodb') {
      result = await (db as any)
        .collection('transactions')
        .insertOne(transactionData)
    } else {
      result = await (db as any).insertOne('transactions', transactionData)
    }

    // Return with serialized dates
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...transaction,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
