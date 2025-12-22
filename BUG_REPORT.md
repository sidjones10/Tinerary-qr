# Tinerary - Bug Report & Issues Overview

**Generated:** 2025-11-09
**Status:** Pre-beta cleanup required

---

## CRITICAL ISSUES (P0 - Must Fix Before Beta)

### 1. ⚠️ Sign Up Failing - Database Trigger Missing
**Status:** IDENTIFIED - MIGRATION READY
**Impact:** HIGH - Users cannot create accounts
**Description:**
- Sign up fails with "Database error saving new user"
- Root cause: Missing database trigger to automatically create profile rows
- The profiles table requires email/username but there's no automatic profile creation

**Fix Required:**
1. Apply migration: `supabase/migrations/014_add_profile_creation_trigger.sql`
2. This creates a database trigger that automatically creates profiles on user signup
3. Migration URL: https://supabase.com/dashboard/project/sdkazvcbmthdemmwjrjk/sql/new

**Files Affected:**
- `supabase/migrations/014_add_profile_creation_trigger.sql` (created)
- `app/api/auth/signup/route.ts` (updated to rely on trigger)

---

### 2. ⚠️ Multiple Conflicting Auth Pages
**Status:** IDENTIFIED
**Impact:** HIGH - Confusing UX, routing issues, maintenance nightmare
**Description:**
Multiple sign-in and sign-up pages exist with different implementations:

**Sign In Pages (6 instances):**
1. `/auth` - Main auth page with tabs (EmailAuthForm)
2. `/auth/sign-in` - Uses SignInForm component
3. `/login` - Separate login page using supabase-client
4. `/manual-signin` - Unknown implementation
5. `/test-signin` - Test page
6. `/test-auth` - Test page

**Sign Up Pages (4 instances):**
1. `/auth` - EmailAuthForm (tab)
2. `/auth/sign-up` - Uses /api/auth/signup endpoint
3. `/signup` - Unknown implementation
4. `/preview/auth` - Preview page

**Components Used:**
- `components/email-auth-form.tsx` - Full form with sign in/up tabs
- `components/auth/sign-in-form.tsx` - Dedicated sign in form
- `components/phone-login-form.tsx` - Phone auth

**Recommendation:**
- **Keep:** `/auth` as the single source of truth (uses EmailAuthForm)
- **Delete:** All other auth pages except test pages (can keep for dev)
- **Redirect:** `/login`, `/signup`, `/auth/sign-in`, `/auth/sign-up` → `/auth`
- **Update:** All internal links to point to `/auth`

---

## HIGH PRIORITY ISSUES (P1 - Should Fix Before Beta)

### 3. ⚠️ Duplicate Itineraries Appearing on Dashboard
**Status:** NEEDS INVESTIGATION
**Impact:** MEDIUM-HIGH - Confusing user experience
**Description:**
- User reports duplicate itineraries showing on dashboard
- Duplicates don't exist in Supabase database
- Possible causes:
  1. React key collision causing re-renders
  2. State management issue in feed-page.tsx
  3. Multiple useEffect calls fetching data twice
  4. EventCard rendering issue

**Investigation Required:**
- Check EventCard component for duplicate rendering
- Verify React keys are unique (currently using item.id)
- Review feed-page.tsx state management (lines 128-238)
- Check if feedItems state is being set multiple times

**Files to Review:**
- `components/feed-page.tsx:452` - EventCard mapping
- `components/event-card.tsx` - Rendering logic
- `lib/feed-service.ts:95` - Combine logic for own + invited

**Possible Fix:**
```tsx
// In feed-page.tsx, add useMemo to prevent re-computation
const uniqueFeedItems = useMemo(() => {
  const seen = new Set()
  return feedItems.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}, [feedItems])
```

---

### 4. Multiple Supabase Client Instances
**Status:** IDENTIFIED
**Impact:** MEDIUM - Performance and consistency issues
**Description:**
Found multiple Supabase client initialization patterns:
1. `@/lib/supabase/client` - createClient()
2. `@/lib/supabase-client` - Direct supabase export
3. `@/utils/supabase/server` - Server-side client

**Files:**
- `/login/page.tsx` uses `@/lib/supabase-client`
- Most components use `createClient()` from `@/lib/supabase/client`
- API routes use server client

**Recommendation:**
- Standardize on `createClient()` pattern for client-side
- Use server client for API routes
- Remove `supabase-client.ts` if it's a legacy file

---

## MEDIUM PRIORITY ISSUES (P2)

### 5. Inconsistent Authentication Flow
**Status:** IDENTIFIED
**Impact:** MEDIUM - User experience inconsistency
**Description:**
Different auth pages redirect to different destinations:
- `/auth` → `/dashboard` (line 32)
- `/login` → `/app` (line 42)
- `/auth/sign-up` → `/app` (line 64)
- EmailAuthForm → `/dashboard` (line 74)

**Recommendation:**
- Standardize redirect to `/dashboard` after login
- Support `redirectTo` query parameter for intended destinations

---

### 6. Test Pages in Production Code
**Status:** IDENTIFIED
**Impact:** LOW-MEDIUM - Bloat, potential security exposure
**Description:**
Multiple test/debug pages exist in the app directory:
- `/test-auth`
- `/test-signin`
- `/test-supabase-db`
- `/test-itinerary`
- `/test-direct-db`
- `/test-connection`
- `/test-db`
- `/diagnostics`
- `/check-env`
- `/create-db-user`
- `/create-test-user`
- `/setup-supabase`
- `/supabase-test`

**Recommendation:**
- Move test pages to a `/dev` or `/debug` route with auth guard
- Or delete entirely and rely on proper testing framework
- Add middleware to block access in production

---

## LOW PRIORITY ISSUES (P3)

### 7. Hardcoded Sample Data
**Status:** IDENTIFIED
**Impact:** LOW - UI/UX polish
**Description:**
- `feed-page.tsx` contains hardcoded exampleEvents (lines 17-126)
- These are not used but add bloat to the file

**Recommendation:** Remove unused sample data

---

## ARCHITECTURAL RECOMMENDATIONS

### Auth Flow Consolidation
```
Current State (MESSY):
/auth, /login, /signup, /auth/sign-in, /auth/sign-up
↓ Different components, different logic
↓ Different redirects

Recommended State (CLEAN):
/auth (single entry point)
├── Email/Phone tabs
├── Sign In/Sign Up toggle
└── Consistent redirect to /dashboard or redirectTo param
```

### File Cleanup Strategy
1. **Delete:**
   - `app/login/page.tsx`
   - `app/signup/page.tsx`
   - `app/manual-signin/page.tsx`
   - All test pages (or move to `/dev`)

2. **Create Redirects:**
   ```tsx
   // app/login/page.tsx
   export default function LoginRedirect() {
     redirect('/auth')
   }
   ```

3. **Update Links:**
   - Search for all `href="/login"` → `href="/auth"`
   - Search for all `href="/signup"` → `href="/auth"`
   - Search for all `href="/auth/sign-in"` → `href="/auth"`
   - Search for all `href="/auth/sign-up"` → `href="/auth"`

---

## NEXT STEPS

### Immediate Actions (Today):
1. ✅ Create and apply profile creation trigger migration
2. ⬜ Test signup flow to confirm fix
3. ⬜ Investigate duplicate itineraries issue
4. ⬜ Consolidate auth pages

### Short Term (This Week):
1. ⬜ Remove/redirect redundant auth pages
2. ⬜ Standardize Supabase client usage
3. ⬜ Clean up test pages
4. ⬜ Fix duplicate itineraries

### Before Beta Launch:
1. ⬜ Complete auth flow testing
2. ⬜ User acceptance testing on signup/login
3. ⬜ Performance audit on feed loading
4. ⬜ Security audit on exposed routes

---

## FILES REQUIRING ATTENTION

### High Priority:
- ✅ `supabase/migrations/014_add_profile_creation_trigger.sql`
- ⬜ `app/auth/page.tsx` (keep as main)
- ⬜ `app/login/page.tsx` (convert to redirect)
- ⬜ `app/signup/page.tsx` (convert to redirect)
- ⬜ `components/feed-page.tsx` (fix duplicates)

### Medium Priority:
- ⬜ `lib/supabase-client.ts` (standardize or remove)
- ⬜ All test pages (cleanup)

---

## MIGRATION CHECKLIST

- [ ] Apply profile creation trigger (014_add_profile_creation_trigger.sql)
- [ ] Test signup with new account
- [ ] Verify profile is created automatically
- [ ] Check existing users have profiles
- [ ] Test login flow
- [ ] Verify dashboard loads correctly after auth
