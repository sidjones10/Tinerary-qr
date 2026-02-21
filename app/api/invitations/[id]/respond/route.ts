import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createNotification } from "@/lib/notification-service"

/**
 * Accept or decline an itinerary invitation.
 * POST /api/invitations/[id]/respond
 * Body: { response: "accept" | "decline" }
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
    const { response } = body

    if (!response || !["accept", "decline"].includes(response)) {
      return NextResponse.json(
        { error: "Invalid response. Must be 'accept' or 'decline'." },
        { status: 400 }
      )
    }

    const newStatus = response === "accept" ? "accepted" : "declined"

    // Fetch the invitation and verify the current user is the invitee
    const { data: invitation, error: fetchError } = await supabase
      .from("itinerary_invitations")
      .select("id, itinerary_id, inviter_id, invitee_id, status")
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

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 409 }
      )
    }

    // Update the invitation status
    const { error: updateError } = await supabase
      .from("itinerary_invitations")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)

    if (updateError) {
      console.error("Error updating invitation:", updateError)
      return NextResponse.json(
        { error: "Failed to update invitation" },
        { status: 500 }
      )
    }

    // If accepted, add user as an attendee
    if (newStatus === "accepted") {
      const { error: attendeeError } = await supabase
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
        // Non-fatal: invitation is still accepted even if attendee insert fails
      }
    }

    // Notify the inviter about the response
    const { data: inviteeProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    const { data: itinerary } = await supabase
      .from("itineraries")
      .select("title")
      .eq("id", invitation.itinerary_id)
      .single()

    const inviteeName = inviteeProfile?.name || "Someone"
    const itineraryTitle = itinerary?.title || "an itinerary"

    await createNotification({
      userId: invitation.inviter_id,
      type: "itinerary_rsvp",
      title: `Invitation ${newStatus}`,
      message: `${inviteeName} has ${newStatus} your invitation to "${itineraryTitle}"`,
      linkUrl: `/event/${invitation.itinerary_id}`,
    })

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Invitation ${newStatus} successfully`,
    })
  } catch (error: any) {
    console.error("Error responding to invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to respond to invitation" },
      { status: 500 }
    )
  }
}
