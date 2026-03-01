import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Track a view on an itinerary and check milestones
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params
    const supabase = await createClient()

    // Increment view count
    const { error: rpcError } = await supabase.rpc("increment_view_count", {
      itinerary_id: itineraryId,
    })

    if (rpcError) {
      console.error("Error incrementing view count:", rpcError)
      return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    // Get current user (optional — unauthenticated views still count)
    const { data: { user } } = await supabase.auth.getUser()

    // Track in user_interactions for analytics (authenticated users only)
    if (user?.id) {
      supabase
        .from("user_interactions")
        .insert({ user_id: user.id, itinerary_id: itineraryId, interaction_type: "view" })
        .then(({ error }) => { if (error) console.error("Failed to track view interaction:", error) })
    }

    // Check if view count just crossed 10 — award milestone coins to owner
    try {
      const { data: metrics } = await supabase
        .from("itinerary_metrics")
        .select("view_count")
        .eq("itinerary_id", itineraryId)
        .single()

      const currentViews = metrics?.view_count || 0

      if (currentViews >= 10) {
        const { data: itinerary } = await supabase
          .from("itineraries")
          .select("user_id")
          .eq("id", itineraryId)
          .single()

        if (itinerary) {
          // Check if this milestone was already awarded
          const { count: alreadyAwarded } = await supabase
            .from("coin_transactions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", itinerary.user_id)
            .eq("action", "itinerary_10_views")
            .eq("reference_id", itineraryId)

          if (!alreadyAwarded || alreadyAwarded === 0) {
            await supabase.rpc("award_coins", {
              p_user_id: itinerary.user_id,
              p_amount: 25,
              p_action: "itinerary_10_views",
              p_description: "Itinerary reached 10+ views",
              p_reference_type: "itinerary",
              p_reference_id: itineraryId,
              p_metadata: {},
            })
          }
        }
      }
    } catch (coinError) {
      console.warn("View milestone coin check skipped:", coinError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
