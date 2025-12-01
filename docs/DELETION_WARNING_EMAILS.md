# Account Deletion Warning Emails

## Overview

Tinerary sends **7-day warning emails** to users before their account is permanently deleted. This provides an additional safety net and improves compliance with privacy regulations.

## User Experience

### Timeline

```
Day 0: User requests account deletion
  ↓
Day 23: System sends warning email (7 days before deletion)
  ↓
Day 30: Account permanently deleted (if not cancelled)
```

### Warning Email Content

**Subject:** ⚠️ Your Tinerary Account Will Be Deleted in X Days

**Content includes:**
- ⚠️ Warning header (red background)
- Deletion date (formatted clearly)
- Days remaining countdown
- List of what will be deleted
- ✅ Green "Cancel Deletion" button linking to /auth
- Support contact information

## Technical Implementation

### Database Schema

**New Column:**
```sql
ALTER TABLE profiles
ADD COLUMN deletion_warning_sent_at TIMESTAMP WITH TIME ZONE;
```

**Purpose:** Tracks when warning email was sent to prevent duplicates

### Database Functions

#### 1. `get_accounts_needing_deletion_warning()`

Returns accounts that need warning emails:
- 7 days or less until deletion
- Haven't received warning yet
- Account is marked for deletion

```sql
SELECT * FROM get_accounts_needing_deletion_warning();
```

**Returns:**
- `user_id` - UUID
- `email` - Email address
- `name` - User's name
- `username` - Username
- `deletion_scheduled_for` - Deletion date
- `days_until_deletion` - Integer (1-7)

#### 2. `mark_deletion_warning_sent(user_id)`

Marks that warning email has been sent:

```sql
SELECT mark_deletion_warning_sent('user-id-here');
```

**Prevents:** Sending multiple warnings to the same user

#### 3. `cancel_account_deletion(user_id)`

Updated to also clear the warning flag:

```sql
SELECT cancel_account_deletion('user-id-here');
```

**Resets:**
- `account_deleted_at` → NULL
- `deletion_scheduled_for` → NULL
- `deletion_warning_sent_at` → NULL

### Email Service

**File:** `lib/email-service.ts`

**Function:** `sendAccountDeletionWarningEmail(data)`

**Parameters:**
```typescript
{
  email: string          // User's email
  name?: string          // User's name
  username?: string      // Username
  deletionDate: string   // ISO date string
  daysRemaining: number  // 1-7
}
```

**Returns:**
```typescript
{
  success: boolean
  messageId: string
  preview: boolean  // true in dev mode
}
```

### API Endpoint

**Path:** `/api/cron/send-deletion-warnings`

**Methods:**
- `GET` - Dry run (shows accounts, doesn't send emails)
- `POST` - Actually sends warning emails

**Security:**
- Requires `Authorization: Bearer <CRON_SECRET>`
- Set `CRON_SECRET` in environment variables

**POST Response:**
```json
{
  "success": true,
  "total_accounts": 3,
  "warnings_sent": 3,
  "warnings_failed": 0,
  "results": [
    { "email": "user@example.com", "status": "success" }
  ]
}
```

**GET Response:**
```json
{
  "message": "Accounts that need deletion warnings (dry run)",
  "count": 3,
  "accounts": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "days_until_deletion": 5
    }
  ]
}
```

## Setup Instructions

### Step 1: Run Migrations

```bash
# Apply database migrations
supabase db push

# Or manually run in SQL Editor:
# - 025_add_deletion_warning_tracking.sql
# - 026_setup_deletion_warning_cron.sql
```

### Step 2: Set Environment Variable

Add to `.env.local`:
```bash
CRON_SECRET=your-secure-random-string-here
```

**Generate secure secret:**
```bash
openssl rand -base64 32
```

### Step 3: Setup Cron Job

Choose ONE of these options:

#### Option A: Vercel Cron (Recommended)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-deletion-warnings",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Schedule:** Daily at 3:00 AM UTC

#### Option B: GitHub Actions

Create `.github/workflows/deletion-warnings.yml`:
```yaml
name: Send Deletion Warnings
on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  send-warnings:
    runs-on: ubuntu-latest
    steps:
      - name: Send Deletion Warnings
        run: |
          curl -X POST https://your-domain.com/api/cron/send-deletion-warnings \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option C: External Cron Service

Use services like:
- cron-job.org
- EasyCron
- Heroku Scheduler

**Configure:**
- URL: `https://your-domain.com/api/cron/send-deletion-warnings`
- Method: POST
- Header: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Daily at 3:00 AM

## Testing

### Test the Database Function

```sql
-- Check who needs warnings
SELECT * FROM get_accounts_needing_deletion_warning();

-- Manually set up a test account
UPDATE profiles
SET
  account_deleted_at = NOW(),
  deletion_scheduled_for = NOW() + INTERVAL '5 days',
  deletion_warning_sent_at = NULL
WHERE id = 'test-user-id';

-- Verify they show up
SELECT * FROM get_accounts_needing_deletion_warning();
```

### Test the API Endpoint (Dry Run)

```bash
# GET request - just shows accounts, doesn't send emails
curl http://localhost:3000/api/cron/send-deletion-warnings
```

### Test Sending Actual Emails

```bash
# POST request - sends emails
curl -X POST http://localhost:3000/api/cron/send-deletion-warnings \
  -H "Authorization: Bearer your-cron-secret"
```

### Test Email Template

See email in console logs (dev mode):
```
Email would be sent with the following details:
To: user@example.com
Subject: ⚠️ Your Tinerary Account Will Be Deleted in 5 Days
Content length: XXXX characters
```

### Test Cancellation Flow

1. User receives warning email
2. User clicks "Cancel Deletion & Keep My Account"
3. User logs in
4. Deletion is automatically cancelled (see `auto_cancel_deletion_on_login` trigger)
5. Verify in database:

```sql
SELECT
  account_deleted_at,
  deletion_scheduled_for,
  deletion_warning_sent_at
FROM profiles
WHERE id = 'user-id';
-- All should be NULL after login
```

## Monitoring

### View Deletion Statistics

```sql
SELECT * FROM account_deletion_monitoring;
```

**Returns:**
- `accounts_pending_deletion` - Total in grace period
- `accounts_ready_for_deletion` - Ready to delete now
- `accounts_needing_warning` - Need warning email
- `warnings_sent` - Total warnings sent
- `next_deletion_date` - Next scheduled deletion
- `deletion_cron_schedule` - Cron schedule
- `deletion_cron_active` - Whether cron is active

### View Accounts Needing Warnings

```sql
SELECT
  email,
  name,
  days_until_deletion,
  deletion_scheduled_for
FROM get_accounts_needing_deletion_warning()
ORDER BY days_until_deletion ASC;
```

### Check Warning Status for Specific User

```sql
SELECT
  email,
  account_deleted_at,
  deletion_scheduled_for,
  deletion_warning_sent_at,
  EXTRACT(DAY FROM (deletion_scheduled_for - NOW())) as days_remaining
FROM profiles
WHERE id = 'user-id';
```

## Production Email Setup

**⚠️ Important:** The current email service is a MOCK for development.

### For Production, integrate a real email service:

#### Option 1: Resend (Recommended)

```bash
npm install resend
```

**Update `lib/email-service.ts`:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(options: EmailOptions) {
  const { data, error } = await resend.emails.send({
    from: 'Tinerary <noreply@tinerary.app>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  if (error) {
    return { success: false, error }
  }

  return { success: true, messageId: data.id }
}
```

#### Option 2: SendGrid

```bash
npm install @sendgrid/mail
```

#### Option 3: AWS SES

```bash
npm install @aws-sdk/client-ses
```

## Privacy & Compliance

### GDPR Compliance

- ✅ **Right to be forgotten** - Users can delete accounts
- ✅ **Grace period** - 30 days to change mind
- ✅ **Clear communication** - 7-day warning email
- ✅ **Easy cancellation** - One-click to keep account

### CCPA Compliance

- ✅ **Data deletion** - All user data removed after 30 days
- ✅ **Notification** - Warning email before deletion
- ✅ **Opt-out** - Easy to cancel deletion

## Troubleshooting

### Emails Not Sending

**Check:**
1. ✅ Cron job is set up and running
2. ✅ CRON_SECRET is configured correctly
3. ✅ API endpoint is accessible
4. ✅ Email service is configured (production)
5. ✅ Accounts exist that need warnings

**Debug:**
```bash
# Check what would be sent (dry run)
curl GET http://localhost:3000/api/cron/send-deletion-warnings
```

### Duplicate Warnings

**Check:**
```sql
SELECT
  email,
  deletion_warning_sent_at,
  deletion_scheduled_for
FROM profiles
WHERE deletion_warning_sent_at IS NOT NULL;
```

**Fix:** The `mark_deletion_warning_sent` function prevents duplicates automatically.

### Warning Not Reset After Cancellation

**Check:**
```sql
SELECT
  id,
  account_deleted_at,
  deletion_warning_sent_at
FROM profiles
WHERE deletion_warning_sent_at IS NOT NULL
  AND account_deleted_at IS NULL;
-- Should return 0 rows
```

**Fix:** Run cancellation function:
```sql
SELECT cancel_account_deletion('user-id');
```

## Files

- **Migration 025:** `/supabase/migrations/025_add_deletion_warning_tracking.sql`
- **Migration 026:** `/supabase/migrations/026_setup_deletion_warning_cron.sql`
- **Email Service:** `/lib/email-service.ts`
- **API Endpoint:** `/app/api/cron/send-deletion-warnings/route.ts`
- **UI Component:** `/components/delete-account-dialog.tsx`
- **Documentation:** `/docs/DELETION_WARNING_EMAILS.md` (this file)
- **Related Docs:** `/docs/ACCOUNT_DELETION.md`

## Future Enhancements

- [ ] Multiple warning emails (30 days, 7 days, 1 day)
- [ ] Customizable warning schedules per user
- [ ] SMS warnings for high-priority accounts
- [ ] Dashboard for admins to monitor warnings
- [ ] Email templates in multiple languages
- [ ] A/B testing different warning messages
- [ ] Track email open rates and click-through rates
