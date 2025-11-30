import { createClient } from "@/lib/supabase/client"

export interface SearchResult {
  id: string
  type: "itinerary" | "user"
  title: string
  description?: string
  image_url?: string
  location?: string
  start_date?: string
  end_date?: string
  username?: string
  name?: string
  avatar_url?: string
  bio?: string
  created_at?: string
}

export interface SearchResults {
  itineraries: SearchResult[]
  users: SearchResult[]
  totalCount: number
}

/**
 * Search for itineraries and users
 * @param query - Search query string
 * @param filters - Optional filters (type, location, date range)
 * @param limit - Maximum number of results per type
 * @returns Search results grouped by type
 */
export async function searchContent(
  query: string,
  filters?: {
    type?: "itinerary" | "user" | "all"
    location?: string
    startDate?: string
    endDate?: string
  },
  limit: number = 20,
): Promise<SearchResults> {
  const supabase = createClient()
  const results: SearchResults = {
    itineraries: [],
    users: [],
    totalCount: 0,
  }

  if (!query.trim()) {
    return results
  }

  const searchTerm = `%${query.trim().toLowerCase()}%`

  try {
    // Search itineraries if type is "itinerary" or "all"
    if (!filters?.type || filters.type === "itinerary" || filters.type === "all") {
      let itineraryQuery = supabase
        .from("itineraries")
        .select(
          `
          id,
          title,
          description,
          image_url,
          location,
          start_date,
          end_date,
          created_at,
          profiles:user_id (
            username,
            name,
            avatar_url
          )
        `,
        )
        .eq("is_public", true)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(limit)
        .order("created_at", { ascending: false })

      // Apply location filter if provided
      if (filters?.location) {
        itineraryQuery = itineraryQuery.ilike("location", `%${filters.location}%`)
      }

      // Apply date range filters if provided
      if (filters?.startDate) {
        itineraryQuery = itineraryQuery.gte("start_date", filters.startDate)
      }
      if (filters?.endDate) {
        itineraryQuery = itineraryQuery.lte("end_date", filters.endDate)
      }

      const { data: itineraries, error: itinerariesError } = await itineraryQuery

      if (itinerariesError) {
        console.error("Error searching itineraries:", itinerariesError)
      } else if (itineraries) {
        results.itineraries = itineraries.map((item: any) => ({
          id: item.id,
          type: "itinerary" as const,
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          location: item.location,
          start_date: item.start_date,
          end_date: item.end_date,
          created_at: item.created_at,
          username: item.profiles?.username,
          name: item.profiles?.name,
          avatar_url: item.profiles?.avatar_url,
        }))
      }
    }

    // Search users if type is "user" or "all"
    if (!filters?.type || filters.type === "user" || filters.type === "all") {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, username, name, bio, avatar_url, created_at")
        .or(`username.ilike.${searchTerm},name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .limit(limit)
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error searching users:", usersError)
      } else if (users) {
        results.users = users.map((user: any) => ({
          id: user.id,
          type: "user" as const,
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          title: user.name || user.username || "Unknown User",
          description: user.bio,
        }))
      }
    }

    results.totalCount = results.itineraries.length + results.users.length
  } catch (error) {
    console.error("Error in searchContent:", error)
  }

  return results
}

/**
 * Get popular search queries
 * @param limit - Maximum number of queries to return
 * @returns List of popular search terms
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  // For now, return static popular searches
  // In the future, this could be based on actual search analytics
  return [
    "Weekend getaway",
    "Beach vacation",
    "City tour",
    "Food tour",
    "Adventure travel",
    "Cultural experiences",
    "Photography spots",
    "Budget travel",
  ].slice(0, limit)
}

/**
 * Save a search query to user's history
 * @param userId - User ID
 * @param query - Search query
 */
export async function saveSearchHistory(userId: string, query: string): Promise<void> {
  if (!query.trim()) return

  const supabase = createClient()

  try {
    // For now, we'll store in user_interactions table
    await supabase.from("user_interactions").insert({
      user_id: userId,
      interaction_type: "search",
      // We'll store the search query in a metadata field (would need to add this column)
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error saving search history:", error)
  }
}

/**
 * Get autocomplete suggestions for search
 * @param query - Partial search query
 * @param limit - Maximum number of suggestions
 * @returns List of suggestions
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query.trim()) {
    return []
  }

  const supabase = createClient()
  const searchTerm = `${query.trim().toLowerCase()}%` // Prefix match

  try {
    // Get title and location suggestions from itineraries
    const { data: itineraries } = await supabase
      .from("itineraries")
      .select("title, location")
      .eq("is_public", true)
      .or(`title.ilike.${searchTerm},location.ilike.${searchTerm}`)
      .limit(limit)

    const suggestions = new Set<string>()

    itineraries?.forEach((item: any) => {
      if (item.title?.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(item.title)
      }
      if (item.location?.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(item.location)
      }
    })

    return Array.from(suggestions).slice(0, limit)
  } catch (error) {
    console.error("Error getting search suggestions:", error)
    return []
  }
}
