import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notifyNewLike } from "@/lib/notification-service"

// POST - Like an itinerary
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

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("saved_itineraries")
      .select("id")
      .eq("user_id", user.id)
      .eq("itinerary_id", itineraryId)
      .eq("type", "like")
      .maybeSingle()

    if (existingLike) {
      // Already liked, return current count
      const { data: metrics } = await supabase
        .from("itinerary_metrics")
        .select("like_count")
        .eq("itinerary_id", itineraryId)
        .single()

      return NextResponse.json({
        success: true,
        likes: metrics?.like_count || 0,
        alreadyLiked: true,
      })
    }

    // Insert like
    const { error: insertError } = await supabase
      .from("saved_itineraries")
      .insert({
        user_id: user.id,
        itinerary_id: itineraryId,
        type: "like",
      })

    if (insertError) {
      console.error("Error inserting like:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Get updated like count
    const { data: metrics } = await supabase
      .from("itinerary_metrics")
      .select("like_count")
      .eq("itinerary_id", itineraryId)
      .single()

    // Send notification to itinerary owner (async)
    try {
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("user_id, title")
        .eq("id", itineraryId)
        .single()

      if (itinerary && itinerary.user_id !== user.id) {
        const { data: likerProfile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single()

        notifyNewLike(
          itinerary.user_id,
          likerProfile?.name || "Someone",
          likerProfile?.avatar_url || null,
          itineraryId,
          itinerary.title,
          user.id
        ).catch(err => console.error("Failed to send like notification:", err))
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError)
    }

    return NextResponse.json({
      success: true,
      likes: metrics?.like_count || 1,
    })
  } catch (error: any) {
    console.error("Error liking itinerary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Unlike an itinerary
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

    // Delete like
    const { error: deleteError } = await supabase
      .from("saved_itineraries")
      .delete()
      .eq("user_id", user.id)
      .eq("itinerary_id", itineraryId)
      .eq("type", "like")

    if (deleteError) {
      console.error("Error deleting like:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Get updated like count
    const { data: metrics } = await supabase
      .from("itinerary_metrics")
      .select("like_count")
      .eq("itinerary_id", itineraryId)
      .single()

    return NextResponse.json({
      success: true,
      likes: metrics?.like_count || 0,
    })
  } catch (error: any) {
    console.error("Error unliking itinerary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
