import { createClient } from "@/lib/supabase/client"

export interface MutualConnection {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  shared_events_count: number
  next_shared_event?: {
    id: string
    title: string
    start_date: string
  }
}

/**
 * Get mutual connections for a user
 * A mutual is someone who shares one or more events with you (either as creator or attendee)
 */
export async function getMutualConnections(
  userId: string,
  limit = 20
): Promise<{ success: boolean; mutuals?: MutualConnection[]; error?: string }> {
  try {
    const supabase = createClient()

    // Try the RPC function first
    const { data: sharedUsers, error: sharedError } = await supabase
      .rpc('get_mutual_connections', {
        p_user_id: userId,
        p_limit: limit
      })

    if (sharedError) {
      // If the RPC doesn't exist, fall back to a simpler query
      return await getMutualsConnectionsFallback(userId, limit)
    }

    return { success: true, mutuals: sharedUsers || [] }
  } catch (error: any) {
    console.error("Error fetching mutual connections:", error)
    return { success: false, error: error.message || "Failed to fetch mutuals" }
  }
}

/**
 * Fallback method to get mutuals without using RPC
 */
async function getMutualsConnectionsFallback(
  userId: string,
  limit = 20
): Promise<{ success: boolean; mutuals?: MutualConnection[]; error?: string }> {
  try {
    const supabase = createClient()

    // Get events user created
    const { data: createdEvents } = await supabase
      .from("itineraries")
      .select("id")
      .eq("user_id", userId)

    // Get events user is invited to (accepted)
    const { data: invitedEvents } = await supabase
      .from("itinerary_invitations")
      .select("itinerary_id")
      .eq("invitee_id", userId)
      .eq("status", "accepted")

    const userEventIds = [
      ...(createdEvents?.map(e => e.id) || []),
      ...(invitedEvents?.map(e => e.itinerary_id) || [])
    ]

    if (userEventIds.length === 0) {
      return { success: true, mutuals: [] }
    }

    // Find event creators for these events (excluding the user)
    const { data: creators } = await supabase
      .from("itineraries")
      .select(`
        user_id,
        id,
        title,
        start_date,
        profiles:user_id(id, name, username, avatar_url)
      `)
      .in("id", userEventIds)
      .neq("user_id", userId)
      .order("start_date", { ascending: true })

    // Find other attendees for these events
    const { data: attendees } = await supabase
      .from("itinerary_invitations")
      .select(`
        invitee_id,
        itinerary:itineraries(id, title, start_date),
        profile:profiles!itinerary_invitations_invitee_id_fkey(id, name, username, avatar_url)
      `)
      .in("itinerary_id", userEventIds)
      .neq("invitee_id", userId)
      .eq("status", "accepted")

    // Combine and count shared events per user
    const mutualMap = new Map<string, {
      profile: any,
      events: Array<{ id: string, title: string, start_date: string }>
    }>()

    // Process creators
    if (creators) {
      for (const event of creators) {
        if (!event.profiles) continue

        const mutualId = event.profiles.id
        if (!mutualMap.has(mutualId)) {
          mutualMap.set(mutualId, {
            profile: event.profiles,
            events: []
          })
        }

        mutualMap.get(mutualId)!.events.push({
          id: event.id,
          title: event.title,
          start_date: event.start_date
        })
      }
    }

    // Process attendees
    if (attendees) {
      for (const attendance of attendees) {
        if (!attendance.profile || !attendance.itinerary) continue

        const mutualId = attendance.profile.id
        if (!mutualMap.has(mutualId)) {
          mutualMap.set(mutualId, {
            profile: attendance.profile,
            events: []
          })
        }

        mutualMap.get(mutualId)!.events.push({
          id: attendance.itinerary.id,
          title: attendance.itinerary.title,
          start_date: attendance.itinerary.start_date
        })
      }
    }

    // Convert to array and format
    const mutuals: MutualConnection[] = Array.from(mutualMap.values())
      .map(({ profile, events }) => {
        // Get unique events (user might be both creator and attendee)
        const uniqueEvents = Array.from(
          new Map(events.map(e => [e.id, e])).values()
        )

        // Sort by date and get the next upcoming event
        const sortedEvents = uniqueEvents.sort((a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        )

        const now = new Date()
        const upcomingEvent = sortedEvents.find(e => new Date(e.start_date) >= now)

        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          shared_events_count: uniqueEvents.length,
          next_shared_event: upcomingEvent ? {
            id: upcomingEvent.id,
            title: upcomingEvent.title,
            start_date: upcomingEvent.start_date
          } : undefined
        }
      })
      .sort((a, b) => b.shared_events_count - a.shared_events_count) // Sort by most shared events
      .slice(0, limit)

    return { success: true, mutuals }
  } catch (error: any) {
    console.error("Error in fallback mutuals query:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get mutual connections for a specific event
 * Shows people who are attending this event that you also share other events with
 */
export async function getEventMutuals(
  userId: string,
  eventId: string,
  limit = 8
): Promise<{ success: boolean; mutuals?: MutualConnection[]; error?: string }> {
  try {
    const supabase = createClient()

    // Get all attendees of this event
    const { data: eventCreator } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", eventId)
      .single()

    const { data: eventAttendees } = await supabase
      .from("itinerary_invitations")
      .select("invitee_id")
      .eq("itinerary_id", eventId)
      .eq("status", "accepted")

    const eventUserIds = [
      ...(eventCreator ? [eventCreator.user_id] : []),
      ...(eventAttendees?.map(a => a.invitee_id) || [])
    ].filter(id => id !== userId) // Exclude current user

    if (eventUserIds.length === 0) {
      return { success: true, mutuals: [] }
    }

    // Get all users you share events with
    const allMutuals = await getMutualConnections(userId, 100)

    if (!allMutuals.success || !allMutuals.mutuals) {
      return allMutuals
    }

    // Filter to only include people at this event
    const eventMutuals = allMutuals.mutuals
      .filter(mutual => eventUserIds.includes(mutual.id))
      .slice(0, limit)

    return { success: true, mutuals: eventMutuals }
  } catch (error: any) {
    console.error("Error fetching event mutuals:", error)
    return { success: false, error: error.message }
  }
}
