# Database Migration Documentation

## Overview

This document outlines the database migration process for the Personal Finance App, transitioning from MongoDB Realm Web SDK to Next.js with native MongoDB driver for improved performance, maintainability, and long-term sustainability.

## Sprint 6: Database Schema Migration (Tasks 89-91)

### ✅ Completed Tasks

#### Task 89: Database Schema Design

- **Status**: ✅ Complete
- **Files Created**:
  - `lib/database/schema.ts` - Optimized MongoDB schema definitions
  - Type definitions for all core entities (Transactions, Categories, Wallets, Keyword Mappings)
  - Index configurations for optimal query performance
  - Validation schemas and migration helpers

#### Task 90: Database Migration Implementation

- **Status**: ✅ Complete
- **Files Created**:
  - `lib/database/migration.ts` - Database migration utilities
  - Index creation and optimization
  - Default data seeding (categories, wallets, keyword mappings)
  - Database validation and integrity checks

#### Task 91: Backup and Recovery Procedures

- **Status**: ✅ Complete
- **Files Created**:
  - `lib/database/backup.ts` - Comprehensive backup and recovery system
  - `scripts/db-migration.ts` - CLI tool for migration operations
  - Full and incremental backup capabilities
  - Disaster recovery procedures
  - Automated backup scheduling framework

## Database Schema

### Core Collections

1. **transactions**
   - Stores all financial transactions (income/expense)
   - Optimized indexes for date, category, wallet, and type queries
   - Audit fields (createdAt, updatedAt, version)

2. **categories**
   - Manages transaction categories
   - Unique constraints on category names
   - Default system categories included

3. **wallets**
   - Manages user wallets/accounts
   - Balance tracking and currency support
   - Default wallet initialization

4. **keywordMappings**
   - LLM integration for Vietnamese phrase mapping
   - Confidence scoring and frequency tracking
   - Pre-configured Vietnamese keywords

### Index Strategy

The schema includes comprehensive indexing for:

- **Query Performance**: Date ranges, category filtering, wallet operations
- **Uniqueness**: Category and wallet name constraints
- **Analytics**: Aggregation queries for dashboard and insights
- **Future Scaling**: User-scoped indexes for multi-user support

## Migration Tools

### CLI Commands

```bash
# Run complete database migration
npm run db:migrate

# Create backups
npm run db:backup           # Full backup
npm run db:backup:full      # Explicit full backup
npm run db:backup:incremental  # Incremental backup

# List available backups
npm run db:list-backups

# Restore from backup
npm run db:restore [backup-id]

# Disaster recovery
npm run db:disaster-recovery

# Cleanup old backups
npm run db:cleanup

# Show help
npm run db:help
```

### Environment Configuration

Update `.env.local` with your MongoDB configuration:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

DATABASE_NAME=personal-finance
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
```

## Migration Process

### Step 1: Database Setup

1. **Install Dependencies**: Ensure all packages are installed

   ```bash
   npm install
   ```

2. **Configure Environment**: Copy and update environment variables

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB connection details
   ```

3. **Run Migration**: Execute the complete migration
   ```bash
   npm run db:migrate
   ```

### Step 2: Data Migration (If Needed)

If you have existing data in MongoDB Realm:

1. **Export Existing Data**: Use the Realm Data API to export current data
2. **Transform Data**: Convert from Realm format to new schema
3. **Import Data**: Use the migration tools to import transformed data
4. **Validate**: Run database validation to ensure integrity

### Step 3: Application Update

1. **Update API Routes**: Ensure all Next.js API routes use the new schema
2. **Update Frontend**: Verify all components work with new data structure
3. **Test Integration**: Run comprehensive tests to ensure functionality

## Backup Strategy

### Automatic Backups

- **Full Backups**: Weekly (recommended for production)
- **Incremental Backups**: Daily (captures only changes)
- **Retention Policy**: 30 days (configurable)
- **Compression**: Enabled for storage efficiency

### Manual Backups

Before any major changes:

```bash
npm run db:backup:full
```

### Disaster Recovery

Complete recovery process:

```bash
npm run db:disaster-recovery
```

This will:

1. Find the latest full backup
2. Validate backup integrity
3. Restore complete database
4. Validate recovery success

## Performance Optimizations

### Database Indexes

- **Transaction Queries**: Optimized for date ranges and filtering
- **Category Operations**: Fast lookups and unique constraints
- **Wallet Operations**: Balance calculations and updates
- **LLM Integration**: Keyword matching and frequency analysis

### Query Patterns

- **Dashboard Queries**: Pre-indexed for financial summaries
- **Analytics**: Optimized aggregation pipelines
- **Search Operations**: Text indexing for descriptions and keywords
- **Audit Trails**: Efficient timestamp-based queries

## Security Considerations

### Database Security

- **Connection Security**: SSL/TLS encryption for Atlas connections
- **Authentication**: Database user authentication required
- **Access Control**: Principle of least privilege
- **Backup Encryption**: Optional encryption for sensitive data

### Application Security

- **Input Validation**: Zod schemas for all data validation
- **SQL Injection Prevention**: MongoDB driver handles parameterization
- **Data Sanitization**: Clean user inputs before storage
- **Audit Logging**: Track all database operations

## Monitoring and Maintenance

### Health Checks

The migration includes validation tools:

```bash
# Validate database integrity
npm run db:migrate  # Includes validation step
```

### Performance Monitoring

- **Index Usage**: Monitor index effectiveness
- **Query Performance**: Track slow queries
- **Storage Growth**: Monitor database size
- **Backup Success**: Ensure backups complete successfully

### Maintenance Tasks

- **Index Optimization**: Review and update indexes based on usage
- **Data Cleanup**: Remove old or unnecessary data
- **Backup Maintenance**: Regular cleanup of old backups
- **Schema Evolution**: Plan for future schema changes

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Verify MongoDB URI and credentials
   - Check network connectivity
   - Ensure MongoDB service is running

2. **Migration Errors**
   - Check database permissions
   - Verify schema compatibility
   - Review error logs for specific issues

3. **Backup Failures**
   - Ensure sufficient disk space
   - Check backup directory permissions
   - Verify database connectivity

4. **Performance Issues**
   - Review index usage
   - Check query patterns
   - Monitor resource utilization

### Error Recovery

1. **Failed Migration**: Restore from backup and retry
2. **Corrupted Data**: Use disaster recovery procedures
3. **Index Issues**: Rebuild indexes using migration tools
4. **Connection Issues**: Check configuration and retry

## Next Steps

After completing Sprint 6 Database Migration:

1. **Testing & Validation (Tasks 92-94)**
   - Comprehensive API endpoint testing
   - Data migration validation
   - Frontend functionality verification

2. **Deployment Migration (Tasks 95-98)**
   - Production deployment pipeline
   - Environment variable configuration
   - Staged migration with rollback plan

3. **Future Sprints**
   - Sprint 7: Lending and Borrowing features
   - Sprint 8: Spending Insights and reporting
   - Sprint 9: Notification system

## References

- [MongoDB Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)
- [Next.js with MongoDB](https://nextjs.org/learn/dashboard-app/setting-up-your-database)
- [Database Migration Strategies](https://martinfowler.com/articles/evodb.html)
- [Backup and Recovery Best Practices](https://docs.mongodb.com/manual/core/backups/)

---

**Sprint 6 Database Migration Status**: ✅ **COMPLETE**

- ✅ Task 89: Database Schema Design
- ✅ Task 90: Migration Implementation
- ✅ Task 91: Backup and Recovery Procedures

**Ready for Next Phase**: Testing & Validation (Tasks 92-94)
