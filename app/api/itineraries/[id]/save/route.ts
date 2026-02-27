import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Save an itinerary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from("saved_itineraries")
      .select("id")
      .eq("user_id", user.id)
      .eq("itinerary_id", itineraryId)
      .eq("type", "save")
      .maybeSingle()

    if (existingSave) {
      // Already saved, return current count
      const { data: metrics } = await supabase
        .from("itinerary_metrics")
        .select("save_count")
        .eq("itinerary_id", itineraryId)
        .single()

      return NextResponse.json({
        success: true,
        saves: metrics?.save_count || 0,
        alreadySaved: true,
      })
    }

    // Insert save
    const { error: insertError } = await supabase
      .from("saved_itineraries")
      .insert({
        user_id: user.id,
        itinerary_id: itineraryId,
        type: "save",
      })

    if (insertError) {
      console.error("Error inserting save:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Get updated save count
    const { data: metrics } = await supabase
      .from("itinerary_metrics")
      .select("save_count")
      .eq("itinerary_id", itineraryId)
      .single()

    // Track interaction for analytics (non-blocking)
    supabase
      .from("user_interactions")
      .insert({ user_id: user.id, itinerary_id: itineraryId, interaction_type: "save" })
      .then(({ error }) => { if (error) console.error("Failed to track save interaction:", error) })

    // Award coins to itinerary owner when their content gets saved (non-blocking)
    try {
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("user_id")
        .eq("id", itineraryId)
        .single()

      if (itinerary && itinerary.user_id !== user.id) {
        supabase.rpc("award_coins", {
          p_user_id: itinerary.user_id,
          p_amount: 15, // COIN_AMOUNTS.itinerary_saved
          p_action: "itinerary_saved",
          p_description: "Itinerary was saved by another user",
          p_reference_type: "itinerary",
          p_reference_id: itineraryId,
          p_metadata: {},
        }).then(({ error }) => {
          if (error) console.warn("Failed to award save coins:", error.message)
        })
      }
    } catch (coinError) {
      console.warn("Coin award skipped:", coinError)
    }

    return NextResponse.json({
      success: true,
      saves: metrics?.save_count || 1,
    })
  } catch (error: any) {
    console.error("Error saving itinerary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Unsave an itinerary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itineraryId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete save
    const { error: deleteError } = await supabase
      .from("saved_itineraries")
      .delete()
      .eq("user_id", user.id)
      .eq("itinerary_id", itineraryId)
      .eq("type", "save")

    if (deleteError) {
      console.error("Error deleting save:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Get updated save count
    const { data: metrics } = await supabase
      .from("itinerary_metrics")
      .select("save_count")
      .eq("itinerary_id", itineraryId)
      .single()

    return NextResponse.json({
      success: true,
      saves: metrics?.save_count || 0,
    })
  } catch (error: any) {
    console.error("Error unsaving itinerary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
