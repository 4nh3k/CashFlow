import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { z } from 'zod'

const createBudgetSchema = z.object({
  categoryId: z.string(),
  amount: z.number().min(0),
  period: z.enum(['monthly', 'weekly']).default('monthly'),
  name: z.string().optional(),
})

function serializeBudget(budget: any) {
  return {
    ...budget,
    _id: budget._id.toString(),
    id: budget._id.toString(),
    createdAt: budget.createdAt instanceof Date ? budget.createdAt.toISOString() : budget.createdAt,
    updatedAt: budget.updatedAt instanceof Date ? budget.updatedAt.toISOString() : budget.updatedAt,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBudgetSchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    // If categoryId is provided as a name, try to find the category
    let categoryId = validatedData.categoryId
    if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      const category = await db.collection('categories').findOne({ name: categoryId })
      if (category) {
        categoryId = category._id.toString()
      } else {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    // Check if budget already exists for this category
    const existingBudget = await db.collection('budgets').findOne({
      categoryId: new (await import('mongodb')).ObjectId(categoryId),
      period: validatedData.period
    })
    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category and period' },
        { status: 409 }
      )
    }

    const newBudget = {
      ...validatedData,
      categoryId: new (await import('mongodb')).ObjectId(categoryId),
      spent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('budgets').insertOne(newBudget)
    const createdBudget = await db.collection('budgets').findOne({ _id: result.insertedId })

    return NextResponse.json(serializeBudget(createdBudget), { status: 201 })
  } catch (error) {
    console.error('Error creating budget:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
