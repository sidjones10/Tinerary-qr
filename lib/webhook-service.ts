import crypto from "crypto"
import { createServiceRoleClient } from "@/lib/supabase/server"

// ─── Types ──────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  "promotion.created",
  "promotion.updated",
  "promotion.viewed",
  "promotion.clicked",
  "promotion.saved",
  "booking.created",
  "booking.confirmed",
  "booking.cancelled",
  "metrics.daily_report",
  "mention.detected",
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export interface WebhookRecord {
  id: string
  business_id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface WebhookDeliveryRecord {
  id: string
  webhook_id: string
  event: string
  payload: Record<string, unknown>
  response_status: number | null
  response_body: string | null
  success: boolean
  attempt: number
  delivered_at: string
}

// ─── Signing ────────────────────────────────────────────────────

/**
 * Sign a webhook payload with HMAC-SHA256.
 * Returns the signature as a hex string prefixed with "sha256=".
 */
export function signPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload, "utf8")
  return `sha256=${hmac.digest("hex")}`
}

/**
 * Generate a random webhook signing secret.
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`
}

// ─── Delivery ───────────────────────────────────────────────────

const MAX_RETRIES = 3
const RETRY_DELAYS_MS = [1000, 5000, 15000] // 1s, 5s, 15s

interface DeliveryResult {
  success: boolean
  statusCode: number | null
  body: string | null
  attempt: number
}

/**
 * Deliver a single webhook payload to a URL with retry logic.
 */
async function deliverToUrl(
  url: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
  secret: string
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload)
  const signature = signPayload(body, secret)
  const timestamp = Date.now().toString()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tinerary-Event": event,
          "X-Tinerary-Signature": signature,
          "X-Tinerary-Timestamp": timestamp,
          "User-Agent": "Tinerary-Webhooks/1.0",
        },
        signal: AbortSignal.timeout(10_000), // 10s timeout
      })

      const responseBody = await res.text().catch(() => null)

      if (res.ok) {
        return { success: true, statusCode: res.status, body: responseBody, attempt }
      }

      // 4xx errors (except 429) are not retried — client error
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { success: false, statusCode: res.status, body: responseBody, attempt }
      }

      // 5xx or 429 — retry after delay
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]))
      } else {
        return { success: false, statusCode: res.status, body: responseBody, attempt }
      }
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        return {
          success: false,
          statusCode: null,
          body: err instanceof Error ? err.message : "Unknown error",
          attempt,
        }
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]))
    }
  }

  return { success: false, statusCode: null, body: "Max retries exceeded", attempt: MAX_RETRIES }
}

/**
 * Fire a webhook event for a business.
 * Looks up all active webhooks subscribed to this event and delivers to each.
 * Runs fire-and-forget — call without awaiting in request handlers.
 */
export async function fireWebhookEvent(
  businessId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    const { data: webhooks, error } = await supabase
      .from("business_webhooks")
      .select("id, url, secret, events")
      .eq("business_id", businessId)
      .eq("is_active", true)

    if (error || !webhooks || webhooks.length === 0) return

    const matching = webhooks.filter((w: WebhookRecord) =>
      w.events.includes(event)
    )
    if (matching.length === 0) return

    const payload = {
      event,
      business_id: businessId,
      timestamp: new Date().toISOString(),
      data,
    }

    const deliveries = matching.map(async (webhook: WebhookRecord) => {
      const result = await deliverToUrl(webhook.url, event, payload, webhook.secret)

      // Log delivery
      await supabase.from("webhook_delivery_log").insert({
        webhook_id: webhook.id,
        event,
        payload,
        response_status: result.statusCode,
        response_body: result.body?.slice(0, 2000) ?? null,
        success: result.success,
        attempt: result.attempt,
      })
    })

    await Promise.allSettled(deliveries)
  } catch {
    // Webhook delivery should never break the caller
    console.error(`[webhook-service] Failed to fire event ${event} for business ${businessId}`)
  }
}
