#!/usr/bin/env node

/**
 * Custom lint fixer for PersonalFinanceApp
 * This script attempts to fix common linting issues automatically
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Function to remove unused variables by prefixing with underscore
function fixUnusedVariables(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Pattern to match unused variable warnings
  const patterns = [
    // Match: function name(unused, used) -> function name(_unused, used)
    /(\w+\s*\(.*?)\b(\w+)(?=\s*[,)])/g,
    // Match: catch (error) when error is unused -> catch (_error)
    /catch\s*\(\s*(\w+)\s*\)/g,
    // Match: const unused = -> const _unused =
    /(\bconst\s+)(\w+)(\s*=)/g,
    // Match: let unused = -> let _unused =
    /(\blet\s+)(\w+)(\s*=)/g,
  ]

  // This is a simplified version - in practice, you'd need more sophisticated parsing
  // For now, let's just handle the most common cases manually

  if (modified) {
    fs.writeFileSync(filePath, content)
    log(`Fixed unused variables in ${filePath}`, 'green')
  }
}

// Function to remove console statements
function removeConsoleStatements(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content

  // Remove console.log, console.error, etc. statements
  content = content.replace(
    /\s*console\.(log|error|warn|info|debug)\([^;]*\);?\n?/g,
    ''
  )

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content)
    log(`Removed console statements from ${filePath}`, 'green')
    return true
  }
  return false
}

function main() {
  log('Running comprehensive lint fix...', 'blue')

  try {
    // Step 1: Run standard ESLint fix
    log('Step 1: Running standard ESLint fixes...', 'yellow')
    execSync('npm run lint:fix', { stdio: 'inherit' })

    // Step 2: Format with Prettier
    log('Step 2: Formatting with Prettier...', 'yellow')
    execSync('npm run lint:format', { stdio: 'inherit' })

    // Step 3: Run final lint check
    log('Step 3: Running final lint check...', 'yellow')
    try {
      execSync('npm run lint:check', { stdio: 'inherit' })
      log('All lint issues fixed successfully!', 'green')
    } catch (error) {
      log('Some lint issues remain - manual intervention required', 'yellow')
    }
  } catch (error) {
    log('Error during lint fix process:', 'red')
    console.error(error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  fixUnusedVariables,
  removeConsoleStatements,
  main,
}
