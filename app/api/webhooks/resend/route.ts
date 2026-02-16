import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { createClient } from "@supabase/supabase-js"

// Resend webhook event types we handle
const HANDLED_EVENTS = [
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.opened",
  "email.clicked",
] as const

type ResendEventType = (typeof HANDLED_EVENTS)[number]

interface ResendWebhookPayload {
  type: ResendEventType
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    [key: string]: unknown
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase env vars not set")
  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    // ── Verify webhook signature ──────────────────────────────────
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET is not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    const body = await request.text()
    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
    }

    const wh = new Webhook(webhookSecret)
    let payload: ResendWebhookPayload

    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ResendWebhookPayload
    } catch {
      console.error("Webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // ── Handle event ──────────────────────────────────────────────
    const { type, data } = payload
    const resendId = data.email_id

    if (!resendId) {
      return NextResponse.json({ error: "No email_id in payload" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    switch (type) {
      case "email.delivered": {
        await supabase
          .from("email_logs")
          .update({ status: "delivered", delivered_at: now })
          .eq("resend_id", resendId)
        break
      }

      case "email.delivery_delayed": {
        await supabase
          .from("email_logs")
          .update({ status: "delayed" })
          .eq("resend_id", resendId)
        break
      }

      case "email.bounced": {
        await supabase
          .from("email_logs")
          .update({
            status: "bounced",
            bounced_at: now,
            error_message: JSON.stringify(data),
          })
          .eq("resend_id", resendId)
        break
      }

      case "email.complained": {
        await supabase
          .from("email_logs")
          .update({ status: "complained", complained_at: now })
          .eq("resend_id", resendId)
        break
      }

      case "email.opened": {
        // Only set opened_at if not already set (first open)
        const { data: existing } = await supabase
          .from("email_logs")
          .select("opened_at")
          .eq("resend_id", resendId)
          .single()

        if (existing && !existing.opened_at) {
          await supabase
            .from("email_logs")
            .update({ opened_at: now })
            .eq("resend_id", resendId)
        }
        break
      }

      case "email.clicked": {
        // Only set clicked_at if not already set (first click)
        const { data: existingClick } = await supabase
          .from("email_logs")
          .select("clicked_at")
          .eq("resend_id", resendId)
          .single()

        if (existingClick && !existingClick.clicked_at) {
          await supabase
            .from("email_logs")
            .update({ clicked_at: now })
            .eq("resend_id", resendId)
        }
        break
      }

      default:
        // Unknown event type — acknowledge but don't process
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Resend webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
