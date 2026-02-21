import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getUserNotificationPreferences,
  notifyNewComment,
  notifyNewLike,
  notifyNewFollower,
} from "@/lib/notification-service"
import { sendNewLikeEmail, sendNewCommentEmail, sendNewFollowerEmail } from "@/lib/email-notifications"

/**
 * Server-side endpoint for sending notification emails AND creating in-app
 * notifications.  This exists because:
 *   - Email sending requires RESEND_API_KEY (server-only)
 *   - In-app notification inserts require the service-role key to bypass RLS
 *     (the acting user is inserting a notification for a *different* user)
 *
 * Client-side callers (comment-service, follow-service) POST here so that
 * both the in-app notification and the email are handled server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipientUserId, eventId, eventTitle, content } = body

    if (!type || !recipientUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Don't send notifications to yourself
    if (recipientUserId === user.id) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Fetch sender profile (name, username, avatar) for notifications
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("name, username, avatar_url")
      .eq("id", user.id)
      .single()

    const senderName = senderProfile?.name || "Someone"

    // ── 1. Create in-app notification (runs server-side → uses service role key) ──
    if (type === "comment") {
      notifyNewComment(
        recipientUserId,
        senderName,
        senderProfile?.avatar_url || null,
        eventId,
        eventTitle || "",
        content || ""
      ).catch(err => console.error("Failed to create comment in-app notification:", err))
    } else if (type === "like") {
      notifyNewLike(
        recipientUserId,
        senderName,
        senderProfile?.avatar_url || null,
        eventId,
        eventTitle || "",
        user.id
      ).catch(err => console.error("Failed to create like in-app notification:", err))
    } else if (type === "follow") {
      notifyNewFollower(
        recipientUserId,
        senderName,
        senderProfile?.username || null,
        senderProfile?.avatar_url || null,
        user.id
      ).catch(err => console.error("Failed to create follow in-app notification:", err))
    }

    // ── 2. Send email notification (if preferences allow) ──
    const prefs = await getUserNotificationPreferences(recipientUserId)
    if (!prefs.email) {
      return NextResponse.json({ success: true, emailSkipped: true, reason: "email disabled" })
    }

    // Type-specific preference gate
    if ((type === "comment" || type === "like") && !prefs.likesComments) {
      return NextResponse.json({ success: true, emailSkipped: true, reason: "likesComments disabled" })
    }
    if (type === "follow" && !prefs.newFollowers) {
      return NextResponse.json({ success: true, emailSkipped: true, reason: "newFollowers disabled" })
    }

    // Fetch recipient profile for email delivery
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", recipientUserId)
      .single()

    if (!recipientProfile?.email) {
      return NextResponse.json({ success: true, emailSkipped: true, reason: "no email" })
    }

    if (type === "like") {
      await sendNewLikeEmail(
        recipientProfile.email,
        recipientProfile.name || "there",
        senderName,
        eventTitle || "your itinerary",
        eventId
      )
    } else if (type === "comment") {
      await sendNewCommentEmail(
        recipientProfile.email,
        recipientProfile.name || "there",
        senderName,
        content || "",
        eventTitle || "your itinerary",
        eventId
      )
    } else if (type === "follow") {
      await sendNewFollowerEmail(
        recipientProfile.email,
        recipientProfile.name || "there",
        senderName,
        senderProfile?.username || user.id,
        senderProfile?.avatar_url || null
      )
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
