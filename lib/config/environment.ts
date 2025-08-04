/**
 * Environment Variable Configuration and Validation
 *
 * Centralized environment configuration with validation for production deployment
 */

import { z } from 'zod'

// ============================================================================
// ENVIRONMENT SCHEMA VALIDATION
// ============================================================================

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database Configuration
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  DATABASE_NAME: z
    .string()
    .min(1, 'Database name is required')
    .default('personal-finance'),

  // AI Integration
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),

  // Next.js Configuration
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NextAuth URL must be a valid URL'),

  // Optional Configuration
  BACKUP_DIR: z.string().default('./backups'),
  BACKUP_RETENTION_DAYS: z
    .string()
    .default('30')
    .transform(val => parseInt(val, 10)),
  BACKUP_COMPRESSION_ENABLED: z
    .string()
    .default('true')
    .transform(val => val === 'true'),

  // Migration Settings
  MIGRATION_BATCH_SIZE: z
    .string()
    .default('1000')
    .transform(val => parseInt(val, 10)),
  MIGRATION_TIMEOUT: z
    .string()
    .default('300000')
    .transform(val => parseInt(val, 10)),

  // Security Settings (Production)
  DATABASE_SSL: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  DATABASE_AUTH_SOURCE: z.string().optional(),

  // Vercel Settings
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
})

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env)

    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      validateProductionEnvironment(env)
    }

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      )
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}`
      )
    }
    throw error
  }
}

function validateProductionEnvironment(env: any) {
  // Validate MongoDB URI format for production
  if (
    env.NODE_ENV === 'production' &&
    !env.MONGODB_URI.includes('mongodb+srv://')
  ) {
    console.warn(
      '⚠️ Production should use MongoDB Atlas (mongodb+srv://) connection string'
    )
  }

  // Validate NextAuth URL for production
  if (env.NODE_ENV === 'production' && env.NEXTAUTH_URL.includes('localhost')) {
    throw new Error('Production NEXTAUTH_URL cannot use localhost')
  }

  // Validate API keys are not default values
  if (env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Production requires valid Gemini API key')
  }

  if (env.NEXTAUTH_SECRET === 'your_nextauth_secret_here') {
    throw new Error('Production requires secure NextAuth secret')
  }

  // Security recommendations
  if (env.NODE_ENV === 'production') {
    console.log('🔒 Production security checklist:')
    console.log('  ✅ MongoDB URI configured')
    console.log('  ✅ Gemini API key configured')
    console.log('  ✅ NextAuth secret configured')
    console.log('  ✅ NextAuth URL configured')

    if (!env.DATABASE_SSL) {
      console.warn('  ⚠️ Consider enabling DATABASE_SSL for production')
    }
  }
}

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

export const config = (() => {
  try {
    return validateEnvironment()
  } catch (error) {
    console.error('❌ Environment configuration error:', error)

    // In development, provide helpful error messages
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 To fix this issue:')
      console.log('1. Copy .env.example to .env.local')
      console.log('2. Update the environment variables with your values')
      console.log('3. Restart the development server\n')
    }

    throw error
  }
})()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get MongoDB connection string with database name
 */
export function getMongoConnectionString(): string {
  return config.MONGODB_URI
}

/**
 * Get database name
 */
export function getDatabaseName(): string {
  return config.DATABASE_NAME
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return config.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development'
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  if (config.VERCEL_URL) {
    return `https://${config.VERCEL_URL}`
  }

  if (config.NEXTAUTH_URL) {
    return config.NEXTAUTH_URL
  }

  return 'http://localhost:3000'
}

/**
 * Generate secure NextAuth secret
 */
export function generateNextAuthSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error('This function should only be called on the server')
  }

  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('base64')
}

// ============================================================================
// ENVIRONMENT INFO LOGGING
// ============================================================================

export function logEnvironmentInfo() {
  if (isDevelopment()) {
    console.log('🔧 Development Environment Configuration:')
    console.log(`  Database: ${config.DATABASE_NAME}`)
    console.log(`  MongoDB: ${config.MONGODB_URI.split('@')[1] || 'localhost'}`)
    console.log(
      `  Gemini API: ${config.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`
    )
    console.log(
      `  NextAuth: ${config.NEXTAUTH_SECRET ? '✅ Configured' : '❌ Missing'}`
    )
  }

  if (isProduction()) {
    console.log('🚀 Production Environment:')
    console.log(`  Database: ${config.DATABASE_NAME}`)
    console.log(`  Environment: ${config.NODE_ENV}`)
    console.log(`  Vercel: ${config.VERCEL_ENV || 'Not detected'}`)
    console.log(`  URL: ${getBaseUrl()}`)
  }
}

// Log environment info on module load
if (typeof window === 'undefined') {
  logEnvironmentInfo()
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EnvironmentConfig = z.infer<typeof envSchema>

export default config
