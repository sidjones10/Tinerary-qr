import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fetch high-performing mid-tier itineraries for guest browsing
// These are popular but not the top-tier ones, to show variety
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get public itineraries with good engagement (mid-tier performers)
    // We want itineraries that have some likes but aren't the absolute top
    // This gives guests a good representation of the platform
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select(`
        id,
        title,
        description,
        location,
        start_date,
        end_date,
        image_url,
        theme,
        font,
        like_count,
        view_count,
        user_id,
        created_at,
        profiles:user_id (
          id,
          name,
          username,
          avatar_url
        ),
        activities:activities (
          id,
          title,
          location,
          start_time,
          description
        )
      `)
      .eq("is_public", true)
      .gte("like_count", 1) // Has at least 1 like
      .order("like_count", { ascending: false })
      .limit(20) // Get more than needed to pick mid-tier

    if (error) {
      console.error("Error fetching featured itineraries:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Select mid-tier performers (skip top 5, take next 5-10)
    // If we don't have enough, just take what we have
    let featuredItineraries = itineraries || []

    if (featuredItineraries.length > 10) {
      // Skip top 5 (too popular), take next 5
      featuredItineraries = featuredItineraries.slice(5, 10)
    } else if (featuredItineraries.length > 5) {
      // Take middle ones
      const start = Math.floor((featuredItineraries.length - 5) / 2)
      featuredItineraries = featuredItineraries.slice(start, start + 5)
    } else {
      // Take all we have (up to 5)
      featuredItineraries = featuredItineraries.slice(0, 5)
    }

    // If we still don't have 5, supplement with recent public itineraries
    if (featuredItineraries.length < 5) {
      const existingIds = featuredItineraries.map(i => i.id)

      const { data: recentItineraries, error: recentError } = await supabase
        .from("itineraries")
        .select(`
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          image_url,
          theme,
          font,
          like_count,
          view_count,
          user_id,
          created_at,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          ),
          activities:activities (
            id,
            title,
            location,
            start_time,
            description
          )
        `)
        .eq("is_public", true)
        .not("id", "in", `(${existingIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(5 - featuredItineraries.length)

      if (!recentError && recentItineraries) {
        featuredItineraries = [...featuredItineraries, ...recentItineraries]
      }
    }

    // Format the response
    const formattedItineraries = featuredItineraries.map((itinerary: any) => ({
      id: itinerary.id,
      title: itinerary.title,
      description: itinerary.description,
      location: itinerary.location,
      startDate: itinerary.start_date,
      endDate: itinerary.end_date,
      imageUrl: itinerary.image_url,
      theme: itinerary.theme || "default",
      font: itinerary.font || "default",
      likeCount: itinerary.like_count || 0,
      viewCount: itinerary.view_count || 0,
      createdAt: itinerary.created_at,
      host: itinerary.profiles ? {
        id: itinerary.profiles.id,
        name: itinerary.profiles.name || "Anonymous",
        username: itinerary.profiles.username,
        avatarUrl: itinerary.profiles.avatar_url,
      } : null,
      activityCount: itinerary.activities?.length || 0,
      isEvent: itinerary.start_date === itinerary.end_date,
    }))

    return NextResponse.json({
      success: true,
      itineraries: formattedItineraries,
    })
  } catch (error: any) {
    console.error("Error in featured itineraries API:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch featured itineraries" },
      { status: 500 }
    )
  }
}
