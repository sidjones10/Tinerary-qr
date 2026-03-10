import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
  sendWelcomeEmail,
  sendWhatsNewEmail,
  sendEventReminderEmail,
  sendCountdownReminderEmail,
  sendEventStartedEmail,
  sendNewFollowerEmail,
  sendNewLikeEmail,
  sendNewCommentEmail,
  sendSignInAlertEmail,
  sendAccountDeletionWarningEmail,
  sendEventInviteEmail,
} from "@/lib/email-notifications"
import { rateLimit, getClientIp } from "@/lib/rate-limit"
import { writeAuditLog } from "@/lib/audit-log"

const RATE_LIMIT = { maxRequests: 10, windowSeconds: 60 * 60 }
const MAX_BATCH_SIZE = 500

// Each email type and the sample data used when sending from admin
type EmailType =
  | "welcome"
  | "whats_new"
  | "event_invite"
  | "event_reminder"
  | "countdown_reminder"
  | "event_started"
  | "new_follower"
  | "new_like"
  | "new_comment"
  | "signin_alert"
  | "account_deletion_warning"

async function sendEmailByType(
  emailType: EmailType,
  recipientEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  switch (emailType) {
    case "welcome":
      return sendWelcomeEmail(recipientEmail, recipientName || "traveler")

    case "whats_new":
      return sendWhatsNewEmail({ email: recipientEmail, name: recipientName })

    case "event_invite":
      return sendEventInviteEmail(
        recipientEmail,
        recipientName,
        "Sample Event",
        new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        "Sample Location",
        "Tinerary Admin",
        "sample-event-id"
      )

    case "event_reminder":
      return sendEventReminderEmail(
        recipientEmail,
        recipientName,
        "Your Upcoming Event",
        new Date(Date.now() + 86400000).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        "Event Location",
        24,
        "sample-event-id"
      )

    case "countdown_reminder":
      return sendCountdownReminderEmail({
        email: recipientEmail,
        name: recipientName,
        itineraryTitle: "Sample Itinerary",
        itineraryId: "sample-id",
        timeRemaining: "2 days",
        eventDate: new Date(Date.now() + 2 * 86400000).toLocaleDateString(
          "en-US",
          { weekday: "long", month: "long", day: "numeric", year: "numeric" }
        ),
        location: "Sample Location",
      })

    case "event_started":
      return sendEventStartedEmail({
        email: recipientEmail,
        name: recipientName,
        itineraryTitle: "Sample Event",
        itineraryId: "sample-id",
        location: "Sample Location",
      })

    case "new_follower":
      return sendNewFollowerEmail(
        recipientEmail,
        recipientName,
        "Sample Follower",
        "samplefollower",
        null
      )

    case "new_like":
      return sendNewLikeEmail(
        recipientEmail,
        recipientName,
        "A Tinerary User",
        "Sample Itinerary",
        "sample-id"
      )

    case "new_comment":
      return sendNewCommentEmail(
        recipientEmail,
        recipientName,
        "A Tinerary User",
        "This is a sample comment on your itinerary!",
        "Sample Itinerary",
        "sample-id"
      )

    case "signin_alert":
      return sendSignInAlertEmail({
        email: recipientEmail,
        name: recipientName,
        ipAddress: "0.0.0.0",
        userAgent: "Admin Test",
        deviceInfo: "Admin Dashboard",
      })

    case "account_deletion_warning":
      return sendAccountDeletionWarningEmail({
        email: recipientEmail,
        name: recipientName,
        username: recipientName,
        deletionDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString(
          "en-US",
          { month: "long", day: "numeric", year: "numeric" }
        ),
        daysRemaining: 30,
      })

    default:
      return { success: false, error: `Unknown email type: ${emailType}` }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const ip = getClientIp(request)
    const rl = await rateLimit(`admin-send-email:${ip}`, RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rl.resetAt - Date.now()) / 1000)
            ),
          },
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    const {
      emailType,
      recipientIds,
      sendToAll = false,
      dryRun = false,
    }: {
      emailType: EmailType
      recipientIds?: string[]
      sendToAll?: boolean
      dryRun?: boolean
    } = body

    if (!emailType) {
      return NextResponse.json(
        { success: false, error: "emailType is required" },
        { status: 400 }
      )
    }

    if (!sendToAll && (!recipientIds || recipientIds.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Either recipientIds or sendToAll is required",
        },
        { status: 400 }
      )
    }

    // Fetch recipients
    let query = supabase
      .from("profiles")
      .select("id, email, name, username")
      .not("email", "is", null)

    if (!sendToAll && recipientIds) {
      query = query.in("id", recipientIds)
    }

    query = query.limit(MAX_BATCH_SIZE)

    const { data: users, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch users",
          details: fetchError.message,
        },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found to send to",
        stats: { total: 0, sent: 0, failed: 0 },
      })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: "Dry run - no emails sent",
        stats: { total: users.length, wouldSend: users.length },
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name || u.username,
        })),
      })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    }

    for (const u of users) {
      if (!u.email) continue

      const displayName = u.name || u.username || "traveler"
      const result = await sendEmailByType(emailType, u.email, displayName)

      if (result.success) {
        results.sent++
      } else {
        results.failed++
        results.errors.push({
          email: u.email,
          error: result.error || "Unknown error",
        })
      }

      // Small delay between emails to avoid rate limiting
      if (users.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    await writeAuditLog({
      actor_id: user.id,
      action: "send_email",
      ip_address: ip,
      metadata: {
        emailType,
        sendToAll,
        recipientCount: users.length,
        sent: results.sent,
        failed: results.failed,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} ${emailType} emails`,
      stats: {
        total: users.length,
        sent: results.sent,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error: unknown) {
    console.error("Send email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
