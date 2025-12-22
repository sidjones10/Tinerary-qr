# Database Migrations

This directory contains the database migrations for Tinerary QR in a clean, organized structure.

## Active Migrations (Apply in Order)

### 001_initial_schema.sql
**Core database schema**
- Tables: profiles, itineraries, activities, packing_items, expenses, drafts, saved_itineraries, notifications
- RLS policies for all tables
- Initial indexes and constraints
- Foundational structure for the entire application

### 002_comments_system.sql
**Comments and discussions**
- Creates `comments` table for itinerary discussions
- TikTok-style comment threading
- Comment metrics tracking
- RLS policies for comments

### 003_user_behavior_tracking.sql
**User analytics and preferences**
- `user_behavior` table for tracking interactions
- `user_preferences` table for personalization
- Discovery algorithm data collection
- Privacy-compliant tracking

### 004_realtime_subscriptions.sql
**Real-time updates**
- Enables Supabase Realtime on key tables
- Live notifications
- Live comments
- Live activity updates

### 005_account_deletion_gdpr.sql
**Account deletion (GDPR Article 17)**
- Soft delete functionality
- 30-day grace period before permanent deletion
- Scheduled deletion functions
- Privacy compliance

### 006_data_export_gdpr.sql
**Data portability (GDPR Article 20)**
- Complete user data export in JSON format
- Includes: profile, itineraries, comments, saved items, notifications
- Privacy compliance for data access requests

### 007_likes_system.sql
**Social engagement - Likes**
- Like/unlike functionality
- Automatic like count tracking via triggers
- Optimistic UI support
- Metrics integration

### 008_profile_creation_fix.sql
**Critical Fix: User signup**
- Ensures all required profile columns exist (email, username, name)
- Consolidates conflicting triggers from previous migrations
- Backfills missing profiles for existing auth users
- **Run this migration if users can't sign up**

## Archive

The `archive/` folder contains 22 obsolete migrations that have been superseded by the active migrations above:

- **Schema fixes** (004, 005, 006, 008, 009, 011, 013, 017): Merged into 001
- **Sample data** (002, 003): Not needed for production
- **Incremental changes** (007, 012, 016, 018, 019, 020): Merged into feature migrations
- **Problematic triggers** (014, 021): Replaced by 008
- **Partial features** (024, 025, 026): Consolidated into 005

These are kept for reference but should NOT be applied to new databases.

## Migration Strategy

### For New Databases
Apply migrations 001-008 in order.

### For Existing Databases
Only apply migrations that haven't been run yet. Check your database's `supabase_migrations.schema_migrations` table.

### For Production Databases with Issues
If experiencing user signup problems, run migration 008 to fix profile creation.

## Important Notes

- **Never edit applied migrations** - Always create new migrations for changes
- **Test migrations locally** before applying to production
- **Backup production** database before running migrations
- **Migration 008 is idempotent** - Safe to run multiple times

## Troubleshooting

### Users Can't Sign Up
Run migration `008_profile_creation_fix.sql`

### Missing Columns Error
Check if all migrations 001-008 have been applied

### Duplicate Key Errors
Migration 008 handles this with `ON CONFLICT` clauses

### View Column Name Errors
Use `DROP VIEW` before `CREATE VIEW` (fixed in newer migrations)

## GDPR Compliance

Migrations 005 and 006 implement GDPR requirements:
- **Right to erasure** (Article 17): 005_account_deletion_gdpr.sql
- **Right to data portability** (Article 20): 006_data_export_gdpr.sql

## Support

For migration issues, check:
1. Supabase dashboard → Database → Migrations
2. `supabase_migrations.schema_migrations` table
3. GitHub issues: https://github.com/sidjones10/Tinerary-qr/issues
