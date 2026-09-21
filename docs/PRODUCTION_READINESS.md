> **⚠️ This document was inaccurate as of 2026-09-21 and has been corrected.**
>
> Several items below were marked done but were not. Specifically: `/diagnostics`
> was still present (it has now been deleted); migrations were described as
> consolidated to 9 when there were 75+; and the console.log count was stated
> as 40 when it was 41. Treat the ✅ marks below as historical claims, not as
> verified state. The **Current state** section at the bottom is the one that
> was checked against the codebase.

# Production Readiness Checklist

## ✅ COMPLETED (Production Cleanup Sprint)

### 1. Test Pages Cleanup
- ✅ Deleted 17 test/debug pages from `app/`
- ✅ Deleted test API routes (`test-db`, `test-signup`, etc.)
- ✅ Deleted debug components (`debug-session.tsx`, `example-api-usage.tsx`)

**Pages Removed:**
- `/test-auth`, `/test-signin`, `/test-supabase-db`, `/test-itinerary`
- `/test-direct-db`, `/test-connection`, `/test-db`, `/test-onboarding`
- `/diagnostics`, `/debug-auth`, `/check-env`
- `/create-db-user`, `/create-test-user`, `/setup-supabase`, `/supabase-test`
- `/manual-signin`, `/preview/auth`

### 2. Auth Pages Consolidation
- ✅ Deleted duplicate auth pages
- ✅ Single `/auth` page for all authentication

**Removed Redundant Pages:**
- `/login` → Use `/auth`
- `/signup` → Use `/auth`
- `/auth/sign-in` → Use `/auth`
- `/auth/sign-up` → Use `/auth`
- `/signout` → Handled by auth service

### 3. Console.log Cleanup
- ✅ Reduced from 82 to 40 console.log statements
- ✅ Commented out console.log in production code
- ✅ Kept console.error for error logging
- ✅ Kept console.log in scripts/ folder (development tools)

**Files Cleaned:**
- `lib/itinerary-service.ts` - Removed 6 console.log statements
- `lib/email-service.ts`, `lib/supabase-client.ts`
- `components/event-detail.tsx`, `components/rsvp-modal.tsx`
- `hooks/use-discovery.tsx`, `hooks/use-notifications.ts`
- `providers/auth-provider-email.tsx`

### 4. Hardcoded Demo Data
- ✅ Removed hardcoded OTP "123456" from phone verification
- ✅ Updated to use real API call `/api/auth/phone/verify-code`
- ✅ Added clear warnings to mock services

**Mock Services Documented:**
- `lib/email-service.ts` - Marked as mock, needs replacement
- Phone verification now calls actual API

### 5. Migrations Cleanup
- ✅ Consolidated 30 migrations down to 9 active migrations
- ✅ Archived 22 obsolete migrations
- ✅ Created comprehensive documentation

**New Migration Structure:**
```
migrations/
├── 001_initial_schema.sql
├── 002_comments_system.sql
├── 003_user_behavior_tracking.sql
├── 004_realtime_subscriptions.sql
├── 005_account_deletion_gdpr.sql
├── 006_data_export_gdpr.sql
├── 007_likes_system.sql
├── 008_profile_creation_fix.sql
├── 009_fix_user_signup_final.sql (pending)
└── archive/ (22 old migrations)
```

---

## ⚠️ TODO BEFORE PRODUCTION

### P0 - Critical (Must Complete)

1. **Fix User Signup**
   - [ ] Run migration `009_fix_user_signup_final.sql` on production database
   - [ ] Test user registration end-to-end
   - [ ] Verify profile creation works

2. **Replace Mock Services**
   - [ ] Implement real email service (SendGrid/Resend/AWS SES)
   - [ ] Implement real SMS service for phone auth (Twilio)
   - [ ] Remove mock implementations from `lib/email-service.ts`

3. **Image Storage**
   - [ ] Set up Supabase Storage bucket for images
   - [ ] Migrate from base64 to Supabase Storage
   - [ ] Update `createItinerary` to upload to storage
   - [ ] Add image optimization

4. **Environment Variables**
   - [ ] Verify all required env vars in production
   - [ ] Add real API keys (no test/demo keys)
   - [ ] Secure secrets management

5. **Security Audit**
   - [ ] Verify RLS policies on all tables
   - [ ] Add rate limiting to API routes
   - [ ] Enable CORS properly
   - [ ] Add input validation/sanitization

### P1 - Important (Before Beta)

6. **Complete GDPR Compliance**
   - [ ] Add "Delete Account" UI in settings
   - [ ] Test account deletion flow
   - [ ] Test data export functionality
   - [ ] Add privacy policy page

7. **Error Handling**
   - [ ] Implement centralized error logging (Sentry/LogRocket)
   - [ ] Add user-friendly error messages
   - [ ] Create error boundary components
   - [ ] Add fallback UI for errors

8. **Remaining console.log Cleanup**
   - [ ] Remove remaining 40 console.log from `/app` directory
   - [ ] Keep only in scripts/ folder

9. **Complete Features**
   - [ ] Finish onboarding flow
   - [ ] Add RSVP functionality UI
   - [ ] Add follow/unfollow UI
   - [ ] Complete search functionality

### P2 - Nice to Have

10. **Performance Optimization**
    - [ ] Add caching strategy
    - [ ] Implement lazy loading
    - [ ] Optimize bundle size
    - [ ] Add loading skeletons

11. **Testing**
    - [ ] Add unit tests for critical services
    - [ ] Add E2E tests for auth flow
    - [ ] Add integration tests for itinerary creation

12. **Monitoring**
    - [ ] Set up application monitoring (Vercel Analytics/Datadog)
    - [ ] Add performance monitoring
    - [ ] Track user analytics
    - [ ] Set up alerts for errors

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

### Database
- [ ] Run all pending migrations (especially 008 and 009)
- [ ] Verify RLS policies active
- [ ] Enable SSL mode
- [ ] Set up database backups
- [ ] Configure connection pooling

### Environment
- [ ] Set `NODE_ENV=production`
- [ ] Configure real SMTP credentials
- [ ] Configure real SMS credentials
- [ ] Set up proper domain/subdomain
- [ ] Configure HTTPS/SSL certificates

### Code
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Update `package.json` version

### Services
- [ ] Supabase project in production mode
- [ ] Email service configured and tested
- [ ] SMS service configured and tested
- [ ] CDN configured for static assets
- [ ] Cron jobs scheduled (trending updates, deletion warnings)

### Security
- [ ] API keys rotated from development
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input sanitization implemented
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

### Testing
- [ ] User signup/login works
- [ ] Itinerary creation works
- [ ] Comments system works
- [ ] Notifications work
- [ ] Discovery feed works
- [ ] Profile editing works

---

## 🚀 CURRENT STATUS

### What's Production-Ready ✅
- ✅ Core itinerary CRUD
- ✅ Authentication system (email/password)
- ✅ Comments with threading
- ✅ Discovery feed algorithm
- ✅ Real-time notifications
- ✅ Social features (likes, saves)
- ✅ Clean codebase (no test pages)
- ✅ Organized migrations
- ✅ GDPR compliance framework

### What Needs Work ⚠️
See **Current state** at the bottom of this file — the list that used to be
here was out of date.

---

## 📞 SUPPORT

For issues during production deployment:
- Check Supabase logs
- Check Vercel/deployment platform logs
- Review error monitoring dashboard (once set up)

## 📝 NOTES

- All test pages have been removed
- Auth flow consolidated to single `/auth` page
- Migrations organized and documented
- Console.log cleanup completed for production code
- Mock services clearly marked with warnings

---

## Current state (verified 2026-09-21)

Everything here was checked against the codebase rather than remembered.

### Fixed

- **`/api/admin/apply-trigger` deleted.** It executed `CREATE FUNCTION` and
  trigger DDL with the service-role key and had no authentication of any
  kind. `proxy.ts` excludes `/api`, so nothing gated it.
- **Cron endpoints fail closed.** All four used `if (cronSecret && ...)`, so
  an unset `CRON_SECRET` left them open. Now `lib/auth/require-cron.ts`
  refuses the request outright when the secret is missing. The
  send-deletion-warnings `GET` handler, which returned every account pending
  deletion with no auth, is now behind the same guard.
- **Admin guard consolidated** into `lib/auth/require-admin.ts`, replacing 11
  duplicated copies.
- **Schema is back under version control.** Twelve tables existed only in the
  live database. Migrations 076/077 adopt them with RLS. See
  `supabase/migrations/README.md`.
- **Type errors: 268 → 38.** Every crash-class bug among them is fixed.
  Inventory in `docs/TYPE_ERRORS.md`.
- **`npm ci` works** with no flags, for the first time. 31 unused
  dependencies removed; 897 packages → 597.
- **CI exists** (`.github/workflows/ci.yml`). There was none, which is why
  268 type errors and 2 failing tests were sitting on `main`.
- **Tests: 115 passing**, all green.
- **App shell and SEO.** `error.tsx`, `global-error.tsx`, `not-found.tsx`,
  `sitemap.ts`, `robots.ts`, and per-itinerary OG metadata — shared trip
  links previously unfurled with only the generic site-wide card.
- **SMS no longer lies.** `backend/services/sms.ts` returned `true` in
  production without sending anything and logged the verification code. It
  now sends via Twilio when configured and returns `false` otherwise.
  Verification codes use `crypto.randomInt`, not `Math.random`.
- **`/diagnostics`, `_archived/`, `app/app/`** and 12 unreferenced
  components/libs deleted.

### Still open

- **Payments do not exist.** `components/payment-settings.tsx` returns "coming
  soon"; there is no payment provider dependency. `docs/PAYMENT_IMPLEMENTATION.md`
  describes a system that was never built.
- **No external error monitoring.** There is a self-hosted `error_logs` table
  and an `/admin/errors` page, but a self-hosted log cannot report the error
  that takes the app down. Sentry or equivalent is still needed.
- **Rate limiting needs Upstash credentials** in production. Without them
  `lib/rate-limit.ts` falls back to a per-instance in-memory Map, which on
  serverless is close to no limit.
- **Web push needs VAPID keys** or it is silently inert.
- **38 TypeScript errors**, so `ignoreBuildErrors` cannot be removed yet.
- **1015 ESLint warnings** (0 errors). ~80 are React Compiler-era
  `set-state-in-effect`, worth burning down before enabling the compiler.
- **37 `console.log` statements** in app code.
- **i18n is scaffolded only** — six locales, real strings in `en` alone.
- **Migration numbering has 10 duplicate numbers.** Deliberately not
  renumbered; see `supabase/migrations/README.md`.

**Last Updated:** 2026-09-21
**Status:** Security and schema issues resolved; see "Still open" above
