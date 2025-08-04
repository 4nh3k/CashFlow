# Personal Finance App - Deployment Guide

## Overview

This guide covers the complete deployment process for the Personal Finance App using Next.js and Vercel, including MongoDB Atlas integration, environment configuration, and production best practices.

## Deployment Pipeline (Task 95)

### Platform: Vercel for Next.js

**Why Vercel?**

- Native Next.js optimization and support
- Automatic deployments from Git
- Edge functions for API routes
- Built-in SSL/TLS certificates
- Global CDN for optimal performance
- Seamless environment variable management

### Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  Vercel Platform │───▶│   Production    │
│  (main branch)  │    │   Build & Deploy │    │   Application   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Environment     │    │  MongoDB Atlas  │
                       │  Variables       │    │   Database      │
                       └──────────────────┘    └─────────────────┘
```

### Step 1: Vercel Project Setup

1. **Connect Repository to Vercel**

   ```bash
   # Install Vercel CLI (optional)
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy from project directory
   vercel
   ```

2. **Automatic GitHub Integration**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository: `4nh3k/CashFlow`
   - Choose "Next.js" framework preset
   - Configure deployment settings

### Step 2: Build Configuration

Create optimized build configuration:

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["sin1", "hnd1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3: Environment Variables Configuration

**Required Environment Variables:**

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=personal-finance

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here

# Next.js Configuration
NEXTAUTH_SECRET=your_secure_random_string_here
NEXTAUTH_URL=https://your-app.vercel.app

# Security
NODE_ENV=production
```

### Step 4: Database Configuration

**MongoDB Atlas Production Setup:**

1. **Create Production Cluster**
   - Log into MongoDB Atlas
   - Create new cluster for production
   - Configure network access (allow Vercel IPs)
   - Set up database user with minimal required permissions

2. **Production Database Security**

   ```javascript
   // Connection string format for production
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=PersonalFinanceApp
   ```

3. **Database Indexes** (automatically created via migration)
   ```bash
   # Run migration on production database
   npm run db:migrate
   ```

## Environment Variables & Secrets (Task 96)

### Vercel Environment Variables Setup

1. **Dashboard Configuration**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required environment variables
   - Set appropriate environments (Production, Preview, Development)

2. **Security Best Practices**

   ```bash
   # Generate secure NEXTAUTH_SECRET
   openssl rand -base64 32

   # MongoDB Atlas IP Whitelist
   # Add Vercel's IP ranges or use 0.0.0.0/0 for global access (less secure)
   ```

3. **Environment-Specific Configuration**

   ```javascript
   // Environment variable validation
   const requiredEnvVars = [
     'MONGODB_URI',
     'DATABASE_NAME',
     'GEMINI_API_KEY',
     'NEXTAUTH_SECRET',
     'NEXTAUTH_URL',
   ]

   requiredEnvVars.forEach(envVar => {
     if (!process.env[envVar]) {
       throw new Error(`Missing required environment variable: ${envVar}`)
     }
   })
   ```

### Secrets Management

**Production Secrets Checklist:**

- ✅ MongoDB Atlas connection string (encrypted)
- ✅ Gemini API key (restricted by domain/IP)
- ✅ NextAuth secret (256-bit random string)
- ✅ Database credentials (least privilege principle)

## Staged Migration & Rollback Plan (Task 97)

### Migration Strategy

**Phase 1: Staging Deployment**

```bash
# 1. Deploy to preview branch
git checkout -b production-migration
git push origin production-migration

# 2. Test preview deployment
# Vercel automatically creates preview URL

# 3. Run database migration
npm run db:backup:full  # Create backup before migration
npm run db:migrate      # Run production migration
```

**Phase 2: Data Migration**

```bash
# 1. Export data from current system
npm run db:backup:full

# 2. Validate data integrity
npm run db:list-backups

# 3. Test with production-like data
npm run db:restore [backup-id]
```

**Phase 3: Production Deployment**

```bash
# 1. Merge to main branch
git checkout main
git merge production-migration
git push origin main

# 2. Monitor deployment
vercel logs --follow

# 3. Validate production functionality
curl https://your-app.vercel.app/api/health
```

### Rollback Procedures

**Immediate Rollback (< 5 minutes)**

```bash
# 1. Revert deployment via Vercel Dashboard
# Go to Deployments → Previous Version → Promote to Production

# 2. Or via CLI
vercel rollback
```

**Database Rollback (if needed)**

```bash
# 1. Restore from backup
npm run db:disaster-recovery

# 2. Validate restoration
npm run db:list-backups
npm run db:restore [previous-backup-id]
```

**Emergency Procedures**

1. **Domain Redirect**: Point domain to maintenance page
2. **Database Isolation**: Restrict database access
3. **Incident Response**: Alert team and document issues
4. **Recovery Validation**: Test all critical functionality

### Health Checks

**Automated Monitoring**

```javascript
// app/api/health/route.ts
export async function GET() {
  try {
    // Database connectivity check
    const db = await connectToDatabase()
    const collections = await db.listCollections().toArray()

    // API functionality check
    const testTransaction = await db.collection('transactions').findOne()

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      collections: collections.length,
      version: process.env.npm_package_version,
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
```

## Documentation Update (Task 98)

### Architecture Documentation

**New System Architecture:**

```
Frontend (Next.js 14)
├── App Router Structure
├── Server-Side Rendering
├── API Routes
└── Static Asset Optimization

Backend (Next.js API Routes)
├── MongoDB Native Driver
├── RESTful API Endpoints
├── Data Validation (Zod)
└── Error Handling

Database (MongoDB Atlas)
├── Optimized Schema
├── Performance Indexes
├── Backup Strategy
└── Security Configuration

Deployment (Vercel)
├── Automatic CI/CD
├── Environment Management
├── Global CDN
└── SSL/TLS Termination
```

### Migration Summary

**From:** React + Vite + MongoDB Realm Web SDK
**To:** Next.js 14 + MongoDB Native Driver + Vercel

**Benefits:**

- ✅ Better performance and SEO
- ✅ Unified full-stack TypeScript
- ✅ Professional deployment pipeline
- ✅ Improved database control
- ✅ Enhanced security and monitoring

**Breaking Changes:**

- MongoDB Realm Web SDK → MongoDB Native Driver
- Client-side routing → Next.js App Router
- Vite development → Next.js development server
- Static hosting → Vercel full-stack hosting

### Deployment Checklist

**Pre-Deployment:**

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Security scan passed
- [ ] Performance tests passed
- [ ] Backup created

**Deployment:**

- [ ] Code pushed to main branch
- [ ] Vercel build successful
- [ ] Database connectivity verified
- [ ] API endpoints functional
- [ ] Frontend loading correctly

**Post-Deployment:**

- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup schedule active
- [ ] Team notified
- [ ] Documentation updated

---

## Quick Reference

### Essential Commands

```bash
# Local development
npm run dev

# Database operations
npm run db:migrate
npm run db:backup
npm run db:restore

# Deployment
vercel --prod
vercel logs

# Health check
curl https://your-app.vercel.app/api/health
```

### Support Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **MongoDB Atlas**: [cloud.mongodb.com/support](https://cloud.mongodb.com/support)
- **Emergency Contact**: [Your team contact information]

---

**Status**: Ready for production deployment
**Next Steps**: Execute deployment pipeline and monitor system health
