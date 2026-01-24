# Email Service Setup Guide

## Overview

The Tinerary application currently uses a **mock email service** that does NOT send actual emails in production. This guide will help you integrate a real email service provider.

## Critical Features That Need Email

The following features are **completely non-functional** without a real email service:

- ✉️ Password reset emails
- 📧 Email verification
- 📬 Booking confirmation emails
- 🎫 Ticket delivery
- 🔔 Notification emails
- ⚠️ Account deletion warnings
- 📨 Invitation emails

## Current State

**File:** `lib/email-service.ts`

```typescript
// ⚠️ MOCK EMAIL SERVICE - FOR DEVELOPMENT ONLY
// This mock service does NOT send actual emails
export async function sendEmail(options: EmailOptions) {
  // ... returns mock response only
  return {
    success: true,
    messageId: `mock-email-${Date.now()}`,
    preview: true,
  }
}
```

## Recommended Email Providers

### Option 1: Resend (Recommended for Next.js)

**Pros:**
- Modern, developer-friendly API
- Built for React/Next.js
- Generous free tier (100 emails/day)
- React Email support
- Great documentation

**Setup:**
```bash
npm install resend
```

```typescript
// lib/email-service.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: options.from || 'noreply@tinerary.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

**Environment Variables:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Get API Key:**
1. Sign up at https://resend.com
2. Verify your domain
3. Create API key in dashboard
4. Add to `.env.local`

---

### Option 2: SendGrid

**Pros:**
- Industry standard
- 100 emails/day free tier
- Reliable delivery
- Comprehensive analytics

**Setup:**
```bash
npm install @sendgrid/mail
```

```typescript
// lib/email-service.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(options: EmailOptions) {
  try {
    const msg = {
      to: options.to,
      from: options.from || 'noreply@tinerary.com',
      subject: options.subject,
      html: options.html,
    }

    await sgMail.send(msg)

    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return { success: false, error: error.message }
  }
}
```

**Environment Variables:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

**Get API Key:**
1. Sign up at https://sendgrid.com
2. Verify sender identity
3. Create API key with "Mail Send" permissions
4. Add to `.env.local`

---

### Option 3: AWS SES

**Pros:**
- Part of AWS ecosystem
- Extremely cost-effective at scale ($0.10/1000 emails)
- High deliverability
- Already in production mode if you use AWS

**Setup:**
```bash
npm install @aws-sdk/client-ses
```

```typescript
// lib/email-service.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function sendEmail(options: EmailOptions) {
  try {
    const command = new SendEmailCommand({
      Source: options.from || 'noreply@tinerary.com',
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
        },
        Body: {
          Html: {
            Data: options.html,
          },
        },
      },
    })

    const response = await sesClient.send(command)

    return { success: true, messageId: response.MessageId }
  } catch (error: any) {
    console.error('SES error:', error)
    return { success: false, error: error.message }
  }
}
```

**Environment Variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
```

**Setup Steps:**
1. Create IAM user with `AmazonSESFullAccess`
2. Verify your email/domain in SES
3. Request production access (starts in sandbox mode)
4. Add credentials to `.env.local`

---

## Testing

After implementing a real email service:

```typescript
// Test the email service
import { sendEmail } from '@/lib/email-service'

await sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<h1>Hello from Tinerary!</h1>',
})
```

## Troubleshooting

### Emails not sending

1. **Check API key** - Ensure environment variable is set correctly
2. **Verify domain** - Most providers require domain verification
3. **Check logs** - Look for error messages in console
4. **Sandbox mode** - Some providers (AWS SES) start in sandbox mode

### Emails going to spam

1. **Set up SPF/DKIM** - Configure DNS records
2. **Use verified domain** - Don't send from @gmail.com
3. **Warm up IP** - Gradually increase sending volume
4. **Add unsubscribe link** - Required by most providers

## Production Checklist

- [ ] Choose email provider
- [ ] Install dependencies
- [ ] Get API credentials
- [ ] Add environment variables
- [ ] Replace mock implementation in `lib/email-service.ts`
- [ ] Verify domain/sender identity
- [ ] Test password reset flow
- [ ] Test booking confirmations
- [ ] Monitor delivery rates
- [ ] Set up error alerts

## Cost Estimates

| Provider | Free Tier | Paid Pricing |
|----------|-----------|--------------|
| **Resend** | 100/day (3,000/month) | $20/month for 50,000 |
| **SendGrid** | 100/day (3,000/month) | $19.95/month for 50,000 |
| **AWS SES** | 62,000/month (if in EC2) | $0.10 per 1,000 |

## Support

For provider-specific issues:
- **Resend**: https://resend.com/docs
- **SendGrid**: https://docs.sendgrid.com
- **AWS SES**: https://docs.aws.amazon.com/ses/

For Tinerary-specific questions, see the main README.
