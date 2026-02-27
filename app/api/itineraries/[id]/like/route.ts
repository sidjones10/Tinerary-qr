import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { notifyNewLike } from "@/lib/notification-service"
import { sendNewLikeEmail } from "@/lib/email-notifications"

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

    // Track interaction for analytics (non-blocking)
    supabase
      .from("user_interactions")
      .insert({ user_id: user.id, itinerary_id: itineraryId, interaction_type: "like" })
      .then(({ error }) => { if (error) console.error("Failed to track like interaction:", error) })

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

        // Send email notification (use admin client to read recipient's prefs)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const adminClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )

          adminClient
            .from("user_preferences")
            .select("notification_preferences")
            .eq("user_id", itinerary.user_id)
            .single()
            .then(async ({ data: prefsRow }) => {
              const prefs = {
                email: true,
                likesComments: true,
                ...((prefsRow?.notification_preferences as Record<string, boolean>) || {}),
              }
              if (!prefs.email || !prefs.likesComments) return

              const { data: ownerProfile } = await adminClient
                .from("profiles")
                .select("email, name")
                .eq("id", itinerary.user_id)
                .single()

              if (ownerProfile?.email) {
                sendNewLikeEmail(
                  ownerProfile.email,
                  ownerProfile.name || "there",
                  likerProfile?.name || "Someone",
                  itinerary.title,
                  itineraryId
                ).catch(err => console.error("Failed to send like email:", err))
              }
            }).catch(err => console.error("Failed to check email prefs:", err))
        }
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError)
    }

    // Award coins to itinerary owner — check if view milestone reached (non-blocking)
    try {
      const { data: itineraryForCoins } = await supabase
        .from("itineraries")
        .select("user_id")
        .eq("id", itineraryId)
        .single()

      if (itineraryForCoins && itineraryForCoins.user_id !== user.id) {
        // Check if view count just crossed 10 — award milestone coins
        const currentViews = metrics?.like_count || 0
        if (currentViews >= 10) {
          // Check if this milestone was already awarded
          const { count: alreadyAwarded } = await supabase
            .from("coin_transactions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", itineraryForCoins.user_id)
            .eq("action", "itinerary_10_views")
            .eq("reference_id", itineraryId)

          if (!alreadyAwarded || alreadyAwarded === 0) {
            supabase.rpc("award_coins", {
              p_user_id: itineraryForCoins.user_id,
              p_amount: 25, // itinerary_10_views
              p_action: "itinerary_10_views",
              p_description: "Itinerary reached 10+ views",
              p_reference_type: "itinerary",
              p_reference_id: itineraryId,
              p_metadata: {},
            }).then(({ error }) => {
              if (error) console.warn("Failed to award view milestone coins:", error.message)
            })
          }
        }
      }
    } catch (coinError) {
      console.warn("Coin award skipped:", coinError)
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
