# Email Notifications Setup Guide

## ✅ Step 1: Add Your Resend API Key

You have 3 places to add your API key:

### A. Local Development (.env.local)

**Open `.env.local`** and add your Resend API key:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

Replace `re_your_actual_api_key_here` with your actual key from Resend.

### B. Vercel (Production)

When deploying to Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - **Environment**: Production (and Preview if needed)
3. Click **Save**
4. Redeploy your app

### C. Supabase (Optional - for Edge Functions)

If you use Supabase Edge Functions:

1. **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
2. Add `RESEND_API_KEY` with your key

---

## 📧 Step 2: Configure Your Sending Domain

### Option A: Use Resend's Domain (Quick Start)

For testing, use: `onboarding@resend.dev`

In `lib/email-notifications.ts`, change:
```typescript
const FROM_EMAIL = "Tinerary <onboarding@resend.dev>"
```

**⚠️ Limitations:**
- 100 emails per day
- May go to spam
- Only for testing

### Option B: Use Your Own Domain (Recommended)

1. **Resend Dashboard** → **Domains** → **Add Domain**
2. Add your domain (e.g., `tinerary.app`)
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually < 24 hours)
5. Update `FROM_EMAIL`:
   ```typescript
   const FROM_EMAIL = "Tinerary <noreply@tinerary.app>"
   ```

---

## 🔗 Step 3: How to Use the Email Service

The email service is already created at `lib/email-notifications.ts` with these functions:

### Available Email Functions

```typescript
// Welcome email (after sign up)
await sendWelcomeEmail(user.email, user.name)

// Event invitation
await sendEventInviteEmail(
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventLocation,
  inviterName,
  eventId
)

// Event reminder (1 day before, 1 hour before, etc.)
await sendEventReminderEmail(
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventLocation,
  eventId,
  hoursUntil // e.g., 24 for "tomorrow"
)

// New follower notification
await sendNewFollowerEmail(
  recipientEmail,
  recipientName,
  followerName,
  followerUsername,
  followerAvatarUrl
)

// New comment notification
await sendNewCommentEmail(
  recipientEmail,
  recipientName,
  commenterName,
  commentText,
  eventTitle,
  eventId
)

// Password reset
await sendPasswordResetEmail(email, resetToken)
```

---

## 📝 Step 4: Integration Examples

### Example 1: Send Welcome Email on Sign Up

Create an API route: `app/api/auth/welcome/route.ts`

```typescript
import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-notifications"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    const result = await sendWelcomeEmail(email, name)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

Then call it after user signs up:

```typescript
// After successful signup
await fetch('/api/auth/welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: user.email, name: user.name })
})
```

### Example 2: Send Event Invite

In your event invite function:

```typescript
// After creating invite in database
import { sendEventInviteEmail } from "@/lib/email-notifications"

await sendEventInviteEmail(
  invite.email,
  invite.name || "Friend",
  event.title,
  formatDate(event.start_date),
  event.location || "TBA",
  currentUser.name || "A friend",
  event.id
)
```

### Example 3: Send Follower Notification

In your follow service (`lib/follow-service.ts`):

```typescript
// After successful follow
import { sendNewFollowerEmail } from "@/lib/email-notifications"

// Get the user being followed's email
const { data: followedUser } = await supabase
  .from('profiles')
  .select('email, name')
  .eq('id', targetUserId)
  .single()

if (followedUser?.email) {
  await sendNewFollowerEmail(
    followedUser.email,
    followedUser.name,
    follower.name,
    follower.username,
    follower.avatar_url
  )
}
```

---

## 🔔 Step 5: Set Up Event Reminders (Cron Job)

Create a cron job to send reminders before events.

### Create API Route: `app/api/cron/send-event-reminders/route.ts`

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { sendEventReminderEmail } from "@/lib/email-notifications"

export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel sets this)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get events starting in 24 hours
    const tomorrow = new Date()
    tomorrow.setHours(tomorrow.getHours() + 24)

    const { data: events } = await supabase
      .from('itineraries')
      .select(`
        id,
        title,
        start_date,
        location,
        user_id,
        profiles:user_id (email, name)
      `)
      .gte('start_date', tomorrow.toISOString())
      .lte('start_date', new Date(tomorrow.getTime() + 3600000).toISOString()) // +1 hour window

    // Send reminders
    const results = await Promise.all(
      (events || []).map(async (event: any) => {
        if (!event.profiles?.email) return null

        return sendEventReminderEmail(
          event.profiles.email,
          event.profiles.name || 'there',
          event.title,
          new Date(event.start_date).toLocaleString(),
          event.location || 'TBA',
          event.id,
          24
        )
      })
    )

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r?.success).length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-deletion-warnings",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/send-event-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC.

---

## 🧪 Step 6: Test Your Email Setup

### Test Locally

1. Make sure `.env.local` has your API key
2. Restart your dev server: `npm run dev`
3. Create a test file: `scripts/test-email.ts`

```typescript
import { sendWelcomeEmail } from '../lib/email-notifications'

async function testEmail() {
  const result = await sendWelcomeEmail(
    'your-email@example.com',
    'Test User'
  )
  console.log('Email sent:', result)
}

testEmail()
```

4. Run: `npx tsx scripts/test-email.ts`

### Test in Production

After deploying to Vercel:

1. Trigger a real action (sign up, follow someone, etc.)
2. Check **Vercel Dashboard** → **Logs** for email sending logs
3. Check **Resend Dashboard** → **Emails** to see sent emails

---

## 📊 Monitoring & Troubleshooting

### Check Email Delivery

**Resend Dashboard** → **Emails** shows:
- ✅ Delivered
- ⏳ Queued
- ❌ Failed

### Common Issues

**❌ Error: "RESEND_API_KEY is not defined"**
- ✅ Make sure `.env.local` has the key
- ✅ Restart dev server after adding env vars
- ✅ Check Vercel env vars are saved

**❌ Emails going to spam**
- ✅ Use your own verified domain (not resend.dev)
- ✅ Add SPF/DKIM records from Resend
- ✅ Don't send too many emails at once

**❌ "Domain not verified"**
- ✅ Add DNS records from Resend to your domain
- ✅ Wait 24 hours for propagation
- ✅ Check DNS with `dig` command

---

## 🎯 Quick Start Checklist

- [x] ✅ Installed Resend library (`npm install resend`)
- [x] ✅ Created email service (`lib/email-notifications.ts`)
- [ ] Add Resend API key to `.env.local`
- [ ] Test locally with a welcome email
- [ ] (Optional) Verify your domain in Resend
- [ ] Add API key to Vercel environment variables
- [ ] Deploy to Vercel
- [ ] Test in production
- [ ] Set up cron job for reminders

---

## 💡 Tips

1. **Start with onboarding@resend.dev** for testing
2. **Verify your domain** before going to production
3. **Don't send too many emails** at once (rate limits)
4. **Check spam folder** if emails aren't arriving
5. **Monitor Resend dashboard** for delivery status
6. **Add unsubscribe links** for marketing emails (legal requirement)

---

## 📚 Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/emails
- **DNS Setup Guide**: https://resend.com/docs/dashboard/domains/introduction
- **Email Best Practices**: https://resend.com/docs/knowledge-base/best-practices

---

## 🚀 You're Ready!

Your email system is set up! Just add your API key to `.env.local` and start sending emails.

**Need help?** Check the integration examples above or the Resend documentation.
