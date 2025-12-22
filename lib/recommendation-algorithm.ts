import type { RecommendationItem, RecommendationReason, DiscoveryFeedResponse } from "./recommendation-types"
import type { User, Itinerary, Deal, Promotion } from "./api-types"

// Weight configuration for different recommendation sources
const WEIGHTS = {
  liked: 10,
  searched: 8,
  viewed: 5,
  friend: 7,
  followed: 6,
  trending: 4,
  location: 6,
  seasonal: 3,
}

// Decay factor for time (more recent = higher score)
const TIME_DECAY_FACTOR = 0.8

// Calculate recommendation score based on multiple factors
export function calculateScore(
  reasons: RecommendationReason[],
  recency: number, // 0-1 value, 1 being most recent
  popularity: number, // 0-1 value, 1 being most popular
): number {
  // Base score from reasons
  const baseScore = reasons.reduce((score, reason) => {
    return score + reason.weight * WEIGHTS[reason.source]
  }, 0)

  // Apply recency boost
  const recencyBoost = recency * TIME_DECAY_FACTOR * 10

  // Apply popularity boost
  const popularityBoost = popularity * 5

  return baseScore + recencyBoost + popularityBoost
}

// Generate recommendation reasons based on user data and item
export function generateReasons(
  userId: string,
  itemId: string,
  itemType: string,
  userLikes: string[],
  userSearches: string[],
  userViews: string[],
  friendLikes: Record<string, string[]>, // userId -> itemIds
  followedUsers: string[],
  trendingItems: string[],
  userLocation?: { latitude: number; longitude: number },
  itemLocation?: { latitude: number; longitude: number },
): RecommendationReason[] {
  const reasons: RecommendationReason[] = []

  // Check if user liked similar items
  if (userLikes.some((id) => id === itemId)) {
    reasons.push({
      source: "liked",
      weight: 1.0,
      description: "Based on items you've liked",
    })
  }

  // Check if user searched for related terms
  if (userSearches.some((id) => id === itemId)) {
    reasons.push({
      source: "searched",
      weight: 0.8,
      description: "Based on your recent searches",
    })
  }

  // Check if user viewed this item
  if (userViews.some((id) => id === itemId)) {
    reasons.push({
      source: "viewed",
      weight: 0.5,
      description: "Because you viewed this recently",
    })
  }

  // Check if friends liked this item
  const friendsWhoLiked = Object.entries(friendLikes)
    .filter(([friendId, likes]) => likes.includes(itemId))
    .map(([friendId]) => friendId)

  if (friendsWhoLiked.length > 0) {
    reasons.push({
      source: "friend",
      weight: 0.7,
      description: `${friendsWhoLiked.length} friend${friendsWhoLiked.length > 1 ? "s" : ""} liked this`,
      relatedItems: friendsWhoLiked,
    })
  }

  // Check if followed users are related to this item
  if (followedUsers.includes(itemId)) {
    reasons.push({
      source: "followed",
      weight: 0.6,
      description: "From someone you follow",
    })
  }

  // Check if item is trending
  if (trendingItems.includes(itemId)) {
    reasons.push({
      source: "trending",
      weight: 0.4,
      description: "Trending right now",
    })
  }

  // Check if item is near user's location
  if (userLocation && itemLocation) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      itemLocation.latitude,
      itemLocation.longitude,
    )

    if (distance < 50) {
      // Within 50km
      reasons.push({
        source: "location",
        weight: 0.6,
        description: `${Math.round(distance)}km from you`,
      })
    }
  }

  // If no reasons found, add a generic one
  if (reasons.length === 0) {
    reasons.push({
      source: "trending",
      weight: 0.3,
      description: "Popular with users like you",
    })
  }

  return reasons
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Generate personalized discovery feed
export function generateDiscoveryFeed(
  userId: string,
  userPreferences: {
    likes: string[]
    searches: string[]
    views: string[]
    categories: string[]
    location?: { latitude: number; longitude: number }
  },
  socialData: {
    friends: Record<string, string[]> // friendId -> likes
    following: string[]
  },
  availableItems: {
    itineraries: Itinerary[]
    deals: Deal[]
    promotions: Promotion[]
    destinations: any[]
    users: User[]
  },
  trendingItems: string[],
  filters?: any,
): DiscoveryFeedResponse {
  // All items to be scored
  const allItems: RecommendationItem[] = [
    ...availableItems.itineraries.map((item) => ({
      id: item.id,
      type: "itinerary" as const,
      item,
      score: 0,
      reasons: [],
      category: item.type,
    })),
    ...availableItems.deals.map((item) => ({
      id: item.id,
      type: "deal" as const,
      item,
      score: 0,
      reasons: [],
      category: item.type,
    })),
    ...availableItems.promotions.map((item) => ({
      id: item.id,
      type: "promotion" as const,
      item,
      score: 0,
      reasons: [],
      category: item.type,
    })),
    ...availableItems.destinations.map((item) => ({
      id: item.id,
      type: "destination" as const,
      item,
      score: 0,
      reasons: [],
      category: "destination",
    })),
    ...availableItems.users.map((item) => ({
      id: item.id,
      type: "user" as const,
      item,
      score: 0,
      reasons: [],
      category: "user",
    })),
  ]

  // Apply filters if provided
  let filteredItems = allItems
  if (filters) {
    if (filters.types && filters.types.length > 0) {
      filteredItems = filteredItems.filter((item) => filters.types.includes(item.type))
    }

    if (filters.categories && filters.categories.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        if (item.category) {
          return filters.categories.includes(item.category)
        }
        return false
      })
    }

    if (filters.priceRange) {
      filteredItems = filteredItems.filter((item) => {
        if (item.type === "deal" && "price" in item.item) {
          return item.item.price >= filters.priceRange[0] && item.item.price <= filters.priceRange[1]
        }
        return true
      })
    }

    if (filters.dateRange) {
      filteredItems = filteredItems.filter((item) => {
        if ((item.type === "itinerary" || item.type === "promotion") && "startDate" in item.item) {
          const startDate = new Date(item.item.startDate)
          const filterStartDate = new Date(filters.dateRange[0])
          const filterEndDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : new Date(2099, 11, 31)

          return startDate >= filterStartDate && startDate <= filterEndDate
        }
        return true
      })
    }
  }

  // Generate reasons and calculate scores for each item
  const scoredItems = filteredItems.map((item) => {
    // Generate reasons
    const reasons = generateReasons(
      userId,
      item.id,
      item.type,
      userPreferences.likes,
      userPreferences.searches,
      userPreferences.views,
      socialData.friends,
      socialData.following,
      trendingItems,
      userPreferences.location,
      item.type === "itinerary" || item.type === "destination" || item.type === "promotion"
        ? { latitude: 0, longitude: 0 } // In a real implementation, you'd get coordinates from the item
        : undefined,
    )

    // Calculate recency (0-1)
    const recency =
      item.type === "itinerary" || item.type === "deal" || item.type === "promotion"
        ? 0.8 // In a real implementation, you'd calculate based on creation date
        : 0.5

    // Calculate popularity (0-1)
    const popularity =
      item.type === "itinerary" && "likes" in item.item
        ? Math.min(item.item.likes / 1000, 1)
        : item.type === "deal" && "discount" in item.item
          ? item.item.discount / 100
          : 0.5

    // Calculate score
    const score = calculateScore(reasons, recency, popularity)

    return {
      ...item,
      reasons,
      score,
    }
  })

  // Sort by score
  const sortedItems = [...scoredItems].sort((a, b) => b.score - a.score)

  // Create sections
  const personalRecommendations = sortedItems.slice(0, 5)

  const trending = sortedItems.filter((item) => item.reasons.some((r) => r.source === "trending")).slice(0, 10)

  const forYou = sortedItems
    .filter((item) =>
      item.reasons.some((r) => r.source === "liked" || r.source === "searched" || r.source === "viewed"),
    )
    .slice(0, 10)

  const nearby = sortedItems.filter((item) => item.reasons.some((r) => r.source === "location")).slice(0, 10)

  const friendsLiked = sortedItems.filter((item) => item.reasons.some((r) => r.source === "friend")).slice(0, 10)

  const seasonal = sortedItems.filter((item) => item.reasons.some((r) => r.source === "seasonal")).slice(0, 10)

  // Group by categories for "similar to what you like" sections
  const categoryCounts: Record<string, number> = {}
  userPreferences.categories.forEach((category) => {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 3)

  const similar = topCategories.map((category) => ({
    category,
    items: sortedItems.filter((item) => item.category === category).slice(0, 6),
  }))

  return {
    personalRecommendations,
    trending,
    forYou,
    nearby,
    seasonal,
    friendsLiked,
    similar,
  }
}
