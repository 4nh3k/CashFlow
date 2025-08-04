import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { z } from 'zod'

const createTransactionSchema = z.object({
  amount: z.number().min(0),
  description: z.string().min(1),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  date: z.string().optional()
})

function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    _id: transaction._id.toString(),
    id: transaction._id.toString(),
    date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
    createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt,
    updatedAt: transaction.updatedAt instanceof Date ? transaction.updatedAt.toISOString() : transaction.updatedAt,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    // If categoryId is provided as a name, try to find the category
    let categoryId = validatedData.categoryId
    if (categoryId && !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      const category = await db.collection('categories').findOne({ name: categoryId })
      if (category) {
        categoryId = category._id.toString()
      } else {
        // Create new category if it doesn't exist
        const newCategory = {
          name: categoryId,
          defaultType: validatedData.type,
          color: '#3B82F6',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const categoryResult = await db.collection('categories').insertOne(newCategory)
        categoryId = categoryResult.insertedId.toString()
      }
    }

    // If walletId is provided as a name, try to find the wallet
    let walletId = validatedData.walletId
    if (walletId && !walletId.match(/^[0-9a-fA-F]{24}$/)) {
      const wallet = await db.collection('wallets').findOne({ name: walletId })
      if (wallet) {
        walletId = wallet._id.toString()
      } else {
        // Use the first available wallet or create a default one
        const firstWallet = await db.collection('wallets').findOne({})
        if (firstWallet) {
          walletId = firstWallet._id.toString()
        } else {
          const newWallet = {
            name: 'Ví chính',
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          const walletResult = await db.collection('wallets').insertOne(newWallet)
          walletId = walletResult.insertedId.toString()
        }
      }
    }

    const newTransaction = {
      ...validatedData,
      categoryId,
      walletId,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('transactions').insertOne(newTransaction)
    const createdTransaction = await db.collection('transactions').findOne({ _id: result.insertedId })

    // Get category and wallet names for better display
    let categoryName = null
    let walletName = null

    if (categoryId) {
      const category = await db.collection('categories').findOne({ _id: new (await import('mongodb')).ObjectId(categoryId) })
      categoryName = category?.name || null
    }

    if (walletId) {
      const wallet = await db.collection('wallets').findOne({ _id: new (await import('mongodb')).ObjectId(walletId) })
      walletName = wallet?.name || null
    }

    // Update wallet balance if transaction affects a wallet
    if (walletId && validatedData.amount) {
      const balanceChange = validatedData.type === 'income' ? validatedData.amount : -validatedData.amount
      await db.collection('wallets').updateOne(
        { _id: new (await import('mongodb')).ObjectId(walletId) },
        {
          $inc: { balance: balanceChange },
          $set: { updatedAt: new Date() }
        }
      )
    }

    const transactionWithNames = {
      ...createdTransaction,
      categoryName,
      walletName
    }

    return NextResponse.json(serializeTransaction(transactionWithNames), { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
