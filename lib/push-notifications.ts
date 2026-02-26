import webpush from "web-push"
import { createServiceRoleClient } from "@/lib/supabase/server"

// Configure web-push with VAPID keys
// These must be set in environment variables for push to work.
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@tinerary-app.com"

let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[push] VAPID keys not configured — push notifications disabled")
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidConfigured = true
  return true
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

/**
 * Send a push notification to all of a user's subscribed devices.
 * Automatically removes stale/expired subscriptions.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0 }
  }

  const supabase = createServiceRoleClient()

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0 }
  }

  const jsonPayload = JSON.stringify(payload)
  let sent = 0
  let failed = 0
  const staleIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          jsonPayload
        )
        sent++
      } catch (err: any) {
        failed++
        // 404 or 410 means the subscription is no longer valid
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(sub.id)
        } else {
          console.error(`[push] Failed to send to ${sub.endpoint}:`, err.message)
        }
      }
    })
  )

  // Clean up expired subscriptions
  if (staleIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds)
  }

  return { sent, failed }
}
