import { createClient } from "@/lib/supabase/client"

export interface FeedItem {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  image_url: string | null
  is_public: boolean
  user_id: string
  created_at: string
  updated_at: string
  owner?: {
    name: string
    avatar_url: string | null
    username: string
  }
  metrics?: {
    like_count: number
    comment_count: number
    save_count: number
    view_count: number
  }
  is_invited?: boolean
  invitation_status?: string
  status?: "upcoming" | "ongoing" | "past"
}

export interface FeedFilters {
  status?: "upcoming" | "past" | "all"
  category?: string
  search?: string
  limit?: number
  offset?: number
}

/**
 * Get user's feed with created and invited trips
 */
export async function getUserFeed(userId: string, filters: FeedFilters = {}) {
  try {
    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]

    // Fetch user's own itineraries
    let ownQuery = supabase
      .from("itineraries")
      .select(`
        *,
        owner:profiles!itineraries_user_id_fkey(name, avatar_url, username),
        metrics:itinerary_metrics(like_count, comment_count, save_count, view_count)
      `)
      .eq("user_id", userId)

    // Fetch itineraries user is invited to (accepted invitations)
    let invitedQuery = supabase
      .from("itinerary_invitations")
      .select(`
        invitation_status:status,
        itinerary:itineraries(
          *,
          owner:profiles!itineraries_user_id_fkey(name, avatar_url, username),
          metrics:itinerary_metrics(like_count, comment_count, save_count, view_count)
        )
      `)
      .eq("invitee_id", userId)
      .eq("status", "accepted")

    // Apply search filter
    if (filters.search) {
      ownQuery = ownQuery.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
    }

    // Execute queries
    const [ownResult, invitedResult] = await Promise.all([ownQuery, invitedQuery])

    if (ownResult.error) {
      console.error("Error fetching own itineraries:", {
        message: ownResult.error.message,
        details: ownResult.error.details,
        hint: ownResult.error.hint,
        code: ownResult.error.code,
      })
    }

    if (invitedResult.error) {
      console.error("Error fetching invited itineraries:", {
        message: invitedResult.error.message,
        details: invitedResult.error.details,
        hint: invitedResult.error.hint,
        code: invitedResult.error.code,
      })
    }

    // Combine and format results
    const ownItineraries: FeedItem[] = (ownResult.data || []).map((item: any) => ({
      ...item,
      owner: item.owner,
      is_invited: false,
    }))

    const invitedItineraries: FeedItem[] = (invitedResult.data || [])
      .filter((item: any) => item.itinerary)
      .map((item: any) => ({
        ...item.itinerary,
        owner: item.itinerary.owner,
        is_invited: true,
        invitation_status: item.invitation_status,
      }))

    let allItems = [...ownItineraries, ...invitedItineraries]

    // Categorize by date status
    allItems = allItems.map((item) => {
      const startDate = new Date(item.start_date)
      const endDate = new Date(item.end_date)
      const todayDate = new Date(today)

      let status: "upcoming" | "ongoing" | "past"
      if (endDate < todayDate) {
        status = "past"
      } else if (startDate <= todayDate && endDate >= todayDate) {
        status = "ongoing"
      } else {
        status = "upcoming"
      }

      return { ...item, status }
    })

    // Apply status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "upcoming") {
        allItems = allItems.filter((item) => item.status === "upcoming" || item.status === "ongoing")
      } else if (filters.status === "past") {
        allItems = allItems.filter((item) => item.status === "past")
      }
    }

    // Sort by start date (upcoming first, then past)
    allItems.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime()
      const dateB = new Date(b.start_date).getTime()

      if (a.status === "past" && b.status !== "past") return 1
      if (a.status !== "past" && b.status === "past") return -1

      return dateB - dateA // Most recent first
    })

    // Apply pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    const paginatedItems = allItems.slice(offset, offset + limit)

    return {
      success: true,
      items: paginatedItems,
      total: allItems.length,
      upcoming: allItems.filter((i) => i.status === "upcoming" || i.status === "ongoing").length,
      past: allItems.filter((i) => i.status === "past").length,
    }
  } catch (error: any) {
    console.error("Error fetching user feed:", error)
    return {
      success: false,
      items: [],
      total: 0,
      upcoming: 0,
      past: 0,
      error: error.message || "Failed to fetch feed",
    }
  }
}

/**
 * Get trending itineraries for discovery using the real discovery algorithm
 */
export async function getTrendingItineraries(userId: string | null, limit = 10) {
  try {
    // Use the discovery algorithm instead of simple query
    const { discoverItineraries } = await import("@/lib/discovery-algorithm")

    const items = await discoverItineraries(userId, { limit })

    // Format the data to match the expected structure
    const formattedItems = items.map((item) => ({
      ...item,
      owner: item.profiles || item.creator,
      metrics: item.itinerary_metrics,
    }))

    return { success: true, items: formattedItems }
  } catch (error: any) {
    console.error("Error in getTrendingItineraries:", error)
    return { success: false, items: [], error: error.message }
  }
}

/**
 * Get personalized recommendations based on user preferences and interactions
 */
export async function getPersonalizedRecommendations(userId: string, limit = 10) {
  try {
    const supabase = createClient()

    // Get user's preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Get user's recent interactions to find similar itineraries
    const { data: interactions } = await supabase
      .from("user_interactions")
      .select("itinerary_id")
      .eq("user_id", userId)
      .in("interaction_type", ["view", "save", "like"])
      .order("created_at", { ascending: false })
      .limit(5)

    const viewedIds = interactions?.map((i) => i.itinerary_id) || []

    // Build query for recommendations
    let query = supabase
      .from("itineraries")
      .select(`
        *,
        owner:profiles!itineraries_user_id_fkey(name, avatar_url, username),
        metrics:itinerary_metrics(view_count, save_count, trending_score),
        categories:itinerary_categories(category)
      `)
      .eq("is_public", true)
      .neq("user_id", userId) // Exclude own itineraries

    // Exclude already viewed
    if (viewedIds.length > 0) {
      query = query.not("id", "in", `(${viewedIds.join(",")})`)
    }

    // Apply category filter if user has preferences
    if (preferences?.preferred_categories && preferences.preferred_categories.length > 0) {
      // This would need a more complex query with joins
      // For now, we'll fetch all and filter in memory
    }

    const { data, error } = await query.limit(limit * 2) // Fetch more for filtering

    if (error) {
      console.error("Error fetching recommendations:", error)
      return { success: false, items: [], error: error.message }
    }

    let items = data || []

    // Filter by preferred categories if available
    if (preferences?.preferred_categories && preferences.preferred_categories.length > 0) {
      items = items.filter((item: any) => {
        const itemCategories = item.categories?.map((c: any) => c.category) || []
        return itemCategories.some((cat: string) => preferences.preferred_categories.includes(cat))
      })
    }

    // Sort by trending score
    items.sort((a: any, b: any) => {
      const scoreA = a.metrics?.trending_score || 0
      const scoreB = b.metrics?.trending_score || 0
      return scoreB - scoreA
    })

    return { success: true, items: items.slice(0, limit) }
  } catch (error: any) {
    console.error("Error in getPersonalizedRecommendations:", error)
    return { success: false, items: [], error: error.message }
  }
}

/**
 * Record user interaction for recommendation algorithm
 */
export async function recordInteraction(
  userId: string,
  itineraryId: string,
  interactionType: "view" | "save" | "like" | "share" | "comment",
) {
  try {
    // Don't record interactions if user_interactions table doesn't exist
    if (!userId || !itineraryId) {
      return { success: false, error: "Missing userId or itineraryId" }
    }

    // Use the discovery algorithm's tracking function which handles both
    // user_interactions and user_behavior tables, plus metrics updates
    const { trackUserInteraction } = await import("@/lib/discovery-algorithm")
    await trackUserInteraction(userId, itineraryId, interactionType)

    return { success: true }
  } catch (error: any) {
    console.warn("Error in recordInteraction (non-critical):", error)
    return { success: false, error: error.message }
  }
}
