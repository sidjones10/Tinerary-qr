import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fetch high-performing mid-tier itineraries for guest browsing
// These are popular but not the top-tier ones, to show variety
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get public itineraries with good engagement (mid-tier performers)
    // Join with itinerary_metrics to get like_count and view_count
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
        ),
        itinerary_metrics (
          like_count,
          view_count,
          comment_count,
          save_count
        )
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(30) // Get more to filter by engagement

    if (error) {
      console.error("Error fetching featured itineraries:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort by like_count from metrics and filter for engaged content
    let sortedItineraries = (itineraries || [])
      .map((itinerary: any) => {
        const metrics = Array.isArray(itinerary.itinerary_metrics)
          ? itinerary.itinerary_metrics[0]
          : itinerary.itinerary_metrics
        return {
          ...itinerary,
          like_count: metrics?.like_count || 0,
          view_count: metrics?.view_count || 0,
        }
      })
      .filter((itinerary: any) => itinerary.like_count >= 1)
      .sort((a: any, b: any) => b.like_count - a.like_count)

    // Select mid-tier performers (skip top 5, take next 5-10)
    let featuredItineraries = sortedItineraries

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
      const existingIds = featuredItineraries.map((i: any) => i.id)

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
          ),
          itinerary_metrics (
            like_count,
            view_count
          )
        `)
        .eq("is_public", true)
        .not("id", "in", `(${existingIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(5 - featuredItineraries.length)

      if (!recentError && recentItineraries) {
        const formattedRecent = recentItineraries.map((itinerary: any) => {
          const metrics = Array.isArray(itinerary.itinerary_metrics)
            ? itinerary.itinerary_metrics[0]
            : itinerary.itinerary_metrics
          return {
            ...itinerary,
            like_count: metrics?.like_count || 0,
            view_count: metrics?.view_count || 0,
          }
        })
        featuredItineraries = [...featuredItineraries, ...formattedRecent]
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
