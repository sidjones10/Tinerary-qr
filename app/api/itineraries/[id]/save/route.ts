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
