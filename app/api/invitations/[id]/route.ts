import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

/**
 * Remove an invited attender from an itinerary.
 * DELETE /api/invitations/[id]
 *
 * Only the itinerary owner can remove invitations.
 * This deletes the invitation record and, if the invitee had accepted,
 * also removes them from the itinerary_attendees table.
 */
export async function DELETE(
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

    // Determine whether this is a user invitation or a pending (non-user) invitation
    // by checking the `type` query parameter. Default to user invitation.
    const { searchParams } = new URL(request.url)
    const invitationType = searchParams.get("type") || "user"

    let admin: ReturnType<typeof createServiceRoleClient>
    try {
      admin = createServiceRoleClient()
    } catch {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (invitationType === "pending") {
      // Pending invitation (non-user) — look up in pending_invitations
      const { data: pendingInvite, error: fetchError } = await admin
        .from("pending_invitations")
        .select("id, itinerary_id, inviter_id")
        .eq("id", invitationId)
        .single()

      if (fetchError || !pendingInvite) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }

      // Verify the current user owns the itinerary
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("id, user_id")
        .eq("id", pendingInvite.itinerary_id)
        .single()

      if (!itinerary || itinerary.user_id !== user.id) {
        return NextResponse.json(
          { error: "Only the itinerary owner can remove invitations" },
          { status: 403 }
        )
      }

      // Delete the pending invitation
      const { error: deleteError } = await admin
        .from("pending_invitations")
        .delete()
        .eq("id", invitationId)

      if (deleteError) {
        console.error("Error deleting pending invitation:", deleteError)
        return NextResponse.json({ error: "Failed to remove invitation" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Pending invitation removed" })
    }

    // User invitation — look up in itinerary_invitations
    const { data: invitation, error: fetchError } = await admin
      .from("itinerary_invitations")
      .select("id, itinerary_id, inviter_id, invitee_id, status")
      .eq("id", invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Verify the current user owns the itinerary
    const { data: itinerary } = await supabase
      .from("itineraries")
      .select("id, user_id")
      .eq("id", invitation.itinerary_id)
      .single()

    if (!itinerary || itinerary.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only the itinerary owner can remove invitations" },
        { status: 403 }
      )
    }

    // If the invitee had accepted, remove them from itinerary_attendees
    if (invitation.status === "accepted" && invitation.invitee_id) {
      await admin
        .from("itinerary_attendees")
        .delete()
        .eq("itinerary_id", invitation.itinerary_id)
        .eq("user_id", invitation.invitee_id)
    }

    // Delete the invitation
    const { error: deleteError } = await admin
      .from("itinerary_invitations")
      .delete()
      .eq("id", invitationId)

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError)
      return NextResponse.json({ error: "Failed to remove invitation" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Invitation removed" })
  } catch (error: any) {
    console.error("Error removing invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to remove invitation" },
      { status: 500 }
    )
  }
}
