# Tinerary Setup Guide

Complete setup guide for getting your Tinerary application up and running.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git (optional, for version control)

## Step 1: Clone and Install

```bash
# Clone the repository (if applicable)
git clone <your-repo-url>
cd Tinerary-qr

# Install dependencies
npm install
```

## Step 2: Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For SMS authentication
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 3: Database Setup

### Option A: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Wait for completion (should create 13 tables)

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

### Verify Database Setup

Run this query in SQL Editor to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- activities
- drafts
- expenses
- itineraries
- itinerary_categories
- itinerary_invitations
- itinerary_metrics
- notifications
- packing_items
- pending_invitations
- profiles
- saved_itineraries
- user_interactions
- user_preferences

## Step 4: Storage Setup

### Create Storage Buckets

1. Go to Supabase Dashboard > Storage
2. Click "New bucket"

**Create bucket: itinerary-images**
- Name: `itinerary-images`
- Public bucket: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

**Create bucket: user-avatars**
- Name: `user-avatars`
- Public bucket: ✅ Yes
- File size limit: 2 MB
- Allowed MIME types: image/jpeg, image/png, image/webp

### Set Up Storage Policies

After creating buckets, add these policies in the Storage section:

**For itinerary-images bucket:**

1. Click on the bucket → Policies → New Policy

**Policy 1: Upload**
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'itinerary-images');
```

**Policy 2: View**
```sql
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'itinerary-images');
```

**Policy 3: Update**
```sql
CREATE POLICY "Users can update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'itinerary-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 4: Delete**
```sql
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'itinerary-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**For user-avatars bucket:**

Similar policies but replace `'itinerary-images'` with `'user-avatars'` and add the folder check for upload:

```sql
-- Upload (users can only upload to their own folder)
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- View
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Update
CREATE POLICY "Users can update their avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete
CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 5: Enable Realtime (for notifications)

1. Go to Supabase Dashboard > Database > Replication
2. Find the `notifications` table
3. Toggle on "Enable Realtime"
4. Click Save

This enables real-time notification updates without polling.

## Step 6: Authentication Setup

### Email Authentication (Already enabled by default)

Email auth should work out of the box.

### Phone Authentication (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable "Phone" provider
3. Configure with Twilio credentials (or use Supabase's Twilio integration)

### Social Authentication (Optional)

Enable providers like Google, GitHub, etc. in Authentication > Providers

## Step 7: Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` (or the port shown in terminal)

## Step 8: Test the Application

### Test Authentication
1. Navigate to `/auth`
2. Sign up with email or phone
3. Verify you're redirected to `/dashboard`

### Test Feed Functionality
1. Create a new trip from the dashboard
2. Verify it appears in the "For You" feed
3. Check that it's categorized as "Upcoming"

### Test Notifications
1. Invite someone to a trip
2. Check if notification appears in the bell icon
3. Verify real-time updates (notification count updates instantly)

### Test Image Upload
1. Go to Create page
2. Upload a cover image
3. Verify image is stored in Supabase Storage
4. Check that image displays correctly

## Troubleshooting

### Database Issues

**Error: "relation does not exist"**
- Solution: Run the migration script again
- Check that all tables exist in Supabase Dashboard

**Error: "RLS policy violation"**
- Solution: Verify RLS policies are enabled and correctly configured
- Check that you're authenticated when making requests

### Storage Issues

**Error: "Bucket not found"**
- Solution: Create the storage buckets as described in Step 4
- Verify bucket names match exactly: `itinerary-images` and `user-avatars`

**Error: "Upload failed"**
- Solution: Check storage policies are set up correctly
- Verify file size doesn't exceed limits
- Ensure MIME type is allowed

### Authentication Issues

**Error: "Invalid credentials"**
- Solution: Check that Supabase URL and keys in `.env.local` are correct
- Restart dev server after changing `.env.local`

**Redirect loop**
- Solution: Check middleware configuration
- Verify auth state is persisting correctly

### Realtime Not Working

**Notifications don't update in real-time**
- Solution: Enable Realtime for notifications table (Step 5)
- Check browser console for connection errors
- Verify Supabase project has Realtime enabled (it's on by default)

## Features Checklist

After setup, verify these features work:

- [ ] User signup/login (email and/or phone)
- [ ] Profile creation and updates
- [ ] Create trip with cover image
- [ ] Invite people to trips (existing users get notifications, non-users get email)
- [ ] Packing list with add/remove items
- [ ] Expenses with category and amount
- [ ] Expense splitting calculator
- [ ] Feed shows created and invited trips
- [ ] Filter trips by upcoming/past
- [ ] Discovery feed with personalized recommendations
- [ ] Real-time notifications (instant updates)
- [ ] Browser notifications (if permission granted)
- [ ] Mark notifications as read
- [ ] Image uploads to Supabase Storage

## Performance Optimization

### Enable Caching

Consider adding these indexes if you have performance issues:

```sql
-- Additional indexes for better performance
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);
```

### Enable CDN for Images

In production, consider using Supabase's CDN or Cloudflare for image delivery.

## Next Steps

1. **Customize branding**: Update colors, logo, and styling
2. **Add analytics**: Integrate Vercel Analytics or Google Analytics
3. **Set up monitoring**: Add error tracking with Sentry
4. **Configure email templates**: Customize Supabase auth emails
5. **Deploy to production**: Use Vercel, Netlify, or your preferred platform

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
```

### Deploy to Other Platforms

Ensure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only on server)

## Support

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review `supabase/README.md` for database-specific help
- Check GitHub issues for common problems

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env.local`** - It contains secret keys
2. **Service Role Key** should only be used server-side
3. **Enable RLS** on all tables to prevent unauthorized access
4. **Validate user input** before storing in database
5. **Keep dependencies updated** for security patches

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Guides](https://supabase.com/docs/guides)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
