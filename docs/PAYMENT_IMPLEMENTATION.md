# Payment Implementation Guide

## Important Reminder

> **Do not forget:** Hook payment into `processBooking()` in
> `app/actions/promotion-actions.ts` — bookings are currently set to
> `status: "confirmed"` immediately (line 573). Change this to `"pending"`
> until payment clears.

---

## Current State

Stripe was previously integrated and intentionally removed. All bookings
are confirmed instantly with no payment collection. The following feature
flags are currently **off**:

| Flag | File | Line | Purpose |
|------|------|------|---------|
| `PAYWALL_ENABLED = false` | `lib/paywall.ts` | 17 | Gates premium features behind subscription tiers |
| `ENABLE_AFFILIATE_PAYOUTS = false` | `lib/commission.ts` | 7 | Controls whether affiliate earnings trigger real payouts |

---

## What Already Works (No Changes Needed)

- **Tier gating** — only premium/enterprise businesses can accept bookings
  (`app/actions/promotion-actions.ts:537-552`)
- **Price calculation** — `totalPrice = promotion.price * quantity`
  (`app/actions/promotion-actions.ts:554`)
- **Capacity tracking** — RPC functions `decrease_promotion_capacity` /
  `increase_promotion_capacity` manage available slots
  (`supabase/migrations/054_booking_capacity_functions.sql`)
- **Affiliate commission calculation** — `recordAffiliateEarning()` computes
  60/40 (user) or 70/30 (creator) splits (`lib/commission.ts:72-109`)
- **QR ticket generation** — client-side via `qrcode` package
  (`components/ticket-qr-card.tsx`)
- **Tickets page** — `/tickets` route with upcoming/past tabs
  (`app/tickets/page.tsx`)

---

## Implementation Steps

### Step 1: Add Stripe Dependencies and Environment Variables

Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Install packages:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Create Stripe Server Client

Create `lib/stripe.ts`:

```ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})
```

### Step 3: Add Payment Fields to Bookings Table

Create a new migration:

```sql
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent
  ON bookings(stripe_payment_intent_id);
```

Update `lib/database.types.ts` — add to the bookings Row/Insert/Update types:

```ts
stripe_payment_intent_id: string | null
stripe_checkout_session_id: string | null
payment_status: string
```

### Step 4: Create Payment Intent Endpoint

Create `app/api/create-payment-intent/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { bookingId } = await request.json()

  // Fetch booking details
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_price, currency, user_id")
    .eq("id", bookingId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.total_price * 100), // cents
    currency: (booking.currency || "usd").toLowerCase(),
    metadata: { bookingId: booking.id, userId: booking.user_id },
  })

  // Store the payment intent ID on the booking
  await supabase
    .from("bookings")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: "processing",
    })
    .eq("id", bookingId)

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

### Step 5: Modify processBooking() — Set Status to "pending"

**File:** `app/actions/promotion-actions.ts`, around line 573

Change:

```ts
status: "confirmed",
```

To:

```ts
status: "pending",
payment_status: "unpaid",
```

The booking is now created in a pending state. The client will then initiate
payment, and the webhook (Step 7) will flip both `status` to `"confirmed"`
and `payment_status` to `"paid"`.

Also update `createBooking()` in `app/actions/booking-actions.ts` (line 79)
in the same way — change `"confirmed"` to `"pending"`.

### Step 6: Add Payment UI to Booking Panel

**File:** `components/promotion-booking-panel.tsx`

After the booking is created (currently line 79), instead of showing success
immediately, redirect to a payment step:

```tsx
const result = await processBooking(formData)

if (result.success && result.data) {
  // Redirect to payment page with booking ID
  window.location.href = `/payment/${result.data.id}`
}
```

Create `app/payment/[bookingId]/page.tsx` with a Stripe Elements form:

```tsx
"use client"

import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tickets?success=${bookingId}`,
      },
    })

    if (error) {
      // Show error to user
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  )
}

export default function PaymentPage({ params }: { params: { bookingId: string } }) {
  // Fetch client secret from API
  // Wrap in <Elements stripe={stripePromise} options={{ clientSecret }}>
  //   <CheckoutForm bookingId={params.bookingId} />
  // </Elements>
}
```

### Step 7: Create Stripe Webhook Handler

Create `app/api/webhooks/stripe/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object
      const bookingId = paymentIntent.metadata.bookingId

      // Confirm the booking
      await supabase
        .from("bookings")
        .update({ status: "confirmed", payment_status: "paid" })
        .eq("id", bookingId)

      // Decrease promotion capacity
      const { data: booking } = await supabase
        .from("bookings")
        .select("promotion_id, quantity")
        .eq("id", bookingId)
        .single()

      if (booking) {
        await supabase.rpc("decrease_promotion_capacity", {
          p_promotion_id: booking.promotion_id,
          p_quantity: booking.quantity,
        })
      }
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object
      const bookingId = paymentIntent.metadata.bookingId

      await supabase
        .from("bookings")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", bookingId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### Step 8: Handle Refunds on Cancellation

Update `cancelBooking()` in `app/actions/booking-actions.ts`:

```ts
// After marking the booking as cancelled, issue a Stripe refund
if (booking.stripe_payment_intent_id) {
  const { stripe } = await import("@/lib/stripe")
  await stripe.refunds.create({
    payment_intent: booking.stripe_payment_intent_id,
  })

  await supabase
    .from("bookings")
    .update({ payment_status: "refunded" })
    .eq("id", id)
}
```

### Step 9: Enable Feature Flags

Once everything is tested:

1. **`lib/paywall.ts:17`** — set `PAYWALL_ENABLED = true`
2. **`lib/commission.ts:7`** — set `ENABLE_AFFILIATE_PAYOUTS = true`

### Step 10: Connect Real Data to Transactions Page

Replace mock data in `app/transactions/transactions-content.tsx` with actual
queries against the `bookings` and `affiliate_earnings` tables. The component
currently shows 6 hardcoded transactions — wire it up to:

```ts
const { data: bookings } = await supabase
  .from("bookings")
  .select("*, promotion:promotion_id(title, business_id)")
  .eq("payment_status", "paid")
  .order("created_at", { ascending: false })
```

---

## Files That Need Changes

| File | Change |
|------|--------|
| `app/actions/promotion-actions.ts:573` | Change booking status from `"confirmed"` to `"pending"` |
| `app/actions/booking-actions.ts:79` | Same status change |
| `components/promotion-booking-panel.tsx` | Redirect to payment page after booking creation |
| `lib/database.types.ts` | Add payment fields to bookings type |
| `lib/paywall.ts:17` | Flip `PAYWALL_ENABLED` to `true` |
| `lib/commission.ts:7` | Flip `ENABLE_AFFILIATE_PAYOUTS` to `true` |
| `app/transactions/transactions-content.tsx` | Replace mock data with real queries |

## New Files to Create

| File | Purpose |
|------|---------|
| `lib/stripe.ts` | Stripe server client singleton |
| `app/api/create-payment-intent/route.ts` | Creates Stripe PaymentIntent for a booking |
| `app/api/webhooks/stripe/route.ts` | Handles Stripe webhook events |
| `app/payment/[bookingId]/page.tsx` | Payment UI with Stripe Elements |
| `supabase/migrations/055_add_payment_fields.sql` | Adds payment columns to bookings |

---

## Booking Flow After Payment Integration

```
User clicks "Book Now"
    │
    ▼
processBooking() creates booking with status: "pending"
    │
    ▼
Redirect to /payment/[bookingId]
    │
    ▼
Create PaymentIntent via /api/create-payment-intent
    │
    ▼
User enters card details (Stripe Elements)
    │
    ▼
stripe.confirmPayment()
    │
    ├── Success → Stripe webhook fires payment_intent.succeeded
    │                 │
    │                 ▼
    │            Update booking: status="confirmed", payment_status="paid"
    │            Decrease promotion capacity
    │            Record affiliate earnings (if applicable)
    │                 │
    │                 ▼
    │            Redirect to /tickets?success=[bookingId]
    │
    └── Failure → Stripe webhook fires payment_intent.payment_failed
                      │
                      ▼
                 Update booking: status="cancelled", payment_status="failed"
                 Show error, let user retry
```

---

## Testing Checklist

- [ ] Booking created with `status: "pending"` (not "confirmed")
- [ ] PaymentIntent created with correct amount and currency
- [ ] Stripe Elements form renders and accepts test cards
- [ ] Webhook correctly flips booking to "confirmed" on success
- [ ] Webhook correctly flips booking to "cancelled" on failure
- [ ] Promotion capacity decremented only after payment succeeds
- [ ] Affiliate earnings recorded only after payment succeeds
- [ ] Cancellation triggers Stripe refund
- [ ] Tickets page only shows "confirmed" (paid) bookings
- [ ] Transaction page shows real booking/payment data
- [ ] `PAYWALL_ENABLED` and `ENABLE_AFFILIATE_PAYOUTS` flags work when enabled
- [ ] Minor account restrictions still enforced before payment
