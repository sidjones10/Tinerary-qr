import { createClient } from "@/lib/supabase/client"
import Fuse from "fuse.js"

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
  user_id?: string
  score?: number // Fuzzy search score
}

export interface SearchResults {
  itineraries: SearchResult[]
  users: SearchResult[]
  totalCount: number
}

// Fuse.js options for TikTok-like fuzzy search
const itineraryFuseOptions: Fuse.IFuseOptions<SearchResult> = {
  includeScore: true,
  threshold: 0.4, // Allow fuzzy matches
  ignoreLocation: true,
  findAllMatches: true,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "location", weight: 0.25 },
    { name: "username", weight: 0.1 },
    { name: "name", weight: 0.05 },
  ],
}

const userFuseOptions: Fuse.IFuseOptions<SearchResult> = {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  findAllMatches: true,
  minMatchCharLength: 2,
  keys: [
    { name: "username", weight: 0.4 },
    { name: "name", weight: 0.4 },
    { name: "bio", weight: 0.2 },
  ],
}

/**
 * Search for itineraries and users with fuzzy matching (TikTok-like search)
 * @param query - Search query string
 * @param filters - Optional filters (type, location, date range)
 * @param limit - Maximum number of results per type
 * @returns Search results grouped by type, ranked by relevance
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

  const searchTerm = query.trim().toLowerCase()
  // Also create SQL pattern for initial fetch
  const sqlPattern = `%${searchTerm}%`

  try {
    // Search itineraries if type is "itinerary" or "all"
    if (!filters?.type || filters.type === "itinerary" || filters.type === "all") {
      // Fetch more results initially to allow fuzzy filtering
      let itineraryQuery = supabase
        .from("itineraries")
        .select(
          `
          id,
          user_id,
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
        .limit(100) // Fetch more for fuzzy filtering
        .order("created_at", { ascending: false })

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
      } else if (itineraries && itineraries.length > 0) {
        // Transform data for Fuse.js
        const transformedItineraries: SearchResult[] = itineraries.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          type: "itinerary" as const,
          title: item.title || "",
          description: item.description || "",
          image_url: item.image_url,
          location: item.location || "",
          start_date: item.start_date,
          end_date: item.end_date,
          created_at: item.created_at,
          username: item.profiles?.username || "",
          name: item.profiles?.name || "",
          avatar_url: item.profiles?.avatar_url,
        }))

        // Apply fuzzy search with Fuse.js
        const fuse = new Fuse(transformedItineraries, itineraryFuseOptions)
        const fuzzyResults = fuse.search(searchTerm)

        // Map results with scores
        let filteredResults = fuzzyResults.map((result) => ({
          ...result.item,
          score: result.score,
        }))

        // Apply location filter if provided (post-filtering)
        if (filters?.location) {
          const locationLower = filters.location.toLowerCase()
          filteredResults = filteredResults.filter(
            (item) => item.location?.toLowerCase().includes(locationLower)
          )
        }

        results.itineraries = filteredResults.slice(0, limit)
      }
    }

    // Search users if type is "user" or "all"
    if (!filters?.type || filters.type === "user" || filters.type === "all") {
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, username, name, bio, avatar_url, created_at")
        .limit(100) // Fetch more for fuzzy filtering
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error searching users:", usersError)
      } else if (users && users.length > 0) {
        // Transform data for Fuse.js
        const transformedUsers: SearchResult[] = users.map((user: any) => ({
          id: user.id,
          type: "user" as const,
          username: user.username || "",
          name: user.name || "",
          bio: user.bio || "",
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          title: user.name || user.username || "Unknown User",
          description: user.bio || "",
        }))

        // Apply fuzzy search with Fuse.js
        const fuse = new Fuse(transformedUsers, userFuseOptions)
        const fuzzyResults = fuse.search(searchTerm)

        // Map results with scores
        results.users = fuzzyResults.map((result) => ({
          ...result.item,
          score: result.score,
        })).slice(0, limit)
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
 * Get autocomplete suggestions for search with fuzzy matching
 * @param query - Partial search query
 * @param limit - Maximum number of suggestions
 * @returns List of suggestions ranked by relevance
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query.trim() || query.length < 2) {
    return []
  }

  const supabase = createClient()

  try {
    // Get title and location suggestions from itineraries
    const { data: itineraries } = await supabase
      .from("itineraries")
      .select("title, location")
      .eq("is_public", true)
      .limit(50)

    if (!itineraries || itineraries.length === 0) {
      return []
    }

    // Create a list of unique searchable terms
    const terms = new Set<string>()
    itineraries.forEach((item: any) => {
      if (item.title) terms.add(item.title)
      if (item.location) terms.add(item.location)
    })

    const termsList = Array.from(terms).map(term => ({ term }))

    // Use Fuse.js for fuzzy matching suggestions
    const fuse = new Fuse(termsList, {
      keys: ["term"],
      threshold: 0.4,
      includeScore: true,
    })

    const results = fuse.search(query.trim())

    return results
      .slice(0, limit)
      .map(result => result.item.term)
  } catch (error) {
    console.error("Error getting search suggestions:", error)
    return []
  }
}
