import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('personal-finance')

    const mappings = await db.collection('keywordMappings').find({}).toArray()

    // Convert _id to id for frontend compatibility
    const formattedMappings = mappings.map(mapping => ({
      ...mapping,
      id: mapping._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formattedMappings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch keyword mappings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('personal-finance')

    const mapping = await request.json()

    const result = await db.collection('keywordMappings').insertOne({
      ...mapping,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...mapping,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create keyword mapping' },
      { status: 500 }
    )
  }
}
