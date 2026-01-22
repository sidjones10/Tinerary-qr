# Migration 017: Add Following System

## Overview
This migration adds a complete social following system to Tinerary, allowing users to follow each other, view followers/following lists, and discover content from people they follow.

## Features Added
- ✅ Follow/unfollow functionality
- ✅ Follower and following counts (auto-updated with triggers)
- ✅ Mutual followers detection
- ✅ Helper functions for common queries
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes

## Database Changes

### New Table: `user_follows`
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
)
```

### Profile Table Updates
```sql
ALTER TABLE profiles
  ADD COLUMN followers_count INTEGER DEFAULT 0,
  ADD COLUMN following_count INTEGER DEFAULT 0;
```

### Helper Functions
- `is_following(follower_id, following_id)` - Check follow status
- `get_followers(user_id, limit, offset)` - Get followers list
- `get_following(user_id, limit, offset)` - Get following list
- `get_mutual_followers(user_id, other_user_id)` - Find mutual connections

### Auto-updating Counts
A trigger automatically updates `followers_count` and `following_count` when users follow/unfollow.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `017_add_follows_system.sql`
5. Click **Run**
6. You should see: "Following system created successfully! ✓"

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual Application via psql
```bash
psql $DATABASE_URL < supabase/migrations/017_add_follows_system.sql
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check table exists
SELECT COUNT(*) FROM follows;

-- Check profile columns exist
SELECT id, followers_count, following_count
FROM profiles
LIMIT 1;

-- Test helper function
SELECT is_following(
  'user-id-1'::uuid,
  'user-id-2'::uuid
);
```

## Integration Steps

After applying the migration:

1. **Profile Pages** - Add `<FollowButton userId={profileUserId} />` component
2. **Follower Lists** - Create `/followers/[userId]/page.tsx`
3. **Following Lists** - Create `/following/[userId]/page.tsx`
4. **Discovery Feed** - Add filter to show content from followed users
5. **Notifications** - Notify users when someone follows them

## Service Layer

The following service is already implemented at `lib/follow-service.ts`:

```typescript
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  toggleFollow,
  getFollowCounts,
  getMutualFollowers
} from '@/lib/follow-service'
```

## UI Components

Pre-built components available:

### FollowButton
```tsx
import { FollowButton } from '@/components/follow-button'

<FollowButton
  userId={profileUserId}
  onFollowChange={(isFollowing) => console.log(isFollowing)}
/>
```

Features:
- Automatic follow status detection
- Loading states
- Confetti animation on follow
- Toast notifications
- Optimistic UI updates

## Security

The migration includes RLS policies:

- ✅ Anyone can view follows (public profiles)
- ✅ Users can only follow as themselves
- ✅ Users can only unfollow their own follows
- ✅ No self-following allowed (CHECK constraint)
- ✅ No duplicate follows (UNIQUE constraint)

## Performance

Indexes created for optimal query performance:

```sql
idx_follows_follower    -- Fast lookup of who user is following
idx_follows_following   -- Fast lookup of user's followers
idx_follows_created_at  -- Ordered by follow date
```

## Testing

After migration, test these scenarios:

1. **Follow someone** - Should increment counts
2. **Unfollow** - Should decrement counts
3. **Try self-follow** - Should fail with constraint error
4. **Follow twice** - Should fail with unique constraint
5. **View followers** - Should show correct list
6. **View following** - Should show correct list
7. **Check mutuals** - Should find mutual followers

## Rollback

If you need to rollback this migration:

```sql
-- Drop all functions
DROP FUNCTION IF EXISTS get_following(UUID, INT, INT);
DROP FUNCTION IF EXISTS get_followers(UUID, INT, INT);
DROP FUNCTION IF EXISTS get_mutual_followers(UUID, UUID);
DROP FUNCTION IF EXISTS is_following(UUID, UUID);
DROP FUNCTION IF EXISTS update_follower_counts();

-- Drop table (will cascade delete all follows)
DROP TABLE IF EXISTS follows;

-- Remove columns from profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS followers_count,
  DROP COLUMN IF EXISTS following_count;
```

## What's Next

After applying this migration:

1. Users can follow each other from profile pages
2. Build a "Following" feed filter on the discovery page
3. Add follow suggestions based on mutual connections
4. Send notifications when users get new followers
5. Show follower counts on profile cards
6. Display mutual followers on profile pages

## Support

If you encounter issues:
- Check Supabase logs in the dashboard
- Verify RLS policies are enabled
- Ensure `profiles` table has correct structure
- Test with SQL Editor before implementing in app

---

**Status**: Ready to apply ✅
**Dependencies**: Requires `profiles` table from migration 001
**Breaking Changes**: None
**Estimated Apply Time**: < 5 seconds
