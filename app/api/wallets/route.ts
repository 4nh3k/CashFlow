import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { z } from 'zod'

// Validation schema for wallet creation
const createWalletSchema = z.object({
  name: z.string().min(1).max(50),
  balance: z.number().min(0).default(0),
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

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('personal-finance')
    const wallets = await db.collection('wallets').find({}).toArray()

    return NextResponse.json(wallets.map(serializeWallet))
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createWalletSchema.parse(body)

    const client = await clientPromise
    const db = client.db('personal-finance')

    const newWallet = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('wallets').insertOne(newWallet)
    const createdWallet = await db
      .collection('wallets')
      .findOne({ _id: result.insertedId })

    return NextResponse.json(serializeWallet(createdWallet), { status: 201 })
  } catch (error) {
    console.error('Error creating wallet:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    )
  }
}
