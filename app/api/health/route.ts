/**
 * Health Check API Endpoint
 *
 * Provides system health status for monitoring and deployment validation
 */

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Test database connectivity
    const client = await clientPromise
    const db = client.db(process.env.DATABASE_NAME || 'personal-finance')

    // Test basic database operations
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c: any) => c.name)

    // Test a simple query to ensure database is responsive
    const transactionCount = await db
      .collection('transactions')
      .countDocuments()
    const categoryCount = await db.collection('categories').countDocuments()
    const walletCount = await db.collection('wallets').countDocuments()

    const responseTime = Date.now() - startTime

    // Health check response
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: {
        status: 'connected',
        collections: collectionNames,
        documentCounts: {
          transactions: transactionCount,
          categories: categoryCount,
          wallets: walletCount,
        },
      },
      api: {
        status: 'operational',
        endpoints: [
          '/api/transactions',
          '/api/categories',
          '/api/wallets',
          '/api/keyword-mappings',
        ],
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    }

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    console.error('Health check failed:', error)

    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
      },
      database: {
        status: 'disconnected',
        error: 'Failed to connect to database',
      },
      api: {
        status: 'degraded',
        error: 'Database connectivity issues',
      },
    }

    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  }
}

// Also handle HEAD requests for simple alive checks
export async function HEAD(request: NextRequest) {
  try {
    // Quick database connectivity check without detailed queries
    const client = await clientPromise
    const db = client.db(process.env.DATABASE_NAME || 'personal-finance')
    await db.admin().ping()

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}
