import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendNewLikeEmail, sendNewCommentEmail } from "@/lib/email-notifications"

/**
 * Server-side endpoint for sending notification emails.
 * This exists because email sending requires RESEND_API_KEY which is only
 * available server-side, but some notification triggers (e.g. comments)
 * originate from client-side code.
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

    if (!type || !recipientUserId || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Don't send emails to yourself
    if (recipientUserId === user.id) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Check recipient's email notification preferences using server-side client
    // (getUserNotificationPreferences uses the browser client which has no auth
    // context server-side, so it always falls back to defaults)
    const { data: prefsRow } = await supabase
      .from("user_preferences")
      .select("notification_preferences")
      .eq("user_id", recipientUserId)
      .single()

    const prefs = {
      email: true,
      likesComments: true,
      ...((prefsRow?.notification_preferences as Record<string, boolean>) || {}),
    }

    if (!prefs.email || !prefs.likesComments) {
      return NextResponse.json({ success: true, skipped: true, reason: "notifications disabled" })
    }

    // Fetch recipient profile (email + name)
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", recipientUserId)
      .single()

    if (!recipientProfile?.email) {
      return NextResponse.json({ success: true, skipped: true, reason: "no email" })
    }

    // Fetch sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    const senderName = senderProfile?.name || "Someone"

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
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending notification email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
