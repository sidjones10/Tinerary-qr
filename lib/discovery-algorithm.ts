import { createClient } from "@/lib/supabase/client"
import { notifyViewMilestone, checkViewMilestone } from "@/lib/notification-service"
import { generalizeLocation } from "@/lib/location-utils"
import { getFeaturedBoostMultiplier } from "@/lib/business-tier-service"
import type { BusinessTierSlug } from "@/lib/tiers"

// Types
export interface Itinerary {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  duration: number
  budget: string
  is_public: boolean
  share_precise_location: boolean
  image_url: string
  travel_style: string
  activities: string[]
  itinerary_categories?: any[]
  profiles?: any
}

export interface ItineraryWithScores extends Itinerary {
  relevanceScore: number
  popularityScore: number
  freshnessScore: number
  qualityScore: number
  proximityScore: number
  finalScore: number
}

export interface UserPreferences {
  id: string
  user_id: string
  preferred_destinations: string[]
  preferred_activities: string[]
  preferred_categories: string[]
  travel_style: string
  budget_preference: string
}

export interface UserBehavior {
  id: string
  user_id: string
  viewed_itineraries: string[]
  saved_itineraries: string[]
  liked_itineraries: string[]
  search_history: string[]
}

export interface ItineraryMetrics {
  id: string
  itinerary_id: string
  view_count: number
  save_count: number
  share_count: number
  like_count: number
  comment_count: number
  average_rating: number
  trending_score: number
}

export interface DiscoveryFilters {
  categories?: string[]
  location?: string
  dateRange?: { start?: string; end?: string }
  searchQuery?: string
  limit?: number
  offset?: number
}

// Helper function to get user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return null
  }
}

// Helper function to get user behavior
export async function getUserBehavior(userId: string): Promise<UserBehavior | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("user_behavior").select("*").eq("user_id", userId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching user behavior:", error)
    return null
  }
}

// Helper function to get itinerary metrics
export async function getItineraryMetrics(itineraryId: string): Promise<ItineraryMetrics | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("itinerary_metrics")
      .select("*")
      .eq("itinerary_id", itineraryId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching itinerary metrics:", error)
    return null
  }
}

// Helper function to update itinerary view count and check for milestones
export async function incrementItineraryViews(itineraryId: string): Promise<void> {
  try {
    const supabase = createClient()

    // Get current view count before incrementing
    const { data: metricsBefore } = await supabase
      .from("itinerary_metrics")
      .select("view_count")
      .eq("itinerary_id", itineraryId)
      .single()

    const previousViews = metricsBefore?.view_count || 0

    // Increment the view count
    await supabase.rpc("increment_view_count", { itinerary_id: itineraryId })

    const newViews = previousViews + 1

    // Check if we've crossed a view milestone (500, 1000, 5000)
    const milestone = checkViewMilestone(newViews, previousViews)
    if (milestone) {
      // Get itinerary details for the notification
      const { data: itinerary } = await supabase
        .from("itineraries")
        .select("user_id, title")
        .eq("id", itineraryId)
        .single()

      if (itinerary) {
        await notifyViewMilestone(
          itinerary.user_id,
          itineraryId,
          itinerary.title,
          milestone
        )
      }
    }
  } catch (error) {
    console.error("Error incrementing view count:", error)
  }
}

// Helper function to update user behavior when viewing an itinerary
export async function trackItineraryView(userId: string, itineraryId: string): Promise<void> {
  try {
    const supabase = createClient()

    // Get current viewed itineraries
    const { data } = await supabase.from("user_behavior").select("viewed_itineraries").eq("user_id", userId).single()

    if (!data) return

    // Add itinerary to viewed list if not already there
    let viewedItineraries = data.viewed_itineraries || []
    if (!viewedItineraries.includes(itineraryId)) {
      viewedItineraries = [itineraryId, ...viewedItineraries].slice(0, 100) // Keep last 100

      await supabase
        .from("user_behavior")
        .update({
          viewed_itineraries: viewedItineraries,
          last_active_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    }
  } catch (error) {
    console.error("Error tracking itinerary view:", error)
  }
}

// Calculate relevance score based on user preferences and itinerary attributes
function calculateRelevance(itinerary: any, userPreferences: UserPreferences | null): number {
  if (!userPreferences) return 0.5 // Default score if no preferences

  let score = 0.5 // Base score
  let factors = 0

  // Check for destination matches
  if (userPreferences.preferred_destinations.length > 0 && itinerary.location) {
    const destinationMatch = userPreferences.preferred_destinations.some((dest) =>
      itinerary.location.toLowerCase().includes(dest.toLowerCase()),
    )
    score += destinationMatch ? 0.2 : 0
    factors++
  }

  // Check for category matches
  if (userPreferences.preferred_categories.length > 0 && itinerary.categories) {
    const categoryMatches = itinerary.categories.filter((cat: string) =>
      userPreferences.preferred_categories.includes(cat),
    ).length

    if (itinerary.categories.length > 0) {
      score += (categoryMatches / itinerary.categories.length) * 0.2
      factors++
    }
  }

  // Check for travel style match
  if (userPreferences.travel_style && itinerary.travel_style) {
    score += itinerary.travel_style === userPreferences.travel_style ? 0.1 : 0
    factors++
  }

  // Normalize score
  return factors > 0 ? Math.min(score, 1) : 0.5
}

// Calculate popularity score based on metrics
function calculatePopularity(metrics: ItineraryMetrics | null): number {
  if (!metrics) return 0.3 // Default score if no metrics

  // Calculate weighted score based on various engagement metrics
  const viewWeight = 1
  const saveWeight = 5
  const likeWeight = 3
  const commentWeight = 4
  const shareWeight = 7

  const totalEngagement =
    metrics.view_count * viewWeight +
    metrics.save_count * saveWeight +
    metrics.like_count * likeWeight +
    metrics.comment_count * commentWeight +
    metrics.share_count * shareWeight

  // Normalize using a logarithmic scale to prevent very popular items from dominating
  const normalizedScore = Math.min(Math.log10(totalEngagement + 1) / 4, 1)

  return normalizedScore
}

// Calculate freshness score based on creation/update date
function calculateFreshness(itinerary: any): number {
  const now = new Date()
  const createdAt = new Date(itinerary.created_at)
  const updatedAt = new Date(itinerary.updated_at || itinerary.created_at)

  // Use the more recent of created_at and updated_at
  const mostRecentDate = updatedAt > createdAt ? updatedAt : createdAt

  // Calculate days since creation/update
  const daysSince = (now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)

  // Exponential decay function: score decreases as time passes
  // After 30 days, score will be approximately 0.5
  // After 90 days, score will be approximately 0.2
  return Math.exp(-daysSince / 30)
}

// Calculate quality score based on completeness and ratings
function calculateQuality(itinerary: any, metrics: ItineraryMetrics | null): number {
  let score = 0.5 // Base score

  // Check for completeness
  const hasTitle = !!itinerary.title
  const hasDescription = !!itinerary.description && itinerary.description.length > 10
  const hasLocation = !!itinerary.location
  const hasDates = !!itinerary.start_date && !!itinerary.end_date
  const hasActivities = itinerary.activities && itinerary.activities.length > 0
  const hasImage = !!itinerary.image_url

  const completenessScore =
    (hasTitle ? 0.1 : 0) +
    (hasDescription ? 0.2 : 0) +
    (hasLocation ? 0.1 : 0) +
    (hasDates ? 0.1 : 0) +
    (hasActivities ? 0.2 : 0) +
    (hasImage ? 0.1 : 0)

  // Factor in ratings if available
  let ratingScore = 0.5
  if (metrics && metrics.average_rating > 0) {
    ratingScore = metrics.average_rating / 5 // Assuming 5-star rating system
  }

  // Combine completeness and rating scores
  score = completenessScore * 0.6 + ratingScore * 0.4

  return Math.min(score, 1)
}

// Calculate proximity score based on user location and itinerary location
function calculateProximity(itinerary: any, userLocation: string | null): number {
  if (!userLocation || !itinerary.location) return 0.5 // Default score if locations not available

  // Simple string matching for now
  // In a real app, you'd use geocoding and distance calculation
  if (itinerary.location.toLowerCase().includes(userLocation.toLowerCase())) {
    return 1.0 // Exact match
  }

  // For now, return a default score
  // This could be enhanced with actual distance calculations
  return 0.5
}

// Add diversity to results to avoid too similar items
function addDiversity(itineraries: ItineraryWithScores[]): ItineraryWithScores[] {
  if (itineraries.length <= 5) return itineraries

  const diversifiedResults: ItineraryWithScores[] = []
  const categories = new Set<string>()
  const locations = new Set<string>()

  // First pass: add high-scoring items from different categories/locations
  for (const itinerary of itineraries) {
    const category = itinerary.categories?.[0] || ""
    const location = itinerary.location || ""

    if (
      diversifiedResults.length < 10 &&
      (!category || !categories.has(category)) &&
      (!location || !locations.has(location))
    ) {
      diversifiedResults.push(itinerary)
      if (category) categories.add(category)
      if (location) locations.add(location)
    }
  }

  // Second pass: fill remaining slots with highest scoring items
  const remainingItems = itineraries.filter((item) => !diversifiedResults.some((d) => d.id === item.id))

  diversifiedResults.push(...remainingItems.slice(0, 20 - diversifiedResults.length))

  return diversifiedResults
}

// Main discovery algorithm function
export async function discoverItineraries(
  userId: string | null,
  filters: DiscoveryFilters = {},
): Promise<ItineraryWithScores[]> {
  try {
    const supabase = createClient()

    // Get user data if available
    let userPreferences = null
    let userBehavior = null
    let userProfile = null

    if (userId) {
      ;[userPreferences, userBehavior, userProfile] = await Promise.all([
        getUserPreferences(userId),
        getUserBehavior(userId),
        supabase
          .from("profiles")
          .select("location")
          .eq("id", userId)
          .single()
          .then((res) => res.data),
      ])
    }

    // Build the base query
    let query = supabase
      .from("itineraries")
      .select(`
        *,
        profiles:user_id(name, avatar_url),
        itinerary_metrics(*),
        itinerary_categories(category)
      `)
      .eq("is_public", true)

    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      query = query.in("itinerary_categories.category", filters.categories)
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    if (filters.dateRange?.start) {
      query = query.gte("start_date", filters.dateRange.start)
    }

    if (filters.dateRange?.end) {
      query = query.lte("end_date", filters.dateRange.end)
    }

    if (filters.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,location.ilike.%${filters.searchQuery}%`,
      )
    }

    // Execute query
    const { data: itineraries, error } = await query

    if (error) throw error

    if (!itineraries || itineraries.length === 0) {
      return []
    }

    // Process and format the data
    const processedItineraries = itineraries.map((itinerary) => {
      // Extract categories from the nested data
      const categories = itinerary.itinerary_categories?.map((cat: any) => cat.category) || []

      // Format the itinerary with metrics
      const metrics = itinerary.itinerary_metrics

      // Mask location for public itineraries where precise location is disabled
      const displayLocation = (itinerary.is_public && itinerary.share_precise_location === false)
        ? generalizeLocation(itinerary.location)
        : itinerary.location

      return {
        ...itinerary,
        location: displayLocation,
        categories,
        creator: itinerary.profiles,
        metrics,
      }
    })

    // Fetch business subscription tiers for featured placement boost
    const userIds = [...new Set(processedItineraries.map((i) => i.user_id))]
    const businessTierMap = new Map<string, BusinessTierSlug>()
    if (userIds.length > 0) {
      const { data: businessSubs } = await supabase
        .from("businesses")
        .select("user_id, business_subscriptions(tier, status)")
        .in("user_id", userIds)

      if (businessSubs) {
        for (const biz of businessSubs) {
          const subs = (biz as any).business_subscriptions
          const activeSub = Array.isArray(subs)
            ? subs.find((s: any) => s.status === "active")
            : subs?.status === "active" ? subs : null
          if (activeSub) {
            businessTierMap.set(biz.user_id, activeSub.tier as BusinessTierSlug)
          }
        }
      }
    }

    // Calculate scores for each itinerary
    const scoredItineraries: ItineraryWithScores[] = processedItineraries.map((itinerary) => {
      const relevanceScore = calculateRelevance(itinerary, userPreferences)
      const popularityScore = calculatePopularity(itinerary.metrics)
      const freshnessScore = calculateFreshness(itinerary)
      const qualityScore = calculateQuality(itinerary, itinerary.metrics)
      const proximityScore = calculateProximity(itinerary, userProfile?.location || null)

      // Calculate final score (weighted sum)
      let finalScore =
        relevanceScore * 0.4 +
        popularityScore * 0.25 +
        freshnessScore * 0.15 +
        qualityScore * 0.15 +
        proximityScore * 0.05

      // Apply featured placement boost for premium/enterprise business accounts
      const ownerTier = businessTierMap.get(itinerary.user_id)
      if (ownerTier) {
        finalScore *= getFeaturedBoostMultiplier(ownerTier)
      }

      return {
        ...itinerary,
        relevanceScore,
        popularityScore,
        freshnessScore,
        qualityScore,
        proximityScore,
        finalScore,
      }
    })

    // Sort by final score
    scoredItineraries.sort((a, b) => b.finalScore - a.finalScore)

    // Add diversity to results
    const diversifiedResults = addDiversity(scoredItineraries)

    // Apply pagination
    const limit = filters.limit || 20
    const offset = filters.offset || 0
    const paginatedResults = diversifiedResults.slice(offset, offset + limit)

    return paginatedResults
  } catch (error) {
    console.error("Error in discovery algorithm:", error)
    return []
  }
}

// Function to track user interactions for improving recommendations
export async function trackUserInteraction(
  userId: string,
  itineraryId: string,
  interactionType: "view" | "save" | "like" | "share" | "comment",
): Promise<void> {
  try {
    const supabase = createClient()

    // Update itinerary metrics
    let rpcMethod = ""
    switch (interactionType) {
      case "view":
        rpcMethod = "increment_view_count"
        break
      case "save":
        rpcMethod = "increment_save_count"
        break
      case "like":
        rpcMethod = "increment_like_count"
        break
      case "share":
        rpcMethod = "increment_share_count"
        break
      case "comment":
        rpcMethod = "increment_comment_count"
        break
    }

    if (rpcMethod) {
      await supabase.rpc(rpcMethod, { itinerary_id: itineraryId })
    }

    // Update user behavior
    if (userId) {
      const { data } = await supabase.from("user_behavior").select("*").eq("user_id", userId).single()

      if (!data) return

      const updates: any = { last_active_at: new Date().toISOString() }

      if (interactionType === "view") {
        let viewedItineraries = data.viewed_itineraries || []
        if (!viewedItineraries.includes(itineraryId)) {
          viewedItineraries = [itineraryId, ...viewedItineraries].slice(0, 100)
          updates.viewed_itineraries = viewedItineraries
        }
      } else if (interactionType === "save") {
        let savedItineraries = data.saved_itineraries || []
        if (!savedItineraries.includes(itineraryId)) {
          savedItineraries = [itineraryId, ...savedItineraries]
          updates.saved_itineraries = savedItineraries
        }
      } else if (interactionType === "like") {
        let likedItineraries = data.liked_itineraries || []
        if (!likedItineraries.includes(itineraryId)) {
          likedItineraries = [itineraryId, ...likedItineraries]
          updates.liked_itineraries = likedItineraries
        }
      }

      await supabase.from("user_behavior").update(updates).eq("user_id", userId)
    }
  } catch (error) {
    console.error(`Error tracking ${interactionType}:`, error)
  }
}

// Function to update user preferences
export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const supabase = createClient()

    await supabase
      .from("user_preferences")
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
  } catch (error) {
    console.error("Error updating user preferences:", error)
  }
}

// Function to calculate trending score (Wilson score confidence interval for ratings)
export async function updateTrendingScores(): Promise<void> {
  try {
    const supabase = createClient()

    // Get all itineraries with metrics
    const { data: itineraries, error } = await supabase.from("itinerary_metrics").select("*")

    if (error) throw error

    for (const itinerary of itineraries || []) {
      // Calculate trending score using Wilson score confidence interval
      // This gives a confidence interval for the true fraction of positive ratings
      const n = itinerary.view_count || 0
      const p = (itinerary.like_count || 0) / (n || 1)
      const z = 1.96 // 95% confidence
      const z2 = z * z

      let score = 0
      if (n > 0) {
        score = (p + z2 / (2 * n) - z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / (1 + z2 / n)
      }

      // Factor in recency (last 7 days gets higher weight)
      const now = new Date()
      const updatedAt = new Date(itinerary.updated_at)
      const daysSince = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      const recencyFactor = Math.exp(-daysSince / 7)

      // Combine base score with recency
      const trendingScore = score * 0.7 + recencyFactor * 0.3

      // Update the trending score
      await supabase.from("itinerary_metrics").update({ trending_score: trendingScore }).eq("id", itinerary.id)
    }
  } catch (error) {
    console.error("Error updating trending scores:", error)
  }
}
