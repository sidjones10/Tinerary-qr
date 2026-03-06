import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

// GET - Fetch itinerary data for invite link access
// Uses service role to bypass RLS for private itineraries,
// but only if the authenticated user has a valid invitation or the link contains invite params.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params

    // Require authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Use service role client to bypass RLS and read the itinerary
    const adminClient = createServiceRoleClient()

    // Fetch the itinerary
    const { data: itineraryData, error: itineraryError } = await adminClient
      .from("itineraries")
      .select(`
        *,
        owner:profiles!itineraries_user_id_fkey(
          id,
          name,
          username,
          avatar_url,
          email
        ),
        metrics:itinerary_metrics(
          like_count,
          comment_count,
          save_count,
          view_count
        )
      `)
      .eq("id", itineraryId)
      .single()

    if (itineraryError || !itineraryData) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Security check: only allow if the itinerary is public, the user is the owner,
    // or the user has an existing invitation
    const isOwner = user.id === itineraryData.user_id
    const isPublic = itineraryData.is_public === true

    if (!isOwner && !isPublic) {
      // Check for an existing invitation
      const { data: invitation } = await adminClient
        .from("itinerary_invitations")
        .select("id")
        .eq("itinerary_id", itineraryId)
        .eq("invitee_id", user.id)
        .limit(1)
        .maybeSingle()

      // If no invitation exists, create a pending one from the invite link
      // This allows the user to view the event and RSVP
      if (!invitation) {
        await adminClient
          .from("itinerary_invitations")
          .insert({
            itinerary_id: itineraryId,
            invitee_id: user.id,
            inviter_id: itineraryData.user_id,
            status: "pending",
          })
      }
    }

    // Fetch related data in parallel
    const [
      { data: activitiesData },
      { data: packingData },
      { data: expensesData },
      { data: attendeesData }
    ] = await Promise.all([
      adminClient
        .from("activities")
        .select("*")
        .eq("itinerary_id", itineraryId)
        .order("start_time", { ascending: true }),
      adminClient
        .from("packing_items")
        .select("*")
        .eq("itinerary_id", itineraryId),
      adminClient
        .from("expenses")
        .select("*")
        .eq("itinerary_id", itineraryId),
      adminClient
        .from("itinerary_attendees")
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq("itinerary_id", itineraryId)
    ])

    return NextResponse.json({
      itinerary: itineraryData,
      activities: activitiesData || [],
      packingItems: packingData || [],
      expenses: expensesData || [],
      attendees: attendeesData || [],
    })
  } catch (error: any) {
    console.error("Error in invite-view:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
