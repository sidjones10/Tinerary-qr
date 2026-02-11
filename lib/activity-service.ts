import { createClient } from "@/lib/supabase/client"
import { locationMatchesSearch, extractState } from "@/lib/location-utils"

export interface Activity {
  id: string
  title: string
  description?: string
  location?: string
  start_time: string
  day?: string
  require_rsvp: boolean
  order_index: number
}

export interface ItineraryWithActivities {
  id: string
  title: string
  location: string
  start_date: string
  end_date: string
  image_url?: string
  activities: Activity[]
}

/**
 * Get user's itineraries with their activities for copying
 */
export async function getUserItinerariesWithActivities(
  userId: string
): Promise<{ success: boolean; itineraries?: ItineraryWithActivities[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("itineraries")
      .select(
        `
        id,
        title,
        location,
        start_date,
        end_date,
        image_url,
        activities (
          id,
          title,
          description,
          location,
          start_time,
          day,
          require_rsvp,
          order_index
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching itineraries:", error)
      return { success: false, error: error.message }
    }

    return { success: true, itineraries: data as ItineraryWithActivities[] }
  } catch (error: any) {
    console.error("Error fetching itineraries:", error)
    return { success: false, error: error.message || "Failed to fetch itineraries" }
  }
}

/**
 * Get saved/liked itineraries with activities
 */
export async function getSavedItinerariesWithActivities(
  userId: string
): Promise<{ success: boolean; itineraries?: ItineraryWithActivities[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("saved_itineraries")
      .select(
        `
        itineraries:itinerary_id (
          id,
          title,
          location,
          start_date,
          end_date,
          image_url,
          activities (
            id,
            title,
            description,
            location,
            start_time,
            day,
            require_rsvp,
            order_index
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching saved itineraries:", error)
      return { success: false, error: error.message }
    }

    // Flatten the nested structure
    const itineraries = data
      .map((item: any) => item.itineraries)
      .filter((item: any) => item !== null) as ItineraryWithActivities[]

    return { success: true, itineraries }
  } catch (error: any) {
    console.error("Error fetching saved itineraries:", error)
    return { success: false, error: error.message || "Failed to fetch saved itineraries" }
  }
}

/**
 * Copy activities from one itinerary to another
 */
export async function copyActivitiesToItinerary(
  targetItineraryId: string,
  userId: string,
  activities: Activity[],
  targetStartDate?: string
): Promise<{ success: boolean; copiedActivities?: Activity[]; error?: string }> {
  try {
    const supabase = createClient()

    // Verify user owns the target itinerary
    const { data: itinerary, error: verifyError } = await supabase
      .from("itineraries")
      .select("user_id, start_date")
      .eq("id", targetItineraryId)
      .single()

    if (verifyError || !itinerary) {
      return { success: false, error: "Itinerary not found" }
    }

    if (itinerary.user_id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the current max order_index for the target itinerary
    const { data: existingActivities } = await supabase
      .from("activities")
      .select("order_index")
      .eq("itinerary_id", targetItineraryId)
      .order("order_index", { ascending: false })
      .limit(1)

    const maxOrderIndex = existingActivities?.[0]?.order_index ?? -1

    // Prepare activities for insertion
    const baseDate = targetStartDate ? new Date(targetStartDate) : new Date(itinerary.start_date)

    const activitiesToInsert = activities.map((activity, index) => {
      // Calculate new start_time based on target itinerary's start date
      let newStartTime = baseDate.toISOString()

      if (activity.start_time) {
        const originalTime = new Date(activity.start_time)
        const newTime = new Date(baseDate)
        newTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0)
        newStartTime = newTime.toISOString()
      }

      return {
        itinerary_id: targetItineraryId,
        user_id: userId,
        title: activity.title,
        description: activity.description || null,
        location: activity.location || null,
        start_time: newStartTime,
        day: activity.day || null,
        require_rsvp: activity.require_rsvp || false,
        order_index: maxOrderIndex + index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    const { data: insertedActivities, error: insertError } = await supabase
      .from("activities")
      .insert(activitiesToInsert)
      .select()

    if (insertError) {
      console.error("Error copying activities:", insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, copiedActivities: insertedActivities as Activity[] }
  } catch (error: any) {
    console.error("Error copying activities:", error)
    return { success: false, error: error.message || "Failed to copy activities" }
  }
}

/**
 * Copy a single activity to an itinerary
 */
export async function copySingleActivity(
  targetItineraryId: string,
  userId: string,
  activity: Activity,
  targetStartDate?: string
): Promise<{ success: boolean; copiedActivity?: Activity; error?: string }> {
  const result = await copyActivitiesToItinerary(targetItineraryId, userId, [activity], targetStartDate)

  if (result.success && result.copiedActivities) {
    return { success: true, copiedActivity: result.copiedActivities[0] }
  }

  return { success: false, error: result.error }
}

/**
 * Extended itinerary with user info for suggestions
 */
export interface SuggestedItinerary extends ItineraryWithActivities {
  user_name?: string
  user_username?: string
  user_avatar?: string
  like_count?: number
  relevance_score?: number
}

/**
 * Get suggested itineraries with activities based on location and event type
 * Shows what other users have done for similar locations/events
 */
export async function getSuggestedItinerariesWithActivities(
  currentLocation?: string,
  currentType?: "event" | "trip",
  currentUserId?: string,
  limit: number = 20
): Promise<{ success: boolean; itineraries?: SuggestedItinerary[]; error?: string }> {
  try {
    const supabase = createClient()

    // Fetch public itineraries with activities and user info
    let query = supabase
      .from("itineraries")
      .select(
        `
        id,
        title,
        location,
        start_date,
        end_date,
        image_url,
        user_id,
        activities (
          id,
          title,
          description,
          location,
          start_time,
          day,
          require_rsvp,
          order_index
        ),
        profiles:user_id (
          name,
          username,
          avatar_url
        ),
        itinerary_metrics (
          like_count
        )
      `
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(100) // Fetch more for filtering

    // Exclude current user's itineraries from suggestions
    if (currentUserId) {
      query = query.neq("user_id", currentUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching suggested itineraries:", error)
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      return { success: true, itineraries: [] }
    }

    // Process and score itineraries based on relevance
    let itineraries: SuggestedItinerary[] = data
      .filter((item: any) => item.activities && item.activities.length > 0)
      .map((item: any) => {
        let relevanceScore = 0

        // Score based on location match
        if (currentLocation && item.location) {
          if (locationMatchesSearch(currentLocation, item.location)) {
            relevanceScore += 50 // Strong location match
          } else {
            // Check for same state/region
            const currentState = extractState(currentLocation)
            const itemState = extractState(item.location)
            if (currentState && itemState && currentState.toLowerCase() === itemState.toLowerCase()) {
              relevanceScore += 25 // Same state
            }
          }
        }

        // Score based on event type (single day vs multi-day trip)
        if (currentType) {
          const startDate = new Date(item.start_date)
          const endDate = new Date(item.end_date)
          const isTrip = startDate.toDateString() !== endDate.toDateString()
          const itemType = isTrip ? "trip" : "event"

          if (currentType === itemType) {
            relevanceScore += 20 // Same type
          }
        }

        // Score based on popularity (likes)
        const likeCount = item.itinerary_metrics?.[0]?.like_count || 0
        relevanceScore += Math.min(likeCount, 30) // Cap at 30 points for popularity

        // Score based on activity count (more activities = more content to copy)
        relevanceScore += Math.min(item.activities.length * 2, 20) // Cap at 20 points

        return {
          id: item.id,
          title: item.title,
          location: item.location,
          start_date: item.start_date,
          end_date: item.end_date,
          image_url: item.image_url,
          activities: item.activities,
          user_name: item.profiles?.name,
          user_username: item.profiles?.username,
          user_avatar: item.profiles?.avatar_url,
          like_count: likeCount,
          relevance_score: relevanceScore,
        } as SuggestedItinerary
      })

    // Sort by relevance score, then by like count
    itineraries.sort((a, b) => {
      const scoreA = a.relevance_score || 0
      const scoreB = b.relevance_score || 0
      if (scoreB !== scoreA) return scoreB - scoreA
      return (b.like_count || 0) - (a.like_count || 0)
    })

    // Return top suggestions
    return { success: true, itineraries: itineraries.slice(0, limit) }
  } catch (error: any) {
    console.error("Error fetching suggested itineraries:", error)
    return { success: false, error: error.message || "Failed to fetch suggestions" }
  }
}
