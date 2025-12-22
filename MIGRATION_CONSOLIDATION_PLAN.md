# Migration Consolidation Plan

## Current State
- 30 migration files
- Multiple "fix" migrations that patch earlier ones
- Conflicting triggers (014 and 021) causing user creation errors
- Two files starting with `001_`

## Consolidation Strategy

### Keep (Core Features - Already Applied)
These migrations add distinct features and should stay:

1. ✅ **010_create_comments_table.sql** - Comments system
2. ✅ **015_create_user_behavior_table.sql** - User behavior tracking
3. ✅ **022_enable_realtime.sql** - Realtime subscriptions
4. ✅ **023_account_deletion_functions.sql** - Account deletion (GDPR)
5. ✅ **024_setup_account_deletion_cron.sql** - Deletion cron
6. ✅ **025_add_deletion_warning_tracking.sql** - Warning tracking
7. ✅ **026_setup_deletion_warning_cron.sql** - Warning cron
8. ✅ **027_add_data_export_function.sql** - Data export (GDPR)
9. ✅ **028_add_like_count_functions.sql** - Like system
10. ✅ **029_consolidate_profile_triggers.sql** - THE FIX (updated)

### Archive (Obsolete/Problematic)
These can be moved to `supabase/migrations/archive/` for reference:

1. 📦 **001_fix_notifications.sql** - Duplicate numbering
2. 📦 **002_seed_sample_data.sql** - Sample data (not needed in production)
3. 📦 **003_seed_without_user.sql** - More sample data
4. 📦 **004_fix_rls_policies.sql** - Should be merged into 001
5. 📦 **005_fix_drafts_schema.sql** - Should be merged into 001
6. 📦 **006_add_day_to_activities.sql** - Should be merged into 001
7. 📦 **007_add_follows_and_likes.sql** - Partial implementation
8. 📦 **008_add_user_settings_columns.sql** - Should be merged into 001
9. 📦 **009_add_avatar_path_to_profiles.sql** - Should be merged into 001
10. 📦 **011_enhance_expenses.sql** - Should be merged into 001
11. 📦 **012_comment_notifications.sql** - Merged with 010
12. 📦 **013_add_onboarding_fields.sql** - Should be merged into 001
13. 📦 **014_add_profile_creation_trigger.sql** - ⚠️ CAUSES CONFLICTS
14. 📦 **016_fix_user_preferences_schema.sql** - Merged with 015
15. 📦 **017_add_missing_profile_columns.sql** - Should be merged into 001
16. 📦 **018_fix_metrics_rls.sql** - Merged with metrics
17. 📦 **019_backfill_itinerary_metrics.sql** - Merged with metrics
18. 📦 **020_notification_triggers.sql** - Merged with notifications
19. 📦 **021_fix_profile_creation_race_condition.sql** - ⚠️ CAUSES CONFLICTS

### Create New Consolidated Schema
**NEW: 001_initial_schema_consolidated.sql**
- Merge: 001_initial_schema + all the "fix" and "add column" migrations
- Include all final schema changes
- Proper RLS policies
- All required columns
- Clean, production-ready

## Proposed File Structure

```
supabase/migrations/
├── 001_initial_schema_consolidated.sql  (NEW - complete schema)
├── 002_comments_system.sql              (renamed from 010)
├── 003_user_behavior_tracking.sql       (renamed from 015)
├── 004_realtime_subscriptions.sql       (renamed from 022)
├── 005_account_deletion_gdpr.sql        (consolidate 023-026)
├── 006_data_export_gdpr.sql             (renamed from 027)
├── 007_likes_system.sql                 (renamed from 028)
├── 008_profile_creation_fix.sql         (renamed from 029)
└── archive/
    └── [all obsolete migrations]
```

## Recommendation

Since migrations 014 and 021 are already causing problems, I recommend:

**Option A: Clean Slate (SAFEST)**
1. Keep all existing migrations in `archive/` folder
2. Create comprehensive consolidated migrations
3. Document which new migration replaces which old ones
4. Apply new migrations to fresh databases going forward
5. Keep migration 029 for fixing existing databases

**Option B: In-Place Cleanup**
1. Move problematic migrations to `archive/`
2. Rename remaining migrations sequentially
3. Keep migration 029 as the final fix
4. Risk: May confuse Supabase migration tracking

Which option do you prefer?
