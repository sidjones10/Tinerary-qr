import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Toggle invitations on/off for an itinerary.
 * PATCH /api/itineraries/[id]/invitations-toggle
 * Body: { enabled: boolean }
 *
 * Only the itinerary owner can toggle this setting.
 * Disabling invitations does NOT remove existing invited/accepted users.
 */
export async function PATCH(
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

    const { id: itineraryId } = await params
    const { enabled } = await request.json()

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 })
    }

    // Verify ownership
    const { data: itinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("id, user_id")
      .eq("id", itineraryId)
      .single()

    if (fetchError || !itinerary) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (itinerary.user_id !== user.id) {
      return NextResponse.json({ error: "Only the event owner can change this setting" }, { status: 403 })
    }

    // Update the flag — does NOT touch any existing invitations
    const { error: updateError } = await supabase
      .from("itineraries")
      .update({ invitations_enabled: enabled })
      .eq("id", itineraryId)

    if (updateError) {
      console.error("Error toggling invitations:", updateError)
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invitations_enabled: enabled,
      message: enabled ? "Invitations enabled" : "Invitations disabled",
    })
  } catch (error: any) {
    console.error("Error in invitations-toggle:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
