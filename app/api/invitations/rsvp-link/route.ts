import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notification-service"
import { sendRsvpNotificationEmail } from "@/lib/email-notifications"

const STATUS_MAP: Record<string, string> = {
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
 * Link-based RSVP — Partiful-style.
 * Any authenticated user can RSVP to an event by visiting the link.
 * Creates an invitation record on-the-fly if one doesn't exist.
 *
 * POST /api/invitations/rsvp-link
 * Body: { itineraryId: string, response: "accept" | "decline" | "tentative" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itineraryId, response } = body

    if (!itineraryId || !response || !STATUS_MAP[response]) {
      return NextResponse.json(
        { error: "Missing itineraryId or invalid response. Must be 'accept', 'decline', or 'tentative'." },
        { status: 400 }
      )
    }

    const newStatus = STATUS_MAP[response]

    // Use service role client for DB writes (bypasses RLS since inviter_id != auth.uid())
    let admin: ReturnType<typeof createServiceRoleClient>
    try {
      admin = createServiceRoleClient()
    } catch {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Fetch itinerary to get the owner
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("id, user_id, title")
      .eq("id", itineraryId)
      .single()

    if (itineraryError || !itinerary) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Can't RSVP to your own event
    if (itinerary.user_id === user.id) {
      return NextResponse.json({ error: "You are the host of this event" }, { status: 400 })
    }

    // Check for existing invitation (user can see their own via RLS)
    const { data: existing } = await supabase
      .from("itinerary_invitations")
      .select("id, status, expires_at")
      .eq("itinerary_id", itineraryId)
      .eq("invitee_id", user.id)
      .limit(1)
      .maybeSingle()

    let invitationId: string

    if (existing) {
      // Check if the invitation has expired
      if (existing.status === "expired" || (existing.status === "pending" && existing.expires_at && new Date(existing.expires_at) < new Date())) {
        return NextResponse.json(
          { error: "This invitation has expired. Please ask the host to send a new invite." },
          { status: 410 }
        )
      }

      if (existing.status === newStatus) {
        return NextResponse.json({
          success: true,
          invitationId: existing.id,
          status: newStatus,
          message: `Already ${newStatus}`,
        })
      }

      const { error: updateError } = await admin
        .from("itinerary_invitations")
        .update({ status: newStatus, updated_at: new Date().toISOString(), expires_at: null })
        .eq("id", existing.id)

      if (updateError) {
        console.error("Error updating invitation:", updateError)
        return NextResponse.json({ error: "Failed to update RSVP" }, { status: 500 })
      }

      invitationId = existing.id

      if (newStatus === "accepted") {
        await admin
          .from("itinerary_attendees")
          .upsert(
            { itinerary_id: itineraryId, user_id: user.id, role: "member", joined_at: new Date().toISOString() },
            { onConflict: "itinerary_id,user_id" }
          )
      } else if (existing.status === "accepted") {
        await admin
          .from("itinerary_attendees")
          .delete()
          .eq("itinerary_id", itineraryId)
          .eq("user_id", user.id)
      }
    } else {
      // No existing invitation — create one (self-invite via link)
      const { data: newInvite, error: insertError } = await admin
        .from("itinerary_invitations")
        .insert({
          itinerary_id: itineraryId,
          inviter_id: itinerary.user_id,
          invitee_id: user.id,
          status: newStatus,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating invitation:", insertError)
        return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 })
      }

      invitationId = newInvite.id

      if (newStatus === "accepted") {
        await admin
          .from("itinerary_attendees")
          .upsert(
            { itinerary_id: itineraryId, user_id: user.id, role: "member", joined_at: new Date().toISOString() },
            { onConflict: "itinerary_id,user_id" }
          )
      }
    }

    // Notify the host
    const { data: rsvpProfile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single()

    const rsvpName = rsvpProfile?.name || "Someone"
    const emoji = STATUS_EMOJI[newStatus] || ""

    await createNotification(
      {
        userId: itinerary.user_id,
        type: "itinerary_rsvp",
        title: `${emoji} RSVP: ${rsvpName} ${newStatus}`,
        message: `${rsvpName} has ${newStatus === "tentative" ? "marked tentative for" : newStatus} "${itinerary.title}"`,
        linkUrl: `/event/${itineraryId}`,
        imageUrl: rsvpProfile?.avatar_url || undefined,
      },
      admin,
    )

    // Send email to host
    const { data: hostProfile } = await admin
      .from("profiles")
      .select("email, name")
      .eq("id", itinerary.user_id)
      .single()

    if (hostProfile?.email) {
      sendRsvpNotificationEmail(
        hostProfile.email,
        hostProfile.name || "there",
        rsvpName,
        newStatus,
        itinerary.title,
        itineraryId,
      ).catch((err: any) => console.error("Failed to send RSVP email:", err))
    }

    return NextResponse.json({
      success: true,
      invitationId,
      status: newStatus,
      message: `RSVP updated to ${newStatus}`,
    })
  } catch (error: any) {
    console.error("Error in link RSVP:", error)
    return NextResponse.json(
      { error: error.message || "Failed to RSVP" },
      { status: 500 }
    )
  }
}
