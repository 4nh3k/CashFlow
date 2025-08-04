#!/usr/bin/env node

/**
 * Production Deployment Script with Staged Migration and Rollback
 *
 * This script orchestrates the deployment process with safety checks,
 * staged rollout, and automated rollback capabilities.
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// CONFIGURATION
// ============================================================================

interface DeploymentConfig {
  environment: 'staging' | 'production'
  skipHealthChecks: boolean
  skipBackup: boolean
  rollbackOnFailure: boolean
  maxRetries: number
  timeout: number
}

const DEFAULT_CONFIG: DeploymentConfig = {
  environment: 'staging',
  skipHealthChecks: false,
  skipBackup: false,
  rollbackOnFailure: true,
  maxRetries: 3,
  timeout: 300000, // 5 minutes
}

// ============================================================================
// DEPLOYMENT STATE MANAGEMENT
// ============================================================================

interface DeploymentState {
  id: string
  timestamp: string
  environment: string
  status:
    | 'pending'
    | 'deploying'
    | 'testing'
    | 'success'
    | 'failed'
    | 'rolledback'
  steps: DeploymentStep[]
  currentStep: number
  previousDeployment?: string
  rollbackUrl?: string
}

interface DeploymentStep {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startTime?: string
  endTime?: string
  error?: string
  rollbackCommand?: string
}

class DeploymentManager {
  private stateFile: string
  private state: DeploymentState

  constructor() {
    this.stateFile = join(process.cwd(), '.deployment-state.json')
    this.state = this.loadState()
  }

  private loadState(): DeploymentState {
    if (existsSync(this.stateFile)) {
      try {
        return JSON.parse(readFileSync(this.stateFile, 'utf8'))
      } catch (error) {
        console.warn('⚠️ Could not load deployment state, creating new state')
      }
    }

    return this.createNewState()
  }

  private createNewState(): DeploymentState {
    return {
      id: `deploy-${Date.now()}`,
      timestamp: new Date().toISOString(),
      environment: 'staging',
      status: 'pending',
      currentStep: 0,
      steps: [
        { name: 'Pre-deployment checks', status: 'pending' },
        {
          name: 'Database backup',
          status: 'pending',
          rollbackCommand: 'npm run db:restore',
        },
        { name: 'Build application', status: 'pending' },
        { name: 'Deploy to Vercel', status: 'pending' },
        {
          name: 'Database migration',
          status: 'pending',
          rollbackCommand: 'npm run db:rollback',
        },
        { name: 'Health checks', status: 'pending' },
        { name: 'Smoke tests', status: 'pending' },
        {
          name: 'Update DNS/Traffic',
          status: 'pending',
          rollbackCommand: 'vercel --prod --force',
        },
        { name: 'Post-deployment verification', status: 'pending' },
      ],
    }
  }

  private saveState() {
    writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2))
  }

  public updateStep(
    stepIndex: number,
    status: DeploymentStep['status'],
    error?: string
  ) {
    this.state.steps[stepIndex].status = status

    if (status === 'running') {
      this.state.steps[stepIndex].startTime = new Date().toISOString()
    } else if (status === 'success' || status === 'failed') {
      this.state.steps[stepIndex].endTime = new Date().toISOString()
    }

    if (error) {
      this.state.steps[stepIndex].error = error
    }

    this.state.currentStep = stepIndex
    this.saveState()
  }

  public updateStatus(status: DeploymentState['status']) {
    this.state.status = status
    this.saveState()
  }

  public getState(): DeploymentState {
    return this.state
  }

  public setRollbackInfo(url: string, previousDeployment?: string) {
    this.state.rollbackUrl = url
    this.state.previousDeployment = previousDeployment
    this.saveState()
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getErrorMessage(error)
  }
  return String(error)
}

class Deployer {
  private manager: DeploymentManager
  private config: DeploymentConfig

  constructor(config: Partial<DeploymentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.manager = new DeploymentManager()
  }

  public async deploy(): Promise<boolean> {
    console.log('🚀 Starting deployment process...')
    console.log(`📍 Environment: ${this.config.environment}`)
    console.log(`🔧 Configuration:`, this.config)

    this.manager.updateStatus('deploying')

    try {
      // Execute deployment steps
      await this.preDeploymentChecks()
      await this.createBackup()
      await this.buildApplication()
      const deploymentUrl = await this.deployToVercel()
      await this.runDatabaseMigration()
      await this.runHealthChecks(deploymentUrl)
      await this.runSmokeTests(deploymentUrl)
      await this.updateTraffic(deploymentUrl)
      await this.postDeploymentVerification(deploymentUrl)

      this.manager.updateStatus('success')
      console.log('✅ Deployment completed successfully!')
      console.log(`🌐 Application URL: ${deploymentUrl}`)

      return true
    } catch (error) {
      console.error('❌ Deployment failed:', error)
      this.manager.updateStatus('failed')

      if (this.config.rollbackOnFailure) {
        console.log('🔄 Initiating automatic rollback...')
        await this.rollback()
      } else {
        console.log(
          '⚠️ Automatic rollback disabled. Manual intervention required.'
        )
      }

      return false
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    const stepIndex = 0
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🔍 Running pre-deployment checks...')

      // Check environment variables
      await this.checkEnvironmentVariables()

      // Check dependencies
      await this.runCommand('npm audit --audit-level moderate')

      // Check TypeScript compilation
      await this.runCommand('npm run type-check')

      // Check linting
      await this.runCommand('npm run lint')

      // Check tests
      await this.runCommand('npm run test')

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Pre-deployment checks passed')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? getErrorMessage(error) : String(error)
      this.manager.updateStep(stepIndex, 'failed', errorMessage)
      throw new Error(`Pre-deployment checks failed: ${errorMessage}`)
    }
  }

  private async createBackup(): Promise<void> {
    const stepIndex = 1

    if (this.config.skipBackup) {
      console.log('⏭️ Skipping backup (skipBackup = true)')
      this.manager.updateStep(stepIndex, 'success')
      return
    }

    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('💾 Creating database backup...')
      await this.runCommand('npm run db:backup')

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Database backup created')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Backup creation failed: ${getErrorMessage(error)}`)
    }
  }

  private async buildApplication(): Promise<void> {
    const stepIndex = 2
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🔨 Building application...')
      await this.runCommand('npm run build')

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Application built successfully')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Build failed: ${getErrorMessage(error)}`)
    }
  }

  private async deployToVercel(): Promise<string> {
    const stepIndex = 3
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🌐 Deploying to Vercel...')

      let deployCommand = 'vercel --yes'

      if (this.config.environment === 'production') {
        deployCommand += ' --prod'
      }

      const output = await this.runCommand(deployCommand)

      // Extract deployment URL from Vercel output
      const urlMatch = output.match(/https:\/\/[^\s]+/)
      const deploymentUrl = urlMatch ? urlMatch[0] : ''

      if (!deploymentUrl) {
        throw new Error('Could not extract deployment URL from Vercel output')
      }

      this.manager.setRollbackInfo(deploymentUrl)
      this.manager.updateStep(stepIndex, 'success')
      console.log(`✅ Deployed to: ${deploymentUrl}`)

      return deploymentUrl
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Vercel deployment failed: ${getErrorMessage(error)}`)
    }
  }

  private async runDatabaseMigration(): Promise<void> {
    const stepIndex = 4
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🗄️ Running database migration...')
      await this.runCommand('npm run db:migrate')

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Database migration completed')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Database migration failed: ${getErrorMessage(error)}`)
    }
  }

  private async runHealthChecks(url: string): Promise<void> {
    const stepIndex = 5

    if (this.config.skipHealthChecks) {
      console.log('⏭️ Skipping health checks (skipHealthChecks = true)')
      this.manager.updateStep(stepIndex, 'success')
      return
    }

    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🏥 Running health checks...')

      // Check health endpoint
      const healthUrl = `${url}/api/health`
      const response = await fetch(healthUrl)

      if (!response.ok) {
        throw new Error(
          `Health check failed: ${response.status} ${response.statusText}`
        )
      }

      const healthData = await response.json()

      if (healthData.status !== 'healthy') {
        throw new Error(`Application unhealthy: ${JSON.stringify(healthData)}`)
      }

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Health checks passed')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Health checks failed: ${getErrorMessage(error)}`)
    }
  }

  private async runSmokeTests(url: string): Promise<void> {
    const stepIndex = 6
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🧪 Running smoke tests...')

      // Test basic endpoints
      const endpoints = ['/', '/api/health']

      for (const endpoint of endpoints) {
        const testUrl = `${url}${endpoint}`
        console.log(`  Testing: ${testUrl}`)

        const response = await fetch(testUrl)

        if (!response.ok) {
          throw new Error(
            `Smoke test failed for ${endpoint}: ${response.status}`
          )
        }
      }

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Smoke tests passed')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Smoke tests failed: ${getErrorMessage(error)}`)
    }
  }

  private async updateTraffic(url: string): Promise<void> {
    const stepIndex = 7
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🔀 Updating traffic routing...')

      if (this.config.environment === 'production') {
        // For production, promote to production domain
        await this.runCommand(
          'vercel alias set ' + url + ' production-domain.com'
        )
      }

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Traffic routing updated')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(`Traffic update failed: ${getErrorMessage(error)}`)
    }
  }

  private async postDeploymentVerification(url: string): Promise<void> {
    const stepIndex = 8
    this.manager.updateStep(stepIndex, 'running')

    try {
      console.log('🔍 Running post-deployment verification...')

      // Final verification checks
      await this.runHealthChecks(url)

      // Log deployment success
      console.log('📊 Deployment Summary:')
      console.log(`  Environment: ${this.config.environment}`)
      console.log(`  URL: ${url}`)
      console.log(`  Timestamp: ${new Date().toISOString()}`)

      this.manager.updateStep(stepIndex, 'success')
      console.log('✅ Post-deployment verification completed')
    } catch (error) {
      this.manager.updateStep(stepIndex, 'failed', getErrorMessage(error))
      throw new Error(
        `Post-deployment verification failed: ${getErrorMessage(error)}`
      )
    }
  }

  public async rollback(): Promise<void> {
    console.log('🔄 Starting rollback process...')
    this.manager.updateStatus('rolledback')

    const state = this.manager.getState()
    const failedStepIndex = state.currentStep

    try {
      // Execute rollback commands in reverse order
      for (let i = failedStepIndex; i >= 0; i--) {
        const step = state.steps[i]

        if (step.rollbackCommand && step.status === 'success') {
          console.log(`🔙 Rolling back: ${step.name}`)
          await this.runCommand(step.rollbackCommand)
        }
      }

      console.log('✅ Rollback completed successfully')
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      console.log('🚨 Manual intervention required!')
      throw error
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'MONGODB_URI',
      'DATABASE_NAME',
      'GEMINI_API_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ]

    const missing = requiredVars.filter(varName => !process.env[varName])

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }
  }

  private async runCommand(command: string): Promise<string> {
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: this.config.timeout,
        stdio: 'pipe',
      })
      return output
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${getErrorMessage(error)}`)
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'deploy'

  const config: Partial<DeploymentConfig> = {}

  // Parse command line arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--production') {
      config.environment = 'production'
    } else if (arg === '--skip-health-checks') {
      config.skipHealthChecks = true
    } else if (arg === '--skip-backup') {
      config.skipBackup = true
    } else if (arg === '--no-rollback') {
      config.rollbackOnFailure = false
    }
  }

  const deployer = new Deployer(config)

  switch (command) {
    case 'deploy':
      const success = await deployer.deploy()
      process.exit(success ? 0 : 1)
      break

    case 'status':
      const state = new DeploymentManager().getState()
      console.log('📊 Deployment Status:')
      console.log(JSON.stringify(state, null, 2))
      break

    case 'rollback':
      await deployer.rollback()
      break

    default:
      console.log('Usage: npm run deploy [options]')
      console.log('Commands:')
      console.log('  deploy    - Deploy the application')
      console.log('  status    - Show deployment status')
      console.log('  rollback  - Rollback the last deployment')
      console.log('')
      console.log('Options:')
      console.log('  --production         - Deploy to production')
      console.log('  --skip-health-checks - Skip health checks')
      console.log('  --skip-backup        - Skip database backup')
      console.log('  --no-rollback        - Disable automatic rollback')
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment script error:', error)
    process.exit(1)
  })
}
