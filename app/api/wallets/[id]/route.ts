import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '../../../../lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Validation schema for wallet updates
const updateWalletSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  balance: z.number().min(0).optional(),
})

function serializeWallet(wallet: any) {
  return {
    ...wallet,
    _id: wallet._id.toString(),
    id: wallet._id.toString(),
    createdAt:
      wallet.createdAt instanceof Date
        ? wallet.createdAt.toISOString()
        : wallet.createdAt,
    updatedAt:
      wallet.updatedAt instanceof Date
        ? wallet.updatedAt.toISOString()
        : wallet.updatedAt,
  }
}

// GET /api/wallets/[id] - Get a specific wallet
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
        { error: 'Invalid wallet ID' },
        { status: 400 }
      )
    }

    const wallet = await db
      .collection('wallets')
      .findOne({ _id: new ObjectId(id) })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(serializeWallet(wallet))
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}

// PUT /api/wallets/[id] - Update a specific wallet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateWalletSchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid wallet ID' },
        { status: 400 }
      )
    }

    // Check if wallet exists
    const existingWallet = await db
      .collection('wallets')
      .findOne({ _id: new ObjectId(id) })

    if (!existingWallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Update the wallet
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    }

    await db
      .collection('wallets')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

    // Fetch and return the updated wallet
    const updatedWallet = await db
      .collection('wallets')
      .findOne({ _id: new ObjectId(id) })

    return NextResponse.json(serializeWallet(updatedWallet))
  } catch (error) {
    console.error('Error updating wallet:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update wallet' },
      { status: 500 }
    )
  }
}

// DELETE /api/wallets/[id] - Delete a specific wallet
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
        { error: 'Invalid wallet ID' },
        { status: 400 }
      )
    }

    // Check if wallet exists
    const existingWallet = await db
      .collection('wallets')
      .findOne({ _id: new ObjectId(id) })

    if (!existingWallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Check if there are transactions associated with this wallet
    const transactionCount = await db
      .collection('transactions')
      .countDocuments({ walletId: id })

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete wallet with existing transactions. Please move or delete transactions first.'
        },
        { status: 400 }
      )
    }

    // Delete the wallet
    await db
      .collection('wallets')
      .deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      { message: 'Wallet deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting wallet:', error)
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    )
  }
}
