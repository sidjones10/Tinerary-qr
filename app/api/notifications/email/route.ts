import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { sendNewLikeEmail, sendNewCommentEmail } from "@/lib/email-notifications"

/**
 * Server-side endpoint for sending notification emails and in-app notifications.
 * This exists because:
 * 1. Email sending requires RESEND_API_KEY (only available server-side)
 * 2. In-app notification inserts for OTHER users are blocked by RLS on the
 *    client (auth.uid() != recipient user_id), so we use a service-role client.
 * 3. Reading another user's preferences is also blocked by RLS, so we use the
 *    service-role client for that too.
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
    const { type, recipientUserId, eventId, eventTitle, content, senderAvatarUrl } = body

    if (!type || !recipientUserId || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Don't send notifications to yourself
    if (recipientUserId === user.id) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Service-role client bypasses RLS — needed to read another user's
    // preferences and to insert notifications for another user.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check recipient's notification preferences
    const { data: prefsRow } = await adminClient
      .from("user_preferences")
      .select("notification_preferences")
      .eq("user_id", recipientUserId)
      .single()

    const prefs = {
      email: true,
      likesComments: true,
      ...((prefsRow?.notification_preferences as Record<string, boolean>) || {}),
    }

    // If likes/comments category is off, skip both in-app and email
    if (!prefs.likesComments) {
      return NextResponse.json({ success: true, skipped: true, reason: "likesComments disabled" })
    }

    // Fetch sender profile (own profile — safe to use regular client)
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    const senderName = senderProfile?.name || "Someone"

    // Create in-app notification for comment
    if (type === "comment") {
      const commentPreview = (content || "").length > 100
        ? (content || "").substring(0, 100) + "..."
        : (content || "")

      await adminClient.from("notifications").insert({
        user_id: recipientUserId,
        type: "new_comment",
        title: `💬 ${senderName} commented on your itinerary`,
        message: commentPreview,
        link_url: `/event/${eventId}`,
        image_url: senderAvatarUrl || null,
        metadata: { itineraryTitle: eventTitle },
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }

    // Send email only if email preference is enabled
    if (prefs.email) {
      const { data: recipientProfile } = await adminClient
        .from("profiles")
        .select("email, name")
        .eq("id", recipientUserId)
        .single()

      if (recipientProfile?.email) {
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
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending notification email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
