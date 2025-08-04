import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../../lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema for transaction updates
const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  date: z.string().datetime().optional(),
  description: z.string().min(1).max(200).optional(),
  categoryId: z.string().optional(),
  walletId: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
})

function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    _id: transaction._id.toString(),
    id: transaction._id.toString(),
    date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
    createdAt:
      transaction.createdAt instanceof Date
        ? transaction.createdAt.toISOString()
        : transaction.createdAt,
    updatedAt:
      transaction.updatedAt instanceof Date
        ? transaction.updatedAt.toISOString()
        : transaction.updatedAt,
  }
}

// GET /api/transactions/[id] - Get a specific transaction
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
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    const transaction = await db
      .collection('transactions')
      .findOne({ _id: new ObjectId(id) })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeTransaction(transaction))
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id] - Update a specific transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    // Check if transaction exists
    const existingTransaction = await db
      .collection('transactions')
      .findOne({ _id: new ObjectId(id) })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Convert date string to Date object if provided
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    // If wallet or amount is being changed, we need to update wallet balances
    const isWalletChanged = validatedData.walletId && validatedData.walletId !== existingTransaction.walletId
    const isAmountChanged = validatedData.amount && validatedData.amount !== existingTransaction.amount
    const isTypeChanged = validatedData.type && validatedData.type !== existingTransaction.type

    if (isWalletChanged || isAmountChanged || isTypeChanged) {
      // First, reverse the effect of the old transaction
      const oldAmount = existingTransaction.type === 'income' 
        ? -existingTransaction.amount 
        : existingTransaction.amount

      await db
        .collection('wallets')
        .updateOne(
          { _id: new ObjectId(existingTransaction.walletId) },
          { $inc: { balance: oldAmount } }
        )

      // Then apply the new transaction effect
      const newWalletId = validatedData.walletId || existingTransaction.walletId
      const newAmount = validatedData.amount || existingTransaction.amount
      const newType = validatedData.type || existingTransaction.type
      const balanceChange = newType === 'income' ? newAmount : -newAmount

      await db
        .collection('wallets')
        .updateOne(
          { _id: new ObjectId(newWalletId) },
          { $inc: { balance: balanceChange } }
        )
    }

    // Update the transaction
    await db
      .collection('transactions')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

    // Fetch and return the updated transaction
    const updatedTransaction = await db
      .collection('transactions')
      .findOne({ _id: new ObjectId(id) })

    return NextResponse.json(serializeTransaction(updatedTransaction))
  } catch (error) {
    console.error('Error updating transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Delete a specific transaction
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
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    // Check if transaction exists
    const existingTransaction = await db
      .collection('transactions')
      .findOne({ _id: new ObjectId(id) })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Reverse the wallet balance effect
    const balanceChange = existingTransaction.type === 'income' 
      ? -existingTransaction.amount 
      : existingTransaction.amount

    await db
      .collection('wallets')
      .updateOne(
        { _id: new ObjectId(existingTransaction.walletId) },
        { $inc: { balance: balanceChange } }
      )

    // Delete the transaction
    await db
      .collection('transactions')
      .deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
