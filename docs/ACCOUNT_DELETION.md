# Account Deletion Feature

## Overview

Tinerary implements a **30-day grace period** for account deletions to protect users from accidental data loss while complying with privacy regulations (GDPR, CCPA).

## User Flow

### 1. Initiating Deletion

1. User navigates to **Settings** → **Account**
2. Scrolls to **Danger Zone** section
3. Clicks **Delete Account** button
4. Confirmation dialog appears with warnings

### 2. Confirmation Requirements

Users must:
- ✅ Read the list of what will be deleted
- ✅ Check the acknowledgment box
- ✅ Type `DELETE MY ACCOUNT` exactly
- ✅ Click the final "Delete My Account" button

### 3. What Happens Immediately

- Account is **soft-deleted** (marked for deletion)
- User is **signed out** immediately
- `account_deleted_at` timestamp is set
- `deletion_scheduled_for` is set to 30 days from now
- Account becomes hidden from public view

### 4. Grace Period (30 Days)

- User can **cancel deletion** by simply logging in again
- Auto-cancel trigger restores the account automatically
- User receives all data back intact
- No data is lost during grace period

### 5. Permanent Deletion (After 30 Days)

- Cron job runs daily at 2:00 AM UTC
- Accounts past their `deletion_scheduled_for` date are permanently deleted
- User record is removed from `auth.users`
- All related data is cascade-deleted:
  - Profile information
  - Itineraries (public and private)
  - Activities and plans
  - Comments and interactions
  - Packing lists and expenses
  - Saved items and likes
  - All user-generated content

## Technical Implementation

### Database Schema

```sql
-- Profiles table has these columns:
account_deleted_at TIMESTAMP WITH TIME ZONE    -- When user requested deletion
deletion_scheduled_for TIMESTAMP WITH TIME ZONE -- When permanent deletion will occur (30 days later)
```

### Functions

#### 1. `delete_expired_accounts()`
- Permanently deletes accounts past grace period
- Returns count of deleted accounts
- Called daily by cron job

```sql
SELECT * FROM delete_expired_accounts();
```

#### 2. `cancel_account_deletion(user_id)`
- Manually cancel a scheduled deletion
- Clears deletion timestamps

```sql
SELECT cancel_account_deletion('user-id-here');
```

#### 3. `get_accounts_scheduled_for_deletion()`
- View all accounts pending deletion
- Shows days until deletion

```sql
SELECT * FROM get_accounts_scheduled_for_deletion();
```

#### 4. `auto_cancel_deletion_on_login()` (Trigger)
- Automatically restores account on login
- Triggered when user creates new session

### Cron Job

```sql
-- Runs daily at 2:00 AM UTC
Name: delete-expired-accounts-daily
Schedule: 0 2 * * *
```

### Row Level Security (RLS)

Soft-deleted profiles are hidden from public view:
- Other users cannot see deleted profiles
- User can still see their own deleted profile (to cancel deletion)

## Monitoring

### View Deletion Status

```sql
SELECT * FROM account_deletion_monitoring;
```

Returns:
- `accounts_pending_deletion` - Total accounts in grace period
- `accounts_ready_for_deletion` - Accounts ready to be permanently deleted
- `next_deletion_date` - When next deletion will occur
- `cron_schedule` - Cron job schedule
- `cron_active` - Whether cron job is active

### Manual Cleanup

To manually delete expired accounts immediately:

```sql
SELECT * FROM delete_expired_accounts();
```

## Testing

### Test the Full Flow

1. **Start Deletion:**
   ```bash
   # Navigate to http://localhost:3000/settings
   # Go to Account tab
   # Click Delete Account
   # Complete confirmation
   ```

2. **Verify Soft Delete:**
   ```sql
   SELECT id, email, account_deleted_at, deletion_scheduled_for
   FROM profiles
   WHERE account_deleted_at IS NOT NULL;
   ```

3. **Test Cancellation:**
   ```bash
   # Log in with the deleted account
   # Account should be restored automatically
   ```

4. **Verify Restoration:**
   ```sql
   SELECT id, email, account_deleted_at, deletion_scheduled_for
   FROM profiles
   WHERE id = 'user-id-here';
   -- Both timestamps should be NULL
   ```

5. **Test Permanent Deletion (Fast-forward):**
   ```sql
   -- Manually set deletion date to past
   UPDATE profiles
   SET deletion_scheduled_for = NOW() - INTERVAL '1 day'
   WHERE id = 'test-user-id';

   -- Run cleanup
   SELECT * FROM delete_expired_accounts();

   -- Verify deletion
   SELECT * FROM auth.users WHERE id = 'test-user-id';
   -- Should return no rows
   ```

## Privacy & Compliance

### GDPR Compliance

- ✅ Right to erasure (Article 17)
- ✅ 30-day grace period for accidental deletions
- ✅ Complete data removal after grace period
- ✅ User can cancel deletion

### CCPA Compliance

- ✅ Provides mechanism for data deletion
- ✅ Permanent removal of personal information
- ✅ Cascade deletes all related data

## Migrations

Run these migrations in order:

1. `013_add_onboarding_fields.sql` - Adds deletion columns
2. `023_account_deletion_functions.sql` - Adds deletion functions
3. `024_setup_account_deletion_cron.sql` - Sets up cron job

## Files

- **UI Component:** `/components/delete-account-dialog.tsx`
- **Settings Page:** `/components/account-settings.tsx`
- **Migrations:** `/supabase/migrations/023_*.sql`, `/supabase/migrations/024_*.sql`
- **Documentation:** `/docs/ACCOUNT_DELETION.md` (this file)

## Support & Recovery

If a user accidentally deleted their account:

1. **Within 30 days:**
   - User can simply log in to restore account
   - All data will be intact

2. **After 30 days:**
   - Data is permanently deleted
   - Cannot be recovered
   - User must create new account

## Future Enhancements

- [ ] Email notification before permanent deletion (7 days warning)
- [ ] Export user data before deletion (GDPR requirement)
- [ ] Admin dashboard to monitor deletions
- [ ] Anonymize instead of delete (for analytics)
