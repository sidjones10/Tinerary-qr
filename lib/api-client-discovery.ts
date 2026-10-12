import type { ApiResponse } from "./api-types"
import type { DiscoveryFeedResponse, DiscoveryFeedRequest } from "./recommendation-types"
import { getAuthHeaders, handleResponse } from "./api-client"

// Define RecommendationItem type
interface RecommendationItem {
  id: string
  type: string
  // Add other properties as needed
}

// Extend the ApiClient with discovery-specific methods
export class DiscoveryClient {
  // Get personalized discovery feed
  static async getDiscoveryFeed(request: DiscoveryFeedRequest): Promise<ApiResponse<DiscoveryFeedResponse>> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tinerary.app/v1"
    const response = await fetch(`${API_URL}/discovery/feed`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })

    return handleResponse<DiscoveryFeedResponse>(response)
  }

  // Get recommendations similar to an item
  static async getSimilarItems(itemId: string, itemType: string): Promise<ApiResponse<RecommendationItem[]>> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tinerary.app/v1"
    const response = await fetch(`${API_URL}/discovery/similar?itemId=${itemId}&itemType=${itemType}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<RecommendationItem[]>(response)
  }

  // Log user interaction for better recommendations
  static async logInteraction(
    itemId: string,
    itemType: string,
    interactionType: "view" | "like" | "save" | "share" | "book",
  ): Promise<ApiResponse<void>> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.tinerary.app/v1"
    const response = await fetch(`${API_URL}/discovery/interaction`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        itemId,
        itemType,
        interactionType,
        timestamp: new Date().toISOString(),
      }),
    })

    return handleResponse<void>(response)
  }
}
