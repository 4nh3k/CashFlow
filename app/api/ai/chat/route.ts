import { NextRequest, NextResponse } from 'next/server'
import { geminiApiService } from '@/lib/services/geminiApi'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message provided' },
        { status: 400 }
      )
    }

    // Get current financial data for context
    const client = await clientPromise
    const db = client.db('personal-finance')

    const [categories, wallets, recentTransactions] = await Promise.all([
      db.collection('categories').find({}).toArray(),
      db.collection('wallets').find({}).toArray(),
      db.collection('transactions').find({}).sort({ date: -1 }).limit(10).toArray()
    ])

    const chatResponse = await geminiApiService.generateChatResponse(
      message,
      {
        categories: categories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name,
          defaultType: cat.defaultType,
          color: cat.color
        })),
        wallets: wallets.map(wallet => ({
          id: wallet._id.toString(),
          name: wallet.name,
          balance: wallet.balance
        })),
        recentTransactions: recentTransactions.map(tx => ({
          id: tx._id.toString(),
          amount: tx.amount,
          description: tx.description,
          categoryId: tx.categoryId,
          date: tx.date,
          type: tx.type
        })),
        ...context
      }
    )

    return NextResponse.json(chatResponse)
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
