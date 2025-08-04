import { NextRequest, NextResponse } from 'next/server'
import { geminiApiService } from '@/lib/services/geminiApi'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Invalid description provided' },
        { status: 400 }
      )
    }

    // Get existing keyword mappings
    const client = await clientPromise
    const db = client.db('personal-finance')
    const keywordMappings = await db
      .collection('keywordMappings')
      .find({})
      .toArray()

    // Convert to the expected format
    const mappings = keywordMappings.map(mapping => ({
      id: mapping._id.toString(),
      keyword: mapping.keyword,
      categoryId: mapping.categoryId,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
    }))

    const suggestedCategory =
      await geminiApiService.suggestCategoryForDescription(
        description,
        mappings
      )

    return NextResponse.json({ suggestedCategory })
  } catch (error) {
    console.error('Error suggesting category:', error)
    return NextResponse.json(
      { error: 'Failed to suggest category' },
      { status: 500 }
    )
  }
}
