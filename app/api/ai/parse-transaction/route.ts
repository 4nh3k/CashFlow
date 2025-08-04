import { NextRequest, NextResponse } from 'next/server'
import { geminiApiService } from '@/lib/services/geminiApi'

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input provided' },
        { status: 400 }
      )
    }

    const extraction = await geminiApiService.parseTransactionInput(input)

    return NextResponse.json(extraction)
  } catch (error) {
    console.error('Error parsing transaction input:', error)
    return NextResponse.json(
      { error: 'Failed to parse transaction input' },
      { status: 500 }
    )
  }
}
