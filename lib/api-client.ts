import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Itinerary,
  CreateItineraryRequest,
  UpdateItineraryRequest,
  Activity,
  Expense,
  CreateExpenseRequest,
  PackingItem,
  CreatePackingItemRequest,
  Photo,
  Promotion,
  CreatePromotionRequest,
  Deal,
  Comment,
  CreateCommentRequest,
  SearchRequest,
  SearchResponse,
} from "./api-types"
import { config } from "./config"

// Ensure the API_URL is properly used with the environment variable
// Update the API_URL declaration to handle the environment variable more safely:

// API Configuration
const API_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "https://api.tinerary.app/v1"

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    // Try to parse error response
    try {
      const errorData = await response.json()
      return {
        error: {
          code: errorData.code || `${response.status}`,
          message: errorData.message || response.statusText,
          details: errorData.details,
        },
      }
    } catch (e) {
      // If error response cannot be parsed
      return {
        error: {
          code: `${response.status}`,
          message: response.statusText,
        },
      }
    }
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return {}
  }

  // Parse successful response
  const data = await response.json()
  return { data }
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token")
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

// API Client Class
export class ApiClient {
  // Auth APIs
  static async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    const result = await handleResponse<AuthResponse>(response)

    // Store token if login successful
    if (result.data?.token) {
      localStorage.setItem("auth_token", result.data.token)
    }

    return result
  }

  static async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    const result = await handleResponse<AuthResponse>(response)

    // Store token if registration successful
    if (result.data?.token) {
      localStorage.setItem("auth_token", result.data.token)
    }

    return result
  }

  static async logout(): Promise<void> {
    localStorage.removeItem("auth_token")
    // Optionally call logout endpoint to invalidate token on server
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
  }

  static async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<User>(response)
  }

  static async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    return handleResponse<User>(response)
  }

  // Itinerary APIs
  static async getItineraries(page = 1, pageSize = 10): Promise<ApiResponse<Itinerary[]>> {
    const response = await fetch(`${API_URL}/itineraries?page=${page}&pageSize=${pageSize}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Itinerary[]>(response)
  }

  static async getItinerary(id: string): Promise<ApiResponse<Itinerary>> {
    const response = await fetch(`${API_URL}/itineraries/${id}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Itinerary>(response)
  }

  static async createItinerary(itinerary: CreateItineraryRequest): Promise<ApiResponse<Itinerary>> {
    const response = await fetch(`${API_URL}/itineraries`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(itinerary),
    })

    return handleResponse<Itinerary>(response)
  }

  static async updateItinerary(id: string, updates: UpdateItineraryRequest): Promise<ApiResponse<Itinerary>> {
    const response = await fetch(`${API_URL}/itineraries/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    return handleResponse<Itinerary>(response)
  }

  static async deleteItinerary(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/itineraries/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  // Activity APIs
  static async addActivity(
    itineraryId: string,
    activity: Omit<Activity, "id" | "itineraryId">,
  ): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/activities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(activity),
    })

    return handleResponse<Activity>(response)
  }

  static async updateActivity(
    itineraryId: string,
    activityId: string,
    updates: Partial<Activity>,
  ): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/activities/${activityId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    return handleResponse<Activity>(response)
  }

  static async deleteActivity(itineraryId: string, activityId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/activities/${activityId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  static async respondToActivity(
    itineraryId: string,
    activityId: string,
    response: "yes" | "no" | "maybe",
  ): Promise<ApiResponse<Activity>> {
    const resp = await fetch(`${API_URL}/itineraries/${itineraryId}/activities/${activityId}/rsvp`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ response }),
    })

    return handleResponse<Activity>(resp)
  }

  // Expense APIs
  static async getExpenses(itineraryId: string): Promise<ApiResponse<Expense[]>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/expenses`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Expense[]>(response)
  }

  static async createExpense(expense: CreateExpenseRequest): Promise<ApiResponse<Expense>> {
    const response = await fetch(`${API_URL}/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(expense),
    })

    return handleResponse<Expense>(response)
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<ApiResponse<Expense>> {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    return handleResponse<Expense>(response)
  }

  static async deleteExpense(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  // Packing List APIs
  static async getPackingList(itineraryId: string): Promise<ApiResponse<PackingItem[]>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/packing-list`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<PackingItem[]>(response)
  }

  static async addPackingItem(item: CreatePackingItemRequest): Promise<ApiResponse<PackingItem>> {
    const response = await fetch(`${API_URL}/packing-items`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    })

    return handleResponse<PackingItem>(response)
  }

  static async updatePackingItem(id: string, updates: Partial<PackingItem>): Promise<ApiResponse<PackingItem>> {
    const response = await fetch(`${API_URL}/packing-items/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    return handleResponse<PackingItem>(response)
  }

  static async deletePackingItem(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/packing-items/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  // Photo Gallery APIs
  static async getPhotos(itineraryId: string): Promise<ApiResponse<Photo[]>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/photos`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Photo[]>(response)
  }

  static async uploadPhoto(itineraryId: string, formData: FormData): Promise<ApiResponse<Photo>> {
    const token = localStorage.getItem("auth_token")
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      // Don't set Content-Type here, it will be set automatically with the boundary
    }

    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/photos`, {
      method: "POST",
      headers,
      body: formData,
    })

    return handleResponse<Photo>(response)
  }

  static async deletePhoto(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/photos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  // Promotion APIs
  static async getPromotions(page = 1, pageSize = 10): Promise<ApiResponse<Promotion[]>> {
    const response = await fetch(`${API_URL}/promotions?page=${page}&pageSize=${pageSize}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Promotion[]>(response)
  }

  static async getPromotion(id: string): Promise<ApiResponse<Promotion>> {
    const response = await fetch(`${API_URL}/promotions/${id}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Promotion>(response)
  }

  static async createPromotion(promotion: CreatePromotionRequest): Promise<ApiResponse<Promotion>> {
    const response = await fetch(`${API_URL}/promotions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(promotion),
    })

    return handleResponse<Promotion>(response)
  }

  // Deal APIs
  static async getDeals(
    type?: "hotel" | "flight" | "activity" | "restaurant",
    page = 1,
    pageSize = 10,
  ): Promise<ApiResponse<Deal[]>> {
    const typeParam = type ? `&type=${type}` : ""
    const response = await fetch(`${API_URL}/deals?page=${page}&pageSize=${pageSize}${typeParam}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Deal[]>(response)
  }

  static async getDeal(id: string): Promise<ApiResponse<Deal>> {
    const response = await fetch(`${API_URL}/deals/${id}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Deal>(response)
  }

  // Comment APIs
  static async getComments(itineraryId: string): Promise<ApiResponse<Comment[]>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/comments`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<Comment[]>(response)
  }

  static async addComment(comment: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    const response = await fetch(`${API_URL}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(comment),
    })

    return handleResponse<Comment>(response)
  }

  static async deleteComment(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/comments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }

  // Social APIs
  static async likeItinerary(id: string): Promise<ApiResponse<{ likes: number }>> {
    const response = await fetch(`${API_URL}/itineraries/${id}/like`, {
      method: "POST",
      headers: getAuthHeaders(),
    })

    return handleResponse<{ likes: number }>(response)
  }

  static async unlikeItinerary(id: string): Promise<ApiResponse<{ likes: number }>> {
    const response = await fetch(`${API_URL}/itineraries/${id}/like`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<{ likes: number }>(response)
  }

  static async saveItinerary(id: string): Promise<ApiResponse<{ saves: number }>> {
    const response = await fetch(`${API_URL}/itineraries/${id}/save`, {
      method: "POST",
      headers: getAuthHeaders(),
    })

    return handleResponse<{ saves: number }>(response)
  }

  static async unsaveItinerary(id: string): Promise<ApiResponse<{ saves: number }>> {
    const response = await fetch(`${API_URL}/itineraries/${id}/save`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<{ saves: number }>(response)
  }

  // Search API
  static async search(searchRequest: SearchRequest): Promise<ApiResponse<SearchResponse>> {
    const queryParams = new URLSearchParams()
    queryParams.append("query", searchRequest.query)

    if (searchRequest.filters) {
      Object.entries(searchRequest.filters).forEach(([key, value]) => {
        if (value) queryParams.append(`filter[${key}]`, value)
      })
    }

    if (searchRequest.page) queryParams.append("page", searchRequest.page.toString())
    if (searchRequest.pageSize) queryParams.append("pageSize", searchRequest.pageSize.toString())

    const response = await fetch(`${API_URL}/search?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<SearchResponse>(response)
  }

  // Discovery Feed API
  static async getDiscoveryFeed(page = 1, pageSize = 10): Promise<ApiResponse<(Itinerary | Promotion)[]>> {
    const response = await fetch(`${API_URL}/discovery?page=${page}&pageSize=${pageSize}`, {
      headers: getAuthHeaders(),
    })

    return handleResponse<(Itinerary | Promotion)[]>(response)
  }

  // Collaboration APIs
  static async inviteCollaborator(
    itineraryId: string,
    email: string,
    role: "editor" | "viewer",
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/collaborators`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    })

    return handleResponse<void>(response)
  }

  static async respondToInvitation(invitationId: string, response: "accept" | "decline"): Promise<ApiResponse<void>> {
    const resp = await fetch(`${API_URL}/invitations/${invitationId}/respond`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ response }),
    })

    return handleResponse<void>(resp)
  }

  static async removeCollaborator(itineraryId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_URL}/itineraries/${itineraryId}/collaborators/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    return handleResponse<void>(response)
  }
}

// Base API client for making requests to our backend
export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${config.apiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },
}
