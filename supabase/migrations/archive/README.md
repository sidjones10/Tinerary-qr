# Archived Migrations

This folder contains 22 obsolete migrations that have been superseded by the consolidated migrations in the parent directory.

## Why These Are Archived

These migrations were created during development and contain:
- Schema fixes that should have been in the initial schema
- Incremental column additions
- Multiple attempts to fix the same issue
- Sample/seed data not needed for production
- Conflicting triggers that caused user signup errors

## Archived Files

### Schema Fixes (Merged into 001_initial_schema.sql)
- `004_fix_rls_policies.sql` - RLS policy corrections
- `005_fix_drafts_schema.sql` - Drafts table fixes
- `006_add_day_to_activities.sql` - Activities schema enhancement
- `008_add_user_settings_columns.sql` - User settings columns
- `009_add_avatar_path_to_profiles.sql` - Avatar path column
- `011_enhance_expenses.sql` - Expenses table enhancements
- `013_add_onboarding_fields.sql` - Onboarding columns
- `017_add_missing_profile_columns.sql` - Missing profile columns

### Sample Data (Not Needed)
- `002_seed_sample_data.sql` - Sample itineraries/events
- `003_seed_without_user.sql` - Demo data without auth

### Duplicate/Conflicting (Causes Issues)
- `001_fix_notifications.sql` - Duplicate numbering, notifications fix
- `014_add_profile_creation_trigger.sql` - ⚠️ CAUSES CONFLICTS with 021
- `021_fix_profile_creation_race_condition.sql` - ⚠️ CAUSES CONFLICTS with 014

### Partial Implementations (Merged into Feature Migrations)
- `007_add_follows_and_likes.sql` - Partial social features (superseded by 028)
- `012_comment_notifications.sql` - Merged with comments system (010)
- `016_fix_user_preferences_schema.sql` - Merged with user behavior (015)
- `018_fix_metrics_rls.sql` - Merged with metrics setup
- `019_backfill_itinerary_metrics.sql` - Merged with metrics setup
- `020_notification_triggers.sql` - Merged with notifications

### Consolidated Features
- `024_setup_account_deletion_cron.sql` - Merged into 005
- `025_add_deletion_warning_tracking.sql` - Merged into 005
- `026_setup_deletion_warning_cron.sql` - Merged into 005

## DO NOT USE

**These migrations should NOT be applied to new databases.**

They are kept for:
1. **Historical reference** - Understanding how the schema evolved
2. **Debugging** - Tracing where certain features came from
3. **Documentation** - Learning what problems were encountered

## The Problem with 014 and 021

Migrations 014 and 021 both create triggers on `auth.users` to auto-create profiles:

- **014**: Created `create_profile_trigger` that sets email, username, name
- **021**: Tried to drop a different trigger name, so 014 remained active
- **021**: Created `on_auth_user_created` trigger that only sets name

Result: Both triggers fire on signup, causing conflicts and errors.

**Solution**: Migration 008 consolidates both and adds all missing columns.

## Migration History Lesson

This archive demonstrates common migration anti-patterns:

❌ **Don't**: Create "fix" migrations for schema issues
✅ **Do**: Plan schema carefully upfront

❌ **Don't**: Add columns in multiple separate migrations
✅ **Do**: Group related schema changes together

❌ **Don't**: Create conflicting triggers
✅ **Do**: Drop old triggers before creating new ones

❌ **Don't**: Guess at column names, check the actual database
✅ **Do**: Verify schema matches code expectations

## If You Need to Reference These

The original functionality is preserved in the active migrations:

| Archived Migration | Now In |
|--------------------|--------|
| 001_fix_notifications | 001_initial_schema |
| 002-003 (seed data) | *Removed* |
| 004-009 (schema fixes) | 001_initial_schema |
| 010 (comments) | 002_comments_system |
| 011-013 (enhancements) | 001_initial_schema |
| 014 (profile trigger) | 008_profile_creation_fix |
| 015 (user behavior) | 003_user_behavior_tracking |
| 016-020 (various fixes) | Respective feature migrations |
| 021 (profile race condition) | 008_profile_creation_fix |
| 022 (realtime) | 004_realtime_subscriptions |
| 023-026 (deletion) | 005_account_deletion_gdpr |

## Questions?

See the main migrations README.md or GitHub issues.
