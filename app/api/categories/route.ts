import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { z } from 'zod'

// Validation schema for category creation
const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  defaultType: z.enum(['expense', 'income']),
  color: z.string().optional(),
  icon: z.string().optional(),
})

function serializeCategory(category: any) {
  return {
    ...category,
    _id: category._id.toString(),
    id: category._id.toString(),
    createdAt:
      category.createdAt instanceof Date
        ? category.createdAt.toISOString()
        : category.createdAt,
    updatedAt:
      category.updatedAt instanceof Date
        ? category.updatedAt.toISOString()
        : category.updatedAt,
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('personal-finance')
    const categories = await db.collection('categories').find({}).toArray()

    return NextResponse.json(categories.map(serializeCategory))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    const newCategory = {
      ...validatedData,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('categories').insertOne(newCategory)
    const createdCategory = await db
      .collection('categories')
      .findOne({ _id: result.insertedId })

    return NextResponse.json(serializeCategory(createdCategory), {
      status: 201,
    })
  } catch (error) {
    console.error('Error creating category:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
