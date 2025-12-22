import { createClient } from "@/lib/supabase/client"

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
