# Onboarding Flow Documentation

## Overview

Tinerary features a **3-step onboarding flow** for new users to help them get started quickly and personalize their experience.

## User Experience

### When Onboarding Triggers

- ✅ After user signs up for the first time
- ✅ When `onboarding_completed = false` in profile
- ✅ Shows as a modal dialog overlay on any page

### Onboarding Steps

#### **Step 1: Welcome Screen** 🎉
- **Title:** "Welcome to Tinerary, [name]!"
- **Content:**
  - Overview of key features:
    - 📅 Create Itineraries - Build detailed day-by-day plans
    - 👥 Collaborate with Friends - Invite, share lists, split expenses
    - ❤️ Discover & Get Inspired - Explore public itineraries
- **Actions:** Next, Skip

#### **Step 2: Interest Selection** 🎯
- **Title:** "What type of trips do you enjoy?"
- **Content:**
  - Multi-select interest cards:
    - 🏖️ Beach & Coastal
    - 🏙️ City Exploration
    - 🏔️ Nature & Hiking
    - 🎒 Adventure Sports
    - 🏛️ Culture & History
    - 🍜 Food & Culinary
    - 🧘 Wellness & Spa
    - ❄️ Winter Sports
- **Purpose:** Personalize user feed based on interests
- **Actions:** Back, Next, Skip
- **Saved to:** `profiles.interests` (text array)

#### **Step 3: Get Started** 🚀
- **Title:** "Ready to plan your first trip?"
- **Content:**
  - Two action cards:
    1. **Create Your First Itinerary** → Routes to `/create`
    2. **Explore Public Itineraries** → Routes to `/app`
- **Actions:** Back, Get Started, Skip

### Progress Tracking

- Progress bar shows completion: `Step X of 3`
- Visual progress: 0% → 33% → 66% → 100%

## Technical Implementation

### Database Schema

```sql
-- profiles table columns
onboarding_completed BOOLEAN DEFAULT false
interests TEXT[] DEFAULT '{}'
```

**Migration:** `013_add_onboarding_fields.sql`

### Components

#### 1. **OnboardingFlow** (`components/onboarding-flow.tsx`)
Main onboarding dialog component with step management.

**Props:**
- `userId: string` - User ID to save progress
- `userName?: string` - Display name for personalization
- `onComplete: () => void` - Callback when onboarding completes

**Features:**
- Step navigation (Next/Back)
- Skip button on all steps
- Progress bar
- Interest selection state management
- Saves to database on completion

#### 2. **OnboardingWrapper** (`components/onboarding-wrapper.tsx`)
Wrapper that checks if user needs onboarding.

**Logic:**
```typescript
if (user && !profile.onboarding_completed) {
  // Show onboarding
  return <OnboardingFlow ... />
}
// Show normal app
return {children}
```

**Integration:** Wraps entire app in `app/layout.tsx`

### Data Flow

```
User Signs Up
  ↓
Profile created with onboarding_completed = false
  ↓
OnboardingWrapper detects incomplete onboarding
  ↓
OnboardingFlow modal appears
  ↓
User completes/skips onboarding
  ↓
Database updated:
  - onboarding_completed = true
  - interests = [selected interests]
  ↓
OnboardingFlow closes
  ↓
User sees normal app
```

### Completion Logic

```typescript
// Save interests and mark as completed
await supabase
  .from("profiles")
  .update({
    interests: selectedInterests,
    onboarding_completed: true,
  })
  .eq("id", userId)
```

## Testing

### Test New User Onboarding

1. **Create a new account:**
   ```
   http://localhost:3000/auth?tab=signup
   ```

2. **Expected behavior:**
   - After signup, onboarding modal appears immediately
   - Cannot close modal by clicking outside
   - Must complete or skip to proceed

3. **Verify interests saved:**
   ```sql
   SELECT id, email, onboarding_completed, interests
   FROM profiles
   WHERE onboarding_completed = true;
   ```

### Reset Onboarding for Testing

```sql
-- Reset specific user
UPDATE profiles
SET onboarding_completed = false,
    interests = '{}'
WHERE id = 'user-id-here';

-- Reset all users (for testing)
UPDATE profiles
SET onboarding_completed = false,
    interests = '{}';
```

### Test Skip Functionality

1. Click "Skip" on any step
2. Verify:
   - Onboarding marked as completed
   - User returned to normal app
   - Modal doesn't reappear on refresh

### Test Interest Persistence

1. Complete onboarding and select interests
2. Check database:
   ```sql
   SELECT interests FROM profiles WHERE id = 'user-id';
   ```
3. Should show selected interests as array

## User Benefits

### For New Users

- ✅ **Clear value proposition** - Understands what the app does
- ✅ **Personalized experience** - Feed tailored to their interests
- ✅ **Guided first actions** - Clear next steps (create or explore)
- ✅ **Quick start** - Can skip if already familiar

### For Product

- ✅ **Better engagement** - Users understand features upfront
- ✅ **Personalization data** - Interests for recommendation engine
- ✅ **Reduced drop-off** - Clear path to first action
- ✅ **Usage tracking** - Can analyze onboarding completion rates

## Customization

### Add New Steps

```typescript
// In onboarding-flow.tsx, add to steps array:
{
  title: "Your New Step",
  description: "Step description",
  content: (
    <div>
      {/* Your step content */}
    </div>
  ),
}
```

### Add New Interests

```typescript
// In step 2, add to interest array:
{
  id: "newinterest",
  label: "🎨 Your Interest",
  emoji: "🎨"
}
```

### Change Welcome Message

```typescript
// In step 1:
title: `Welcome to Tinerary, ${userName || "traveler"}! 🎉`,
```

## Analytics Opportunities

Track onboarding metrics:

1. **Completion Rate:**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE onboarding_completed = true) * 100.0 / COUNT(*) as completion_rate
   FROM profiles;
   ```

2. **Popular Interests:**
   ```sql
   SELECT
     unnest(interests) as interest,
     COUNT(*) as count
   FROM profiles
   WHERE onboarding_completed = true
   GROUP BY interest
   ORDER BY count DESC;
   ```

3. **Skip vs Complete:**
   ```sql
   SELECT
     CASE
       WHEN array_length(interests, 1) > 0 THEN 'completed'
       ELSE 'skipped'
     END as status,
     COUNT(*) as count
   FROM profiles
   WHERE onboarding_completed = true
   GROUP BY status;
   ```

## Future Enhancements

- [ ] Add user follow suggestions based on interests
- [ ] Show featured itineraries matching interests
- [ ] Add profile photo upload step
- [ ] Track time spent on each step
- [ ] A/B test different onboarding flows
- [ ] Add tooltips/tours for first-time actions
- [ ] Email follow-up for users who skipped

## Files

- **Components:**
  - `/components/onboarding-flow.tsx` - Main onboarding UI
  - `/components/onboarding-wrapper.tsx` - Wrapper logic
- **Integration:** `/app/layout.tsx` - Wraps entire app
- **Migration:** `/supabase/migrations/013_add_onboarding_fields.sql`
- **Documentation:** `/docs/ONBOARDING_FLOW.md` (this file)
