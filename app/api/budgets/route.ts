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

    let budgets
    if (type === 'mongodb') {
      budgets = await (db as any).collection('budgets').find({}).toArray()
    } else {
      budgets = await (db as any).getCollection('budgets')
    }

    // Serialize dates to ISO strings and convert _id to id
    const serializedBudgets = budgets.map((budget: any) => ({
      ...budget,
      _id: budget._id?.toString(),
      id: budget._id?.toString(),
      createdAt: budget.createdAt
        ? budget.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: budget.updatedAt
        ? budget.updatedAt.toISOString()
        : new Date().toISOString(),
      startDate: budget.startDate
        ? typeof budget.startDate === 'string'
          ? budget.startDate
          : budget.startDate.toISOString()
        : new Date().toISOString(),
      endDate: budget.endDate
        ? typeof budget.endDate === 'string'
          ? budget.endDate
          : budget.endDate.toISOString()
        : new Date().toISOString(),
    }))

    return NextResponse.json(serializedBudgets)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const budget = await request.json()
    const { db, type } = await getDatabase()

    const now = new Date()
    const budgetData = {
      ...budget,
      spent: 0,
      remaining: budget.amount,
      percentage: 0,
      isOverBudget: false,
      alertTriggered: false,
      createdAt: now,
      updatedAt: now,
    }

    let result
    if (type === 'mongodb') {
      result = await (db as any).collection('budgets').insertOne(budgetData)
    } else {
      result = await (db as any).insertOne('budgets', budgetData)
    }

    // Return with serialized dates
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...budget,
      spent: 0,
      remaining: budget.amount,
      percentage: 0,
      isOverBudget: false,
      alertTriggered: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      startDate: budget.startDate,
      endDate: budget.endDate,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
