# Personal Finance App

A comprehensive personal finance management application built with Next.js, TypeScript, and MongoDB, featuring AI-powered transaction categorization and advanced budget management.

## 🚀 Features

- **Transaction Management**: Add, edit, and categorize financial transactions
- **Budget Planning**: Create and track budgets with intelligent alerts
- **Wallet Management**: Manage multiple accounts and payment methods
- **AI Integration**: Automated transaction categorization using Google Gemini AI
- **Real-time Analytics**: Interactive dashboards and financial insights
- **Data Security**: Server-side processing with secure MongoDB integration
- 
## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas (Native Driver)
- **AI/ML**: Google Gemini API
- **State Management**: Redux Toolkit
- **Deployment**: Vercel
- **Development**: Vite, ESLint, Prettier

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account or local MongoDB installation
- Google Gemini API key
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd PersonalFinanceApp
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# Required variables:
# - MONGODB_URI
# - GEMINI_API_KEY
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

### 3. Database Setup

```bash
# For development with existing data migration
npm run db:migrate

# For fresh installation
npm run db:backup
```

### 4. Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### 5. Deployment

```bash
# Deploy to staging
npm run deploy

# Deploy to production
npm run deploy:production

# Check deployment status
npm run deploy:status
```

## 📚 Documentation

- **[Deployment Guide](docs/deployment-guide.md)**: Complete deployment instructions
- **[Database Migration](docs/database-migration.md)**: Data migration procedures
- **[Sprint 6 Architecture](docs/sprint6-architecture.md)**: Technical architecture overview

## 🔧 Development Commands

### Database Operations

```bash
npm run db:migrate          # Run database migration
npm run db:backup           # Create database backup
npm run db:restore          # Restore from backup
npm run db:list-backups     # List available backups
npm run db:cleanup          # Clean old backups
```

### Deployment Operations

```bash
npm run deploy              # Deploy to staging
npm run deploy:production   # Deploy to production
npm run deploy:status       # Check deployment status
npm run deploy:rollback     # Rollback deployment
```

### Development Tools

```bash
npm run dev                 # Start development server
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
npm run type-check          # TypeScript type checking
```

## 🏗️ Project Structure

```
PersonalFinanceApp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Shared utilities
│   ├── database/          # Database operations
│   ├── config/            # Configuration
│   └── mongodb.ts         # MongoDB client
├── src/                   # Legacy React components (being migrated)
│   ├── components/        # React components
│   ├── store/             # Redux store
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── scripts/               # Build and deployment scripts
│   ├── deploy.ts          # Deployment orchestration
│   └── db-migration.ts    # Database migration tools
├── docs/                  # Documentation
└── public/                # Static assets
```

## 🚀 Production Deployment

The application is designed for deployment on Vercel with MongoDB Atlas:

1. **Database**: MongoDB Atlas production cluster
2. **Application**: Vercel serverless functions
3. **CDN**: Vercel Edge Network for static assets
4. **Monitoring**: Health check endpoints and error tracking
5. **Rollback**: Automated rollback on deployment failure

For detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
