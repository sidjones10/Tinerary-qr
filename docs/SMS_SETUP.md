# SMS Service Setup Guide

## Overview

The Tinerary application currently uses a **mock SMS service** that does NOT send actual text messages in production. This guide will help you integrate a real SMS service provider.

## Critical Features That Need SMS

The following features are **completely non-functional** without a real SMS service:

- 📱 Phone number verification codes
- 🔐 Two-factor authentication (2FA)
- 🔔 SMS notifications
- 🚨 Security alerts
- 📲 Password reset via SMS
- ✉️ Booking confirmations via SMS

## Current State

**Files:** `backend/services/sms.ts` and `backend/services/twilio.ts`

### Development Mode (Current):
```typescript
// backend/services/sms.ts
export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  // For development/testing, log the code
  if (process.env.NODE_ENV !== "production") {
    console.log("\n" + "=".repeat(60))
    console.log("📱 VERIFICATION CODE")
    console.log("=".repeat(60))
    console.log(`Phone: ${formattedPhone}`)
    console.log(`Code:  ${code}`)
    console.log("=".repeat(60) + "\n")
    return true
  }

  // ⚠️ In production, this just logs a warning and returns true!
  console.warn(`[PRODUCTION MODE] SMS sending not configured!`)
  return true
}
```

### Partial Twilio Integration:
The codebase includes `backend/services/twilio.ts` with Twilio setup, but it's missing credentials and not being used by default.

## Recommended SMS Providers

### Option 1: Twilio (Recommended - Already Integrated)

**Pros:**
- Already partially integrated in codebase
- Industry standard for SMS
- Reliable global delivery
- Excellent documentation
- Free trial credits ($15.50)
- Pay-as-you-go pricing

**Current Integration Status:**
- ✅ `twilio` package already installed
- ✅ Code structure in place
- ❌ Missing environment variables
- ❌ Not connected to auth flow

**Setup Steps:**

1. **Sign up for Twilio:**
   - Visit https://www.twilio.com/try-twilio
   - Complete registration and verify your email
   - You'll receive $15.50 in trial credits

2. **Get Your Credentials:**
   - Go to Twilio Console: https://console.twilio.com
   - Find your **Account SID** and **Auth Token**
   - Go to Phone Numbers → Manage → Buy a number
   - Purchase a phone number (or use trial number)

3. **Add Environment Variables:**

Add to `.env.local`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

4. **Switch from Mock to Twilio:**

Edit `backend/services/auth.ts`:
```typescript
// Change this import:
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from "./sms"

// To this:
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from "./twilio"
```

That's it! The Twilio integration is ready to use.

**Testing:**
```bash
# In development, test the SMS service
npm run dev

# Try phone verification at /auth/signin
# You should receive actual SMS messages
```

**Cost:**
- Trial: $15.50 credit (enough for ~1,000 messages)
- Production: $0.0079 per SMS (US)
- International: varies by country ($0.05-$0.15 typically)

---

### Option 2: AWS SNS

**Pros:**
- Part of AWS ecosystem
- Extremely cost-effective at scale
- Global coverage
- High deliverability
- Already in AWS infrastructure

**Setup:**

1. **Install AWS SDK:**
```bash
npm install @aws-sdk/client-sns
```

2. **Create SNS Client Service:**

Create `backend/services/aws-sns.ts`:
```typescript
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export function formatPhoneNumber(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  if (phoneNumber.startsWith("+")) {
    return phoneNumber
  }

  if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    return `+${digitsOnly}`
  }

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }

  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`
  }

  return phoneNumber
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)

    const command = new PublishCommand({
      Message: `Your Tinerary verification code is: ${code}`,
      PhoneNumber: formattedPhone,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional", // Use Transactional for OTP codes
        },
      },
    })

    await snsClient.send(command)
    return true
  } catch (error) {
    console.error(`Failed to send verification SMS via AWS SNS:`, error)
    return false
  }
}
```

3. **Environment Variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. **IAM Setup:**
   - Create IAM user with `AmazonSNSFullAccess` policy
   - Or create custom policy with `sns:Publish` permission
   - Save Access Key ID and Secret Access Key

5. **Update Auth Service:**
```typescript
// backend/services/auth.ts
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from "./aws-sns"
```

**Cost:**
- US: $0.00645 per SMS (cheaper than Twilio)
- International: varies by country
- No monthly fees, pure pay-per-message

---

### Option 3: Vonage (formerly Nexmo)

**Pros:**
- Global SMS coverage
- Competitive pricing
- Developer-friendly API
- Free trial credits

**Setup:**

1. **Install Vonage SDK:**
```bash
npm install @vonage/server-sdk
```

2. **Create Vonage Service:**

Create `backend/services/vonage.ts`:
```typescript
import { Vonage } from "@vonage/server-sdk"

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY!,
  apiSecret: process.env.VONAGE_API_SECRET!,
})

export function formatPhoneNumber(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  if (phoneNumber.startsWith("+")) {
    return phoneNumber
  }

  if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    return `+${digitsOnly}`
  }

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  }

  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`
  }

  return phoneNumber
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)

    await vonage.sms.send({
      to: formattedPhone,
      from: process.env.VONAGE_SENDER_ID || "Tinerary",
      text: `Your Tinerary verification code is: ${code}`,
    })

    return true
  } catch (error) {
    console.error(`Failed to send verification SMS via Vonage:`, error)
    return false
  }
}
```

3. **Environment Variables:**
```env
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET=xxxxxxxxxxxxxxxx
VONAGE_SENDER_ID=Tinerary
```

4. **Get Credentials:**
   - Sign up at https://developer.vonage.com
   - Get API Key and Secret from dashboard
   - Set up sender ID (optional, defaults to "Tinerary")

5. **Update Auth Service:**
```typescript
// backend/services/auth.ts
import { formatPhoneNumber, generateVerificationCode, sendVerificationSMS } from "./vonage"
```

**Cost:**
- Free trial: €2 credit
- US: $0.0079 per SMS
- International: varies by country

---

## Phone Number Formatting

All SMS providers require phone numbers in **E.164 format**:
- Must start with `+`
- Followed by country code
- Then the phone number (no spaces, dashes, or parentheses)

**Examples:**
- ✅ `+14155552671` (US number)
- ✅ `+442071838750` (UK number)
- ❌ `(415) 555-2671` (invalid)
- ❌ `415-555-2671` (invalid)

The `formatPhoneNumber()` function in each service handles this automatically for US numbers.

## Testing

### Development Testing:
```typescript
// Test the SMS service directly
import { sendVerificationSMS } from "@/backend/services/twilio" // or aws-sns, vonage

await sendVerificationSMS("+14155552671", "123456")
```

### End-to-End Testing:
1. Start the development server: `npm run dev`
2. Navigate to `/auth/signin`
3. Enter your phone number
4. Check your phone for the verification code
5. Enter the code to complete verification

### Test Mode (Twilio):
Twilio provides test credentials that simulate SMS without sending real messages:

**Test Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
**Test Auth Token:** `test_auth_token_here`

Use Twilio's test phone numbers: https://www.twilio.com/docs/iam/test-credentials

## Security Best Practices

### 1. Rate Limiting
Add rate limiting to prevent SMS bombing:

```typescript
// backend/services/rate-limit.ts
const attemptsByPhone = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now()
  const limit = attemptsByPhone.get(phoneNumber)

  if (!limit || limit.resetAt < now) {
    // Reset or create new limit
    attemptsByPhone.set(phoneNumber, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    })
    return true
  }

  if (limit.count >= 3) {
    // Max 3 SMS per hour
    return false
  }

  limit.count++
  return true
}
```

Use in auth service:
```typescript
// backend/services/auth.ts
import { checkRateLimit } from "./rate-limit"

export async function startPhoneVerification(phone: string): Promise<VerificationResult> {
  if (!checkRateLimit(phone)) {
    return {
      success: false,
      error: "Too many verification attempts. Please try again later.",
    }
  }
  // ... rest of verification logic
}
```

### 2. Code Expiration
Already implemented in `backend/services/auth.ts`:
- Codes expire after 15 minutes (configurable via `PHONE_CODE_EXPIRY_MINUTES`)
- Max 3 verification attempts per code (configurable via `PHONE_MAX_ATTEMPTS`)

### 3. Secure Storage
Verification codes are stored in the database, not in memory:
- Table: `verification_codes`
- Columns: `phone`, `code`, `expires_at`, `attempts`, `verified`
- Expired codes are automatically deleted

### 4. HTTPS Only
Always use HTTPS in production to prevent code interception.

## Troubleshooting

### SMS not received:

1. **Check phone number format:**
   - Must be in E.164 format (`+1234567890`)
   - Use `formatPhoneNumber()` helper

2. **Verify credentials:**
   - Check environment variables are set correctly
   - Test with provider's console/dashboard

3. **Check provider balance:**
   - Ensure you have credits (Twilio, Vonage)
   - Check AWS SNS service limits

4. **Look for provider errors:**
   - Check console logs for error messages
   - Review provider dashboard for failed deliveries

### "Unverified" phone number (Twilio trial):
- Twilio trial accounts can only send to verified phone numbers
- Add your phone number to verified callers in Twilio console
- Or upgrade to paid account for unrestricted sending

### High costs:
- Switch to AWS SNS for lower per-message costs
- Implement aggressive rate limiting
- Use transactional message types (not promotional)
- Consider alternatives for non-critical notifications (email, push)

### International SMS issues:
- Some countries block short code SMS
- Use alphanumeric sender ID where supported
- Check provider's country-specific requirements

## Production Checklist

- [ ] Choose SMS provider (Twilio recommended for ease of setup)
- [ ] Sign up and get API credentials
- [ ] Add environment variables to production environment
- [ ] Test with your phone number first
- [ ] Switch from mock service to real provider in `backend/services/auth.ts`
- [ ] Implement rate limiting (3-5 SMS per hour per number)
- [ ] Set up monitoring for failed deliveries
- [ ] Configure alerting for low credits/balance
- [ ] Test international numbers (if applicable)
- [ ] Review and optimize message templates
- [ ] Set up SMS logs/audit trail
- [ ] Document escalation process for SMS failures

## Cost Optimization

### Tips to Reduce SMS Costs:

1. **Use Email as Primary:**
   - Offer email verification as default
   - SMS only for users who prefer it or for 2FA

2. **Implement Smart Retry:**
   - Don't resend immediately
   - Exponential backoff: 1 min, 5 min, 15 min

3. **Consolidate Messages:**
   - Send one SMS with all info instead of multiple
   - Example: "Code: 123456. Expires in 15 min."

4. **Choose the Right Provider:**
   - AWS SNS: Best for high volume ($0.00645/SMS)
   - Twilio: Best for features and support ($0.0079/SMS)
   - Vonage: Good middle ground ($0.0079/SMS)

5. **Geographic Optimization:**
   - Use local numbers for each region
   - Reduces international SMS costs (can be 10x cheaper)

## Cost Comparison

| Provider | US SMS Cost | International (avg) | Free Tier | Monthly Fee |
|----------|-------------|---------------------|-----------|-------------|
| **Twilio** | $0.0079 | $0.05-$0.15 | $15.50 credit | None |
| **AWS SNS** | $0.00645 | $0.05-$0.10 | First 100 free (12 months) | None |
| **Vonage** | $0.0079 | $0.05-$0.12 | €2 credit | None |

**Example monthly costs for 10,000 SMS:**
- Twilio: $79
- AWS SNS: $64.50
- Vonage: $79

## Configuration Reference

### Environment Variables Summary:

**Twilio:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**AWS SNS:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vonage:**
```env
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET=xxxxxxxxxxxxxxxx
VONAGE_SENDER_ID=Tinerary
```

### Configuration Constants:

Defined in `lib/config.ts`:
```typescript
export const PHONE_VERIFICATION_CONFIG = {
  CODE_EXPIRY_MINUTES: 15,        // How long codes are valid
  MAX_VERIFICATION_ATTEMPTS: 3,   // Max wrong attempts before code is locked
}
```

Override via environment variables:
```env
PHONE_CODE_EXPIRY_MINUTES=15
PHONE_MAX_ATTEMPTS=3
```

## Support

For provider-specific issues:
- **Twilio**: https://www.twilio.com/docs/sms
- **AWS SNS**: https://docs.aws.amazon.com/sns/
- **Vonage**: https://developer.vonage.com/messaging/sms/overview

For Tinerary-specific questions, see the main README.

## Next Steps

1. Choose your SMS provider (Twilio recommended for getting started)
2. Follow the setup steps above
3. Test thoroughly in development
4. Deploy to production with monitoring
5. Set up alerts for failures and low balances
6. Review SMS costs monthly and optimize as needed
