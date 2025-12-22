import type { User, Itinerary, Deal, Promotion } from "./api-types"

// Recommendation source types
export type RecommendationSource =
  | "liked"
  | "searched"
  | "viewed"
  | "friend"
  | "followed"
  | "trending"
  | "location"
  | "seasonal"

// Recommendation item types
export type RecommendationItem = {
  id: string
  type: "itinerary" | "deal" | "promotion" | "destination" | "user"
  item: Itinerary | Deal | Promotion | Destination | User
  score: number
  reasons: RecommendationReason[]
  category?: string
}

// Reason for recommendation
export type RecommendationReason = {
  source: RecommendationSource
  weight: number
  description: string
  relatedItems?: string[] // IDs of related items (e.g., friends who liked this)
}

// Destination type (simplified)
export type Destination = {
  id: string
  name: string
  country: string
  description?: string
  image?: string
  popularity: number
  tags: string[]
}

// Discovery feed response
export type DiscoveryFeedResponse = {
  personalRecommendations: RecommendationItem[]
  trending: RecommendationItem[]
  forYou: RecommendationItem[]
  nearby: RecommendationItem[]
  seasonal: RecommendationItem[]
  friendsLiked: RecommendationItem[]
  similar: {
    category: string
    items: RecommendationItem[]
  }[]
}

// Discovery feed request
export type DiscoveryFeedRequest = {
  userId: string
  location?: {
    latitude: number
    longitude: number
  }
  filters?: {
    types?: ("itinerary" | "deal" | "promotion" | "destination" | "user")[]
    categories?: string[]
    priceRange?: [number, number]
    dateRange?: [string, string]
  }
  page?: number
  pageSize?: number
}
