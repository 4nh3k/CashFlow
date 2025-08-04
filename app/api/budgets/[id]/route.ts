import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../../lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema for budget updates
const updateBudgetSchema = z.object({
  categoryId: z.string().optional(),
  amount: z.number().positive().optional(),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  isActive: z.boolean().optional(),
})

function serializeBudget(budget: any) {
  return {
    ...budget,
    _id: budget._id.toString(),
    id: budget._id.toString(),
    createdAt:
      budget.createdAt instanceof Date
        ? budget.createdAt.toISOString()
        : budget.createdAt,
    updatedAt:
      budget.updatedAt instanceof Date
        ? budget.updatedAt.toISOString()
        : budget.updatedAt,
  }
}

// GET /api/budgets/[id] - Get a specific budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await clientPromise
    const db = client.db('personal-finance')

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid budget ID' },
        { status: 400 }
      )
    }

    const budget = await db
      .collection('budgets')
      .findOne({ _id: new ObjectId(id) })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeBudget(budget))
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

// PUT /api/budgets/[id] - Update a specific budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('personal-finance')

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid budget ID' },
        { status: 400 }
      )
    }

    // Validate update data
    const validatedData = updateBudgetSchema.parse(body)

    // Check if budget exists
    const existingBudget = await db
      .collection('budgets')
      .findOne({ _id: new ObjectId(id) })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // Update the budget
    await db
      .collection('budgets')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

    // Fetch and return the updated budget
    const updatedBudget = await db
      .collection('budgets')
      .findOne({ _id: new ObjectId(id) })

    return NextResponse.json(serializeBudget(updatedBudget))
  } catch (error) {
    console.error('Error updating budget:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

// DELETE /api/budgets/[id] - Delete a specific budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await clientPromise
    const db = client.db('personal-finance')

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid budget ID' },
        { status: 400 }
      )
    }

    // Check if budget exists
    const existingBudget = await db
      .collection('budgets')
      .findOne({ _id: new ObjectId(id) })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Delete the budget
    await db
      .collection('budgets')
      .deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
