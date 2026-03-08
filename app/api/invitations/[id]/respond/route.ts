import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notification-service"
import { sendRsvpNotificationEmail } from "@/lib/email-notifications"

const VALID_RESPONSES = ["accept", "decline", "tentative"] as const
type RsvpResponse = (typeof VALID_RESPONSES)[number]

const STATUS_MAP: Record<RsvpResponse, string> = {
  accept: "accepted",
  decline: "declined",
  tentative: "tentative",
}

const STATUS_EMOJI: Record<string, string> = {
  accepted: "🎉",
  declined: "😔",
  tentative: "🤔",
}

/**
 * Accept, decline, or mark tentative on an itinerary invitation.
 * POST /api/invitations/[id]/respond
 * Body: { response: "accept" | "decline" | "tentative" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: invitationId } = await params
    const body = await request.json()
    const { response } = body as { response: string }

    if (!response || !VALID_RESPONSES.includes(response as RsvpResponse)) {
      return NextResponse.json(
        { error: "Invalid response. Must be 'accept', 'decline', or 'tentative'." },
        { status: 400 }
      )
    }

    const newStatus = STATUS_MAP[response as RsvpResponse]

    // Fetch the invitation and verify the current user is the invitee
    const { data: invitation, error: fetchError } = await supabase
      .from("itinerary_invitations")
      .select("id, itinerary_id, inviter_id, invitee_id, status, expires_at")
      .eq("id", invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    if (invitation.invitee_id !== user.id) {
      return NextResponse.json(
        { error: "You are not the recipient of this invitation" },
        { status: 403 }
      )
    }

    // Check if the invitation has expired
    // Even if expired, we still allow the user to respond — they're actively
    // clicking a button, so honour that intent. The status will be updated and
    // expires_at cleared below.

    // Allow changing RSVP status (Partiful-style: users can change their mind)
    if (invitation.status === newStatus) {
      return NextResponse.json({
        success: true,
        status: newStatus,
        message: `Already ${newStatus}`,
      })
    }

    // Use service role client for write operations (RLS may block invitee from updating)
    let admin: ReturnType<typeof createServiceRoleClient>
    try {
      admin = createServiceRoleClient()
    } catch {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Update the invitation status (clear expires_at once responded)
    const { error: updateError } = await admin
      .from("itinerary_invitations")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        expires_at: null,
      })
      .eq("id", invitationId)

    if (updateError) {
      console.error("Error updating invitation:", updateError)
      return NextResponse.json(
        { error: "Failed to update invitation" },
        { status: 500 }
      )
    }

    // If accepted, add user as an attendee; if changed away from accepted, remove
    if (newStatus === "accepted") {
      const { error: attendeeError } = await admin
        .from("itinerary_attendees")
        .upsert(
          {
            itinerary_id: invitation.itinerary_id,
            user_id: user.id,
            role: "member",
            joined_at: new Date().toISOString(),
          },
          { onConflict: "itinerary_id,user_id" }
        )

      if (attendeeError) {
        console.error("Error adding attendee:", attendeeError)
      }
    } else if (invitation.status === "accepted") {
      // Was accepted, now changing to something else — remove from attendees
      await admin
        .from("itinerary_attendees")
        .delete()
        .eq("itinerary_id", invitation.itinerary_id)
        .eq("user_id", user.id)
    }

    // Notify the inviter about the response
    const { data: inviteeProfile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single()

    const { data: itinerary } = await supabase
      .from("itineraries")
      .select("title")
      .eq("id", invitation.itinerary_id)
      .single()

    const inviteeName = inviteeProfile?.name || "Someone"
    const itineraryTitle = itinerary?.title || "an itinerary"
    const emoji = STATUS_EMOJI[newStatus] || ""

    await createNotification(
      {
        userId: invitation.inviter_id,
        type: "itinerary_rsvp",
        title: `${emoji} RSVP: ${inviteeName} ${newStatus}`,
        message: `${inviteeName} has ${newStatus === "tentative" ? "marked tentative for" : newStatus} your invitation to "${itineraryTitle}"`,
        linkUrl: `/event/${invitation.itinerary_id}`,
        imageUrl: inviteeProfile?.avatar_url || undefined,
      },
      admin,
    )

    // Send email notification to host about the RSVP
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("email, name")
      .eq("id", invitation.inviter_id)
      .single()

    if (inviterProfile?.email) {
      sendRsvpNotificationEmail(
        inviterProfile.email,
        inviterProfile.name || "there",
        inviteeName,
        newStatus,
        itineraryTitle,
        invitation.itinerary_id,
      ).catch((err: any) => console.error("Failed to send RSVP notification email:", err))
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `RSVP updated to ${newStatus}`,
    })
  } catch (error: any) {
    console.error("Error responding to invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to respond to invitation" },
      { status: 500 }
    )
  }
}
